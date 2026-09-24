"""Add opening stock to an existing, marked forecast demonstration database."""
import argparse
import json
from contextlib import closing
from pathlib import Path
from .database import PROJECT_ROOT
from .seed_synthetic_stock import connect, encode, fingerprint

GENERATION = 'forecast-demo-stock-v1'
WAREHOUSE = 'Synthetic Forecast Warehouse'
# Hand-selected demo quantities, not replenishment recommendations.
STOCK = {
    'DEMO-STEADY': (20, 8, 'fully_stocked'),
    'DEMO-VARIABLE': (3, 6, 'low_stock'),
    'DEMO-ZERO': (2, 1, 'fully_stocked'),
    'DEMO-GAP': (0, 4, 'stockout'),
}


def inspect(c):
    if not c.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='forecast_demo_metadata'").fetchone():
        raise ValueError('Target is not a marked forecast demo database')
    if c.execute('SELECT COUNT(*) FROM forecast_demo_metadata').fetchone()[0] != 1:
        raise ValueError('Missing or ambiguous forecast demo marker')
    items = {r['sku']: r['id'] for r in c.execute('SELECT id,sku FROM catalog_items')}
    if not set(STOCK).issubset(items):
        raise ValueError('Required forecast demo SKUs are missing')
    generation = c.execute('SELECT * FROM synthetic_stock_generations WHERE generation_id=?', (GENERATION,)).fetchone()
    if generation:
        entries = list(c.execute('SELECT * FROM synthetic_stock_entries WHERE generation_id=?', (GENERATION,)))
        expected = {(items[sku], quantity, level, scenario) for sku, (quantity, level, scenario) in STOCK.items()}
        actual = {(r['catalog_item_id'], r['opening_quantity'], r['reorder_level'], r['scenario']) for r in entries}
        if generation['config_hash'] != fingerprint(STOCK) or actual != expected:
            raise ValueError('Existing stock generation conflicts with this configuration')
        return items, 'skipped'
    for item in (items[sku] for sku in STOCK):
        if c.execute('SELECT 1 FROM catalog_inventory WHERE catalog_item_id=?', (item,)).fetchone():
            raise ValueError('Demo SKU already has stock outside this generation; refusing to replace it')
    return items, 'ready'


def generate(target, *, commit=False):
    target = Path(target).resolve()
    if not target.is_file():
        raise ValueError('Create the forecast demo database first')
    with closing(connect(target, readonly=not commit)) as c:
        with c:
            if commit:
                c.execute('BEGIN IMMEDIATE')
            items, status = inspect(c)
            if commit and status == 'ready':
                c.execute('INSERT OR IGNORE INTO warehouses(name) VALUES (?)', (WAREHOUSE,))
                warehouse = c.execute('SELECT id FROM warehouses WHERE name=?', (WAREHOUSE,)).fetchone()[0]
                c.execute('''INSERT INTO synthetic_stock_generations(generation_id,seed,config_json,
                    config_hash,source_snapshot_hash,warehouse_id) VALUES (?,0,?,?,?,?)''',
                    (GENERATION, encode(STOCK), fingerprint(STOCK), fingerprint({sku: items[sku] for sku in STOCK}), warehouse))
                for sku, (quantity, level, scenario) in STOCK.items():
                    item = items[sku]
                    c.execute('INSERT INTO catalog_inventory VALUES (?,?,?,?)', (warehouse, item, quantity, level))
                    movement = None
                    if quantity:
                        movement = c.execute('''INSERT INTO inventory_movements(operation_key,warehouse_id,
                            catalog_item_id,quantity_delta,kind,reason) VALUES (?,?,?,?,'SYNTHETIC_OPENING',?)''',
                            (f'{GENERATION}:{sku}', warehouse, item, quantity, 'Synthetic forecast demo opening stock')).lastrowid
                    c.execute('''INSERT INTO synthetic_stock_entries(generation_id,warehouse_id,catalog_item_id,
                        identity_json,opening_quantity,reorder_level,scenario,opening_movement_id)
                        VALUES (?,?,?,?,?,?,?,?)''',
                        (GENERATION, warehouse, item, encode({'sku': sku, 'fitment': 'UNSPECIFIED'}), quantity, level, scenario, movement))
                status = 'created'
    return {'database': str(target), 'status': status, 'mode': 'commit' if commit else 'dry-run',
            'warehouse': WAREHOUSE, 'opening_units': 25,
            'entries': [{'sku': sku, 'quantity': values[0], 'reorder_level': values[1], 'scenario': values[2]} for sku, values in STOCK.items()]}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--database', type=Path, default=PROJECT_ROOT / 'api/forecast_demo.db')
    parser.add_argument('--commit', action='store_true')
    args = parser.parse_args()
    try:
        print(json.dumps(generate(args.database, commit=args.commit), indent=2))
    except ValueError as exc:
        parser.error(str(exc))
