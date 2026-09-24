"""Saved forecasts and rolling four-week holdouts; no random train/test split."""
import json
from datetime import datetime, timedelta, timezone
from .forecasting import baseline, covered, stamp


def evaluate(connection, *, as_of, data_source='LIVE'):
    now = as_of.astimezone(timezone.utc)
    monday = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=now.weekday())
    samples = []
    eligible = 0
    # Four rolling origins, each with a fully elapsed four-week horizon.
    for offset in range(4, 8):
        origin = monday - timedelta(weeks=offset)
        prediction = baseline(connection, as_of=origin, data_source=data_source)
        for row in prediction['sku_rows']:
            eligible += 1
            if row['status'] != 'READY':
                continue
            coverage = list(connection.execute('''SELECT * FROM demand_coverage
                WHERE catalog_item_id=? AND data_source=? AND warehouse_id IS NULL
                AND recorded_at<=?''', (row['catalog_item_id'], data_source, stamp(now))))
            actuals = []
            for week in row['weeks']:
                if not covered(coverage, week['starts_at'], week['ends_at']):
                    break
                actual = connection.execute('''SELECT COALESCE(SUM(quantity_delta),0) FROM demand_events
                    WHERE catalog_item_id=? AND data_source=? AND occurred_at>=?
                    AND occurred_at<? AND recorded_at<=?''',
                    (row['catalog_item_id'], data_source, week['starts_at'], week['ends_at'], stamp(now))).fetchone()[0]
                if actual < 0:
                    break
                actuals.append(actual)
            if len(actuals) != 4:
                continue
            last_week = row['history'][-1]['units']
            for horizon, actual in enumerate(actuals, 1):
                samples.append({'catalog_item_id': row['catalog_item_id'], 'sku': row['sku'],
                    'origin': stamp(origin), 'horizon_week': horizon, 'actual_units': actual,
                    'predicted_units': row['weekly_units'], 'last_week_predicted_units': last_week,
                    'absolute_error': abs(actual - row['weekly_units']),
                    'last_week_absolute_error': abs(actual - last_week)})
    return {'status': 'AVAILABLE' if samples else 'INSUFFICIENT_HISTORY',
            'metric': 'MAE_WEEKLY_UNITS', 'origins_tested': 4,
            'first_origin': stamp(monday - timedelta(weeks=7)),
            'last_origin': stamp(monday - timedelta(weeks=4)),
            'eligible_sku_windows': eligible, 'evaluated_sku_windows': len(samples) // 4,
            'sample_count': len(samples),
            'mae': sum(s['absolute_error'] for s in samples) / len(samples) if samples else None,
            'last_week_mae': sum(s['last_week_absolute_error'] for s in samples) / len(samples) if samples else None,
            'samples': samples}


def load_run(connection, run_id):
    row = connection.execute('SELECT * FROM forecast_runs WHERE id=?', (run_id,)).fetchone()
    if row is None:
        return None
    return {'id': row['id'], 'request_key': row['request_key'], 'created_at': row['created_at'],
            'method_version': row['method_version'], 'forecast': json.loads(row['forecast_json']),
            'evaluation': json.loads(row['evaluation_json'])}


def save_run(connection, request_key, *, data_source='LIVE', as_of=None):
    """Caller holds BEGIN IMMEDIATE; forecast, evaluation and rows commit together."""
    existing = connection.execute('SELECT id,data_source FROM forecast_runs WHERE request_key=?', (request_key,)).fetchone()
    if existing:
        if existing['data_source'] != data_source:
            raise ValueError('Request key already used with a different source')
        return load_run(connection, existing['id'])
    now = as_of or datetime.now(timezone.utc)
    prediction = baseline(connection, as_of=now, data_source=data_source)
    evaluation = evaluate(connection, as_of=now, data_source=data_source)
    run_id = connection.execute('''INSERT INTO forecast_runs(request_key,data_source,created_at,
        method_version,forecast_json,evaluation_json) VALUES (?,?,?,'eight-week-mean-v1',?,?)''',
        (request_key, data_source, stamp(now), json.dumps(prediction), json.dumps(evaluation))).lastrowid
    for row in prediction['sku_rows']:
        for week in row['weeks']:
            connection.execute('''INSERT INTO forecast_results VALUES (?,?,?,?,?,?)''',
                (run_id, row['catalog_item_id'], week['starts_at'], week['ends_at'], week['units'], row['status']))
    return load_run(connection, run_id)
