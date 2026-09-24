import sqlite3
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from .forecasting import baseline, stamp
from .forecast_runs import evaluate, save_run, load_run


class BaselineTests(unittest.TestCase):
    def setUp(self):
        self.c = sqlite3.connect(':memory:')
        self.c.row_factory = sqlite3.Row
        self.c.executescript(Path(__file__).with_name('schema.sql').read_text(encoding='utf-8'))
        self.c.execute("INSERT INTO parts(id,part_name) VALUES (1,'Test')")
        self.c.execute("INSERT INTO catalog_items(id,sku,part_id,display_name) VALUES (1,'TEST',1,'Test')")
        self.now = datetime(2026, 9, 24, tzinfo=timezone.utc)
        self.start = datetime(2026, 7, 27, tzinfo=timezone.utc)

    def tearDown(self):
        self.c.close()

    def coverage(self, start, end, status='COMPLETE', warehouse=None):
        self.c.execute('''INSERT INTO demand_coverage(coverage_key,catalog_item_id,data_source,
            source_reference,starts_at,ends_at,status,recorded_at,warehouse_id)
            VALUES (?,1,'LIVE','test',?,?,?,?,?)''',
            (str(self.c.total_changes), stamp(start), stamp(end), status, stamp(self.start), warehouse))

    def event(self, week, units, source='LIVE', recorded=None):
        self.c.execute('''INSERT INTO demand_events(event_key,catalog_item_id,data_source,
            source_reference,event_type,quantity_delta,occurred_at,recorded_at)
            VALUES (?,1,?,'test','REQUESTED',?,?,?)''',
            (str(self.c.total_changes), source, units, stamp(self.start + timedelta(weeks=week)), recorded or stamp(self.start)))

    def result(self):
        return baseline(self.c, as_of=self.now)

    def test_mean_and_exclusions(self):
        self.coverage(self.start, self.start + timedelta(weeks=4))
        self.coverage(self.start + timedelta(weeks=4), self.start + timedelta(weeks=8))
        for week, units in enumerate([2, 0, 4, 2, 3, 1, 2, 2]):
            if units:
                self.event(week, units)
        self.event(8, 100)  # Current incomplete week
        self.event(0, 100, 'SYNTHETIC')
        self.event(0, 100, recorded='2027-01-01T00:00:00Z')
        result = self.result()
        self.assertEqual(result['status'], 'READY')
        self.assertEqual(result['units'], 8)
        self.assertEqual([w['units'] for w in result['sku_rows'][0]['weeks']], [2] * 4)

    def test_missing_coverage_is_not_zero(self):
        self.event(0, 10)
        self.assertIsNone(self.result()['units'])
        self.assertIsNone(self.result()['sku_rows'][0]['history'][0]['units'])
        self.coverage(self.start, self.start + timedelta(weeks=8))
        self.coverage(self.start + timedelta(days=2), self.start + timedelta(days=3), 'GAP')
        self.assertEqual(self.result()['sku_rows'][0]['complete_weeks'], 7)
        self.assertIsNone(self.result()['units'])

    def test_verified_zero_and_partial_catalog(self):
        self.coverage(self.start, self.start + timedelta(weeks=8))
        self.assertEqual(self.result()['units'], 0)
        self.c.execute("INSERT INTO catalog_items(id,sku,part_id,display_name) VALUES (2,'OTHER',1,'Other')")
        self.assertEqual(self.result()['status'], 'PARTIAL')
        self.assertIsNone(self.result()['units'])

    def test_gap_between_intervals(self):
        self.coverage(self.start, self.start + timedelta(days=3))
        self.coverage(self.start + timedelta(days=4), self.start + timedelta(weeks=8))
        self.assertIsNone(self.result()['units'])

    def test_empty_catalog(self):
        self.c.execute('DELETE FROM catalog_items')
        self.assertEqual(self.result()['status'], 'NO_CATALOG')
        self.assertIsNone(self.result()['units'])

    def test_warehouse_coverage_does_not_prove_global_coverage(self):
        self.c.execute("INSERT INTO warehouses(id,name) VALUES (1,'Test')")
        self.coverage(self.start, self.start + timedelta(weeks=8), warehouse=1)
        self.assertIsNone(self.result()['units'])

    def test_negative_week_is_invalid(self):
        self.coverage(self.start, self.start + timedelta(weeks=8))
        self.event(0, 1)
        self.c.execute('''INSERT INTO demand_events(event_key,catalog_item_id,data_source,
            source_reference,event_type,quantity_delta,occurred_at,recorded_at,related_event_id,reason)
            VALUES ('cancel',1,'LIVE','test','CANCELLED',-1,?,?,1,'Cancelled later')''',
            (stamp(self.start + timedelta(weeks=1)), stamp(self.start)))
        self.assertEqual(self.result()['sku_rows'][0]['status'], 'INVALID_HISTORY')
        self.assertIsNone(self.result()['units'])

    def test_holdout_accuracy_and_no_training_leakage(self):
        # At the earliest origin, eight training weeks have quantity 2.
        # Four later holdout weeks have quantity 6; late-recorded training
        # demand must not change that origin's prediction.
        self.start = datetime(2026, 6, 8, tzinfo=timezone.utc)
        self.coverage(self.start, self.start + timedelta(weeks=15))
        for week in range(15):
            self.event(week, 2 if week < 8 else 6)
        self.event(0, 100, recorded=stamp(self.now))
        result = evaluate(self.c, as_of=self.now)
        earliest = [s for s in result['samples'] if s['origin'] == result['first_origin']]
        self.assertEqual(len(earliest), 4)
        self.assertEqual([s['predicted_units'] for s in earliest], [2] * 4)
        self.assertEqual([s['absolute_error'] for s in earliest], [4] * 4)
        self.assertEqual(result['sample_count'], 16)
        self.assertEqual(result['mae'], 3.25)
        self.assertEqual(result['last_week_mae'], 1)
        self.coverage(self.start + timedelta(weeks=11), self.start + timedelta(weeks=12), 'GAP')
        self.assertEqual(evaluate(self.c, as_of=self.now)['sample_count'], 0)

    def test_persistence_replay_and_unavailable_metrics(self):
        result = save_run(self.c, 'request-1', as_of=self.now)
        self.assertIsNone(result['evaluation']['mae'])
        self.assertEqual(result['evaluation']['sample_count'], 0)
        self.assertEqual(self.c.execute('SELECT COUNT(*) FROM forecast_results').fetchone()[0], 4)
        self.assertEqual(save_run(self.c, 'request-1', as_of=self.now + timedelta(weeks=1)), result)
        self.assertEqual(load_run(self.c, result['id']), result)
        with self.assertRaises(ValueError):
            save_run(self.c, 'request-1', data_source='SYNTHETIC', as_of=self.now)
        self.assertEqual(self.c.execute('SELECT COUNT(*) FROM forecast_runs').fetchone()[0], 1)

    def test_save_failure_rolls_back_entire_run(self):
        self.c.commit()
        self.c.execute("""CREATE TRIGGER fail_result BEFORE INSERT ON forecast_results
            BEGIN SELECT RAISE(ABORT, 'test failure'); END""")
        with self.assertRaises(sqlite3.IntegrityError):
            with self.c:
                self.c.execute('BEGIN IMMEDIATE')
                save_run(self.c, 'rollback-test', as_of=self.now)
        self.assertEqual(self.c.execute('SELECT COUNT(*) FROM forecast_runs').fetchone()[0], 0)
        self.assertEqual(self.c.execute('SELECT COUNT(*) FROM forecast_results').fetchone()[0], 0)

    def test_verified_zero_holdout_has_zero_error(self):
        self.start = datetime(2026, 6, 8, tzinfo=timezone.utc)
        self.coverage(self.start, self.start + timedelta(weeks=15))
        result = evaluate(self.c, as_of=self.now)
        self.assertEqual(result['status'], 'AVAILABLE')
        self.assertEqual(result['sample_count'], 16)
        self.assertEqual(result['mae'], 0)
