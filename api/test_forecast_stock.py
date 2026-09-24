import sqlite3
import tempfile
import unittest
from contextlib import closing
from pathlib import Path
from unittest.mock import patch
from fastapi.testclient import TestClient
from . import database, main
from .seed_forecast_demo import generate as create_demo
from .seed_forecast_stock import generate


class ForecastStockTests(unittest.TestCase):
    def test_stock_visibility_and_retry_without_topup(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'demo.db'
            create_demo(path, commit=True)
            before = path.read_bytes()
            self.assertEqual(generate(path)['status'], 'ready')
            self.assertEqual(path.read_bytes(), before)
            self.assertEqual(generate(path, commit=True)['status'], 'created')
            with patch.object(database, 'DATABASE_PATH', path), TestClient(main.app) as client:
                rows = client.get('/api/stock').json()
                self.assertEqual(len(rows), 4)
                self.assertEqual(sum(r['quantity'] for r in rows), 25)
                self.assertTrue(all(r['synthetic'] for r in rows))
                summary = client.get('/api/demand-summary').json()
                self.assertEqual(summary['catalog_on_hand'], 25)
                self.assertEqual(summary['low_availability_records'], 1)
                self.assertEqual(summary['stockout_records'], 1)
                self.assertEqual(len(client.get('/api/demand-forecast-runs').json()), 2)
            with closing(sqlite3.connect(path)) as c:
                c.execute('UPDATE catalog_inventory SET quantity=quantity-1 WHERE quantity=20')
                c.commit()
            self.assertEqual(generate(path, commit=True)['status'], 'skipped')
            with closing(sqlite3.connect(path)) as c:
                self.assertEqual(c.execute('SELECT SUM(quantity) FROM catalog_inventory').fetchone()[0], 24)
                self.assertEqual(c.execute('SELECT COUNT(*) FROM inventory_movements').fetchone()[0], 3)
                self.assertEqual(c.execute('SELECT COUNT(*) FROM demand_events').fetchone()[0], 45)
                self.assertEqual(c.execute('PRAGMA foreign_key_check').fetchall(), [])

    def test_unmarked_database_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'ordinary.db'
            with closing(sqlite3.connect(path)) as c:
                c.execute('CREATE TABLE example(id INTEGER)')
            before = path.read_bytes()
            with self.assertRaises(ValueError):
                generate(path, commit=True)
            self.assertEqual(path.read_bytes(), before)
