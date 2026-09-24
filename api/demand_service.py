"""Capture requested units in the caller's transaction, separately from stock."""


def record_requested_demand(connection, line_id, *, claim_source=None, use_order_date=False):
    line = connection.execute('''SELECT l.*, f.created_at AS order_created_at,
        c.source_type AS claim_source FROM fulfillment_order_lines l
        JOIN fulfillment_orders f ON f.id=l.fulfillment_order_id
        LEFT JOIN claim_conversions cv ON cv.fulfillment_order_id=f.id
        LEFT JOIN claims c ON c.id=cv.claim_id WHERE l.id=?''', (line_id,)).fetchone()
    if line is None:
        raise ValueError('Fulfillment line does not exist')
    if line['catalog_item_id'] is None:
        return None
    source = 'HISTORICAL' if (claim_source or line['claim_source']) == 'TRAINING_DATASET' else 'LIVE'
    if connection.execute('SELECT 1 FROM synthetic_stock_generations LIMIT 1').fetchone():
        source = 'SYNTHETIC'
    key = f'fulfillment-line:{line_id}:requested'
    existing = connection.execute('SELECT * FROM demand_events WHERE event_key=?', (key,)).fetchone()
    if existing:
        if (existing['source_line_id'], existing['catalog_item_id'], existing['quantity_delta']) != (line_id, line['catalog_item_id'], line['quantity']):
            raise ValueError('Existing demand event conflicts with fulfillment line')
        return existing['id']
    occurred = connection.execute("SELECT strftime('%Y-%m-%dT%H:%M:%SZ', ?)", (line['order_created_at'],)).fetchone()[0] if use_order_date else connection.execute("SELECT strftime('%Y-%m-%dT%H:%M:%SZ','now')").fetchone()[0]
    return connection.execute('''INSERT INTO demand_events(event_key,catalog_item_id,source_line_id,
        data_source,source_reference,event_type,quantity_delta,occurred_at)
        VALUES (?,?,?,?,?,'REQUESTED',?,?)''', (key, line['catalog_item_id'], line_id, source,
        f"fulfillment-order:{line['fulfillment_order_id']}", line['quantity'], occurred)).lastrowid
