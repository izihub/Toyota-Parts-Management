"""API acceptance test on an isolated SQLite backup of the seeded demo."""
from contextlib import closing
from pathlib import Path
import sqlite3
import tempfile
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from . import database, main
from .seed_synthetic_stock import generate


class DemoStockWorkflowTests(unittest.TestCase):
    def test_demo_reservation_shortage_dispatch_delivery_and_seed_replay(self):
        demo = database.PROJECT_ROOT / 'api/demo_parts.db'
        self.assertTrue(demo.exists(), 'Seed the demo database before running this acceptance test.')
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / 'workflow.db'
            with closing(sqlite3.connect(demo.resolve().as_uri() + '?mode=ro', uri=True)) as source, closing(sqlite3.connect(target)) as backup:
                source.backup(backup)
            with patch.object(database, 'DATABASE_PATH', target), TestClient(main.app) as client:
                stock = client.get('/api/stock').json()
                baseline = {row['sku']: row['quantity'] for row in stock}
                self.assertEqual(sum(baseline.values()), 44)
                catalog = {item['sku']: item for item in client.get('/api/catalog').json()}
                with database.get_connection() as c:
                    groups = {scenario: [r[0] for r in c.execute('SELECT i.sku FROM synthetic_stock_entries e JOIN catalog_items i ON i.id=e.catalog_item_id WHERE e.scenario=? ORDER BY i.sku', (scenario,))] for scenario in ('fully_stocked', 'low_stock', 'stockout')}
                response = client.post('/api/workshops', json={'name': 'Demo acceptance workshop', 'organization': 'Synthetic test'})
                self.assertEqual(response.status_code, 200, response.text)

                def order(skus):
                    lines = []
                    for sku in skus:
                        item = catalog[sku]
                        fit = item['fitments'][0]
                        lines.append({'sku': sku, 'part_name': item['part_name'], 'vehicle_model': fit['model'], 'make_year': fit['make_year'], 'quantity': 2, 'unit_price': 100})
                    response = client.post('/api/fulfillment', json={'workshop_name': 'Demo acceptance workshop', 'parts': lines})
                    self.assertEqual(response.status_code, 200, response.text)
                    return '/api/fulfillment/' + response.json()['id'].replace('fulfill-', '')

                def reserve(url):
                    return client.post(url + '/reserve', json={'warehouse_name': 'Demo Warehouse'})

                def totals():
                    rows = client.get('/api/stock').json()
                    return tuple(sum(row[key] for row in rows) for key in ('quantity', 'reserved_quantity', 'available_quantity'))

                # A valid line first proves the entire reservation rolls back on shortage.
                for scenario in ('low_stock', 'stockout'):
                    url = order([groups['fully_stocked'][0], *groups[scenario]])
                    self.assertEqual(reserve(url).status_code, 409)
                    self.assertEqual(totals(), (44, 0, 44))
                self.assertEqual(len(client.get('/api/inventory/movements').json()), 8)

                url = order(groups['fully_stocked'])
                self.assertEqual(client.patch(url, params={'status': 'IN TRANSIT'}).status_code, 409)
                self.assertEqual(client.patch(url, params={'status': 'FULFILLED'}).status_code, 409)
                self.assertEqual(reserve(url).status_code, 200)
                self.assertTrue(reserve(url).json()['replayed'])
                self.assertEqual(totals(), (44, 8, 36))
                for _ in range(2):
                    self.assertEqual(client.post(url + '/release').status_code, 200)
                self.assertEqual(totals(), (44, 0, 44))
                self.assertEqual(reserve(url).status_code, 200)
                for _ in range(2):
                    self.assertEqual(client.patch(url, params={'status': 'IN TRANSIT'}).status_code, 200)
                    self.assertEqual(totals(), (36, 0, 36))
                self.assertEqual(client.post(url + '/release').status_code, 409)
                for _ in range(2):
                    self.assertEqual(client.patch(url, params={'status': 'FULFILLED'}).status_code, 200)
                    self.assertEqual(totals(), (36, 0, 36))
                self.assertEqual(client.patch(url, params={'status': 'PENDING'}).status_code, 409)
                events = client.get('/api/inventory/movements').json()
                self.assertEqual(len([m for m in events if m['kind'] == 'DISPATCH']), 4)
                with database.get_connection() as c:
                    for row in c.execute('SELECT * FROM catalog_inventory'):
                        ledger = c.execute('SELECT COALESCE(SUM(quantity_delta),0), COALESCE(SUM(reservation_delta),0) FROM inventory_movements WHERE warehouse_id=? AND catalog_item_id=?', (row['warehouse_id'], row['catalog_item_id'])).fetchone()
                        self.assertEqual(tuple(ledger), (row['quantity'], 0))
                    self.assertEqual(c.execute('PRAGMA foreign_key_check').fetchall(), [])
                result = generate(database.PROJECT_ROOT / 'api/synthetic_stock_config.json', commit=True, target=target)
                self.assertEqual(result['status'], 'skipped')
                self.assertEqual(totals(), (36, 0, 36))
                self.assertEqual(len(client.get('/api/inventory/movements').json()), len(events))
                database.init_database()
                self.assertEqual(totals(), (36, 0, 36))
            with closing(sqlite3.connect(demo.resolve().as_uri() + '?mode=ro', uri=True)) as c:
                self.assertEqual(c.execute('SELECT SUM(quantity) FROM catalog_inventory').fetchone()[0], 44)
