"""Read-only weekly mean baseline. Coverage is evidence, never inferred."""
from datetime import datetime, timedelta, timezone


def stamp(value):
    return value.strftime('%Y-%m-%dT%H:%M:%SZ')


def covered(rows, start, end):
    if any(r['status'] == 'GAP' and r['starts_at'] < end and r['ends_at'] > start for r in rows):
        return False
    cursor = start
    for row in sorted(rows, key=lambda r: r['starts_at']):
        if row['status'] != 'COMPLETE' or row['ends_at'] <= cursor:
            continue
        if row['starts_at'] > cursor:
            break
        cursor = max(cursor, row['ends_at'])
        if cursor >= end:
            return True
    return False


def baseline(connection, *, as_of=None, data_source='LIVE'):
    if data_source not in ('LIVE', 'HISTORICAL', 'SYNTHETIC'):
        raise ValueError('Unknown demand source')
    now = as_of or datetime.now(timezone.utc)
    if now.tzinfo is None:
        raise ValueError('as_of must include a timezone')
    now = now.astimezone(timezone.utc)
    origin = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=now.weekday())
    start = origin - timedelta(weeks=8)
    rows = []
    for item in connection.execute('SELECT id,sku FROM catalog_items ORDER BY sku'):
        coverage = list(connection.execute('''SELECT * FROM demand_coverage
            WHERE catalog_item_id=? AND data_source=? AND warehouse_id IS NULL
            AND recorded_at<=? AND starts_at<? AND ends_at>?''',
            (item['id'], data_source, stamp(now), stamp(origin), stamp(start))))
        events = list(connection.execute('''SELECT occurred_at,quantity_delta FROM demand_events
            WHERE catalog_item_id=? AND data_source=? AND recorded_at<=?
            AND occurred_at>=? AND occurred_at<?''',
            (item['id'], data_source, stamp(now), stamp(start), stamp(origin))))
        history = []
        for index in range(8):
            left = stamp(start + timedelta(weeks=index))
            right = stamp(start + timedelta(weeks=index + 1))
            complete = covered(coverage, left, right)
            units = sum(e['quantity_delta'] for e in events if left <= e['occurred_at'] < right)
            history.append({'starts_at': left, 'ends_at': right, 'complete': complete,
                            'units': units if complete else None})
        complete_weeks = sum(w['complete'] for w in history)
        status = 'INSUFFICIENT_HISTORY' if complete_weeks < 8 else 'INVALID_HISTORY' if any(w['units'] < 0 for w in history) else 'READY'
        mean = sum(w['units'] for w in history) / 8 if status == 'READY' else None
        rows.append({'catalog_item_id': item['id'], 'sku': item['sku'], 'status': status,
                     'complete_weeks': complete_weeks, 'history': history,
                     'weekly_units': mean, 'units': mean * 4 if mean is not None else None,
                     'weeks': [{'starts_at': stamp(origin + timedelta(weeks=i)),
                                'ends_at': stamp(origin + timedelta(weeks=i + 1)),
                                'units': mean} for i in range(4)]})
    ready = sum(r['status'] == 'READY' for r in rows)
    return {'method': 'EIGHT_WEEK_MEAN', 'data_source': data_source,
            'as_of': stamp(now), 'origin': stamp(origin), 'history_starts_at': stamp(start),
            'status': 'NO_CATALOG' if not rows else 'READY' if ready == len(rows) else 'PARTIAL' if ready else 'INSUFFICIENT_HISTORY',
            'ready_skus': ready, 'total_skus': len(rows),
            'units': sum(r['units'] for r in rows) if rows and ready == len(rows) else None,
            'sku_rows': rows}
