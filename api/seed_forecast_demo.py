"""Create a new, isolated database with deterministic synthetic forecast history."""
import argparse
import json
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
from .database import SCHEMA_PATH, PROJECT_ROOT
from .forecasting import stamp
from .forecast_runs import save_run


SCENARIOS = {
    'DEMO-STEADY': ('Synthetic bumper demand', [4] * 15),
    'DEMO-VARIABLE': ('Synthetic headlamp demand', [1, 2, 3, 4, 2] * 3),
    'DEMO-ZERO': ('Synthetic mirror demand', [0] * 15),
    'DEMO-GAP': ('Synthetic grille demand with missing coverage', [2] * 15),
}


def generate(target, *, commit=False, as_of=None):
    target = Path(target).resolve()
    now = as_of or datetime.now(timezone.utc)
    if now.tzinfo is None:
        raise ValueError('as_of must be timezone-aware')
    now = now.astimezone(timezone.utc)
    origin = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=now.weekday())
    start = origin - timedelta(weeks=15)
    report = {'database': str(target), 'committed': commit, 'source': 'SYNTHETIC',
              'as_of': stamp(now), 'history_starts_at': stamp(start), 'history_ends_at': stamp(origin),
              'skus': 4, 'weeks': 15, 'events': 45, 'coverage_intervals': 60,
              'note': 'Simulated occurrence and recording timestamps; not real observed history.'}
    if target.exists():
        raise ValueError('Target already exists. Choose a new filename; existing databases are never overwritten.')
    if not commit:
        return report
    target.parent.mkdir(parents=True, exist_ok=True)
    # Exclusive creation prevents an accidental overwrite, including a concurrent invocation.
    with target.open('xb'):
        pass
    c = sqlite3.connect(target)
    c.row_factory = sqlite3.Row
    try:
        c.executescript(SCHEMA_PATH.read_text(encoding='utf-8'))
        with c:
            c.execute('BEGIN IMMEDIATE')
            c.execute('CREATE TABLE forecast_demo_metadata (created_at TEXT NOT NULL, description TEXT NOT NULL)')
            c.execute('INSERT INTO forecast_demo_metadata VALUES (?,?)', (stamp(now), report['note']))
            for sku, (name, quantities) in SCENARIOS.items():
                part = c.execute('INSERT INTO parts(part_name) VALUES (?)', (name,)).lastrowid
                item = c.execute('INSERT INTO catalog_items(sku,part_id,display_name) VALUES (?,?,?)', (sku, part, name)).lastrowid
                for week, quantity in enumerate(quantities):
                    left = start + timedelta(weeks=week)
                    right = left + timedelta(weeks=1)
                    occurred = left + timedelta(days=2, hours=10)
                    key = f'forecast-demo:{sku}:{week}'
                    c.execute('''INSERT INTO demand_coverage(coverage_key,catalog_item_id,data_source,
                        source_reference,starts_at,ends_at,status,recorded_at,notes)
                        VALUES (?,?,'SYNTHETIC',?,?,?,?,?,?)''',
                        (key, item, key, stamp(left), stamp(right),
                         'GAP' if sku == 'DEMO-GAP' and week == 14 else 'COMPLETE', stamp(right), report['note']))
                    if quantity:
                        c.execute('''INSERT INTO demand_events(event_key,catalog_item_id,data_source,
                            source_reference,event_type,quantity_delta,occurred_at,recorded_at)
                            VALUES (?,?,'SYNTHETIC',?,'REQUESTED',?,?,?)''',
                            (key, item, key, quantity, stamp(occurred), stamp(occurred)))
            demo = save_run(c, 'forecast-demo-synthetic-v1', data_source='SYNTHETIC', as_of=now)
            live = save_run(c, 'forecast-demo-live-v1', data_source='LIVE', as_of=now)
            report.update(synthetic_run_id=demo['id'], live_run_id=live['id'],
                          forecast_status=demo['forecast']['status'],
                          ready_skus=demo['forecast']['ready_skus'], evaluation=demo['evaluation']['status'],
                          mae=demo['evaluation']['mae'], last_week_mae=demo['evaluation']['last_week_mae'],
                          evaluation_samples=demo['evaluation']['sample_count'])
            if c.execute('PRAGMA foreign_key_check').fetchall():
                raise ValueError('Demo database failed foreign-key validation')
    finally:
        c.close()
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--database', type=Path, default=PROJECT_ROOT / 'api/forecast_demo.db')
    parser.add_argument('--commit', action='store_true', help='Create a new database; otherwise preview only')
    args = parser.parse_args()
    try:
        print(json.dumps(generate(args.database, commit=args.commit), indent=2))
    except (ValueError, FileExistsError) as exc:
        parser.error(str(exc))


if __name__ == '__main__':
    main()
