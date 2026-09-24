import sqlite3
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from . import database


class DemandHistoryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.path = patch.object(database, 'DATABASE_PATH', Path(self.temp.name) / 'test.db')
        self.path.start()
        database.init_database()
        with database.get_connection() as c:
            part = c.execute("INSERT INTO parts(part_name) VALUES ('HISTORY TEST')").lastrowid
            c.execute("INSERT INTO catalog_items(id,sku,part_id,display_name) VALUES (1,'HISTORY',?,'Test')", (part,))

    def tearDown(self):
        self.path.stop()
        self.temp.cleanup()

    def event(self, key='request-1', quantity=2, kind='REQUESTED', related=None, reason=None):
        with database.get_connection() as c:
            return c.execute('''INSERT INTO demand_events(event_key,catalog_item_id,data_source,source_reference,
                event_type,quantity_delta,occurred_at,related_event_id,reason)
                VALUES (?,1,'LIVE','test',?,?,'2026-09-24T10:00:00Z',?,?)''',
                (key,kind,quantity,related,reason)).lastrowid

    def test_unique_immutable_events_and_signed_corrections(self):
        original = self.event()
        for args in [(), ('bad-zero',0), ('bad-fraction',1.5), ('bad-negative',-2)]:
            with self.assertRaises(sqlite3.IntegrityError):
                self.event(*args)
        for sql in ['UPDATE demand_events SET quantity_delta=4', 'DELETE FROM demand_events']:
            with self.assertRaises(sqlite3.IntegrityError), database.get_connection() as c:
                c.execute(sql)
        self.event('cancel',-1,'CANCELLED',original,'One unit no longer required')
        database.init_database()
        database.init_database()
        with database.get_connection() as c:
            self.assertEqual(c.execute('SELECT SUM(quantity_delta) FROM demand_events').fetchone()[0],1)
            self.assertEqual(c.execute('PRAGMA foreign_key_check').fetchall(),[])

    def test_coverage_constraints_and_no_fabricated_history(self):
        with database.get_connection() as c:
            self.assertEqual(c.execute('SELECT COUNT(*) FROM demand_events').fetchone()[0],0)
            self.assertEqual(c.execute('SELECT COUNT(*) FROM demand_coverage').fetchone()[0],0)
            sql = "INSERT INTO demand_coverage(coverage_key,catalog_item_id,data_source,source_reference,starts_at,ends_at,status) VALUES (?,1,'LIVE','test',?,?,'COMPLETE')"
            c.execute(sql,('week','2026-09-14T00:00:00Z','2026-09-21T00:00:00Z'))
            for key,start,end in [('week','2026-09-14T00:00:00Z','2026-09-21T00:00:00Z'),('reverse','2026-09-21T00:00:00Z','2026-09-14T00:00:00Z'),('invalid','not-a-date','2026-09-21T00:00:00Z')]:
                with self.assertRaises(sqlite3.IntegrityError):
                    c.execute(sql,(key,start,end))
        database.init_database()
        with database.get_connection() as c:
            self.assertEqual(c.execute('SELECT COUNT(*) FROM demand_coverage').fetchone()[0],1)
            self.assertEqual(c.execute('SELECT COUNT(*) FROM demand_events').fetchone()[0],0)
