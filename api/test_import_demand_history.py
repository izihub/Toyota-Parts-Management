import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from . import database
from .import_demand_history import run, normalize


class HistoricalOccurrenceTests(unittest.TestCase):
    def test_preview_import_replay_and_conflict(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'history.csv'
            target = Path(directory) / 'test.db'
            source.write_text('Accident ID,Model,Make Year,Month,Parts_Replaced\nA,AQUA NHP10,2013,SEP 2024,"BUMPER,BUMPER,LAMP"\nB,AQUA NHP10,2013,BAD,LAMP\n')
            with patch.object(database, 'DATABASE_PATH', target):
                self.assertEqual(run(source, 'test')['counts']['valid'], 1)
                self.assertFalse(target.exists())
                self.assertEqual(run(source, 'test', True)['counts']['created'], 1)
                before = target.read_bytes()
                self.assertEqual(run(source, 'test')['counts']['skipped'], 1)
                self.assertEqual(target.read_bytes(), before)
                self.assertEqual(run(source, 'test', True)['counts']['skipped'], 1)
                source.write_text(source.read_text().replace('SEP 2024','OCT 2024'))
                self.assertEqual(run(source, 'test', True)['counts']['conflict'], 1)
                with database.get_connection() as c:
                    self.assertEqual(c.execute('SELECT period_month FROM historical_demand_records').fetchone()[0], '2024-09')
                    self.assertEqual(c.execute('SELECT COUNT(*) FROM historical_part_occurrences').fetchone()[0], 2)
                    for table in ('claims','claim_predictions','demand_events','demand_coverage'):
                        self.assertEqual(c.execute(f'SELECT COUNT(*) FROM {table}').fetchone()[0], 0)
                    self.assertEqual(c.execute('PRAGMA foreign_key_check').fetchall(), [])

    def test_invalid_month_and_fractional_year(self):
        row = {'source_claim_id':'A','model':'AQUA','make_year':2013,'period_month':'2024-13','parts_replaced':'LAMP'}
        with self.assertRaises(ValueError): normalize(row)
        row.update(period_month='2024-01',make_year=2013.5)
        with self.assertRaises(ValueError): normalize(row)
