import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from fastapi.testclient import TestClient
from . import database, main


class DemandSummaryTests(unittest.TestCase):
    def test_forecast_run_api(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(database, 'DATABASE_PATH', Path(directory) / 'test.db'), TestClient(main.app) as client:
            self.assertEqual(client.get('/api/demand-forecast-runs').json(), [])
            payload = {'request_key': 'test-run'}
            result = client.post('/api/demand-forecast-runs', json=payload)
            self.assertEqual(result.status_code, 200)
            saved = result.json()
            self.assertEqual(saved['forecast']['status'], 'NO_CATALOG')
            self.assertIsNone(saved['evaluation']['mae'])
            self.assertEqual(client.post('/api/demand-forecast-runs', json=payload).json(), saved)
            self.assertEqual(client.get(f"/api/demand-forecast-runs/{saved['id']}").json(), saved)
            self.assertEqual(len(client.get('/api/demand-forecast-runs').json()), 1)
            self.assertEqual(client.post('/api/demand-forecast-runs', json={**payload, 'data_source': 'SYNTHETIC'}).status_code, 409)
            self.assertEqual(client.post('/api/demand-forecast-runs', json={'request_key': ' '}).status_code, 422)
            self.assertEqual(client.get('/api/demand-forecast-runs/999').status_code, 404)
            self.assertEqual(client.get('/api/demand-forecast-runs?limit=0').status_code, 422)

    def test_empty_and_multiwarehouse_demand_without_double_counting(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(database, 'DATABASE_PATH', Path(directory) / 'test.db'), TestClient(main.app) as client:
            empty = client.get('/api/demand-summary')
            self.assertEqual(empty.status_code, 200)
            self.assertEqual(empty.json()['available_units'], 0)
            self.assertEqual(empty.json()['sku_rows'], [])
            self.assertIsNone(empty.json()['forecast']['units'])
            with database.get_connection() as c:
                p = c.execute("INSERT INTO parts(part_name) VALUES ('DEMAND TEST')").lastrowid
                c.execute("INSERT INTO catalog_items(id,sku,part_id,display_name) VALUES (1,'TEST',?,'Test')", (p,))
                c.execute("INSERT INTO warehouses(id,name) VALUES (2,'Second')")
                c.execute('INSERT INTO catalog_inventory VALUES (1,1,5,3),(2,1,0,2)')
                c.execute("INSERT INTO workshops(id,name) VALUES (1,'Workshop')")
                c.execute("INSERT INTO fulfillment_orders(id,workshop_id,status) VALUES (1,1,'PENDING'),(2,1,'IN TRANSIT')")
                c.execute("INSERT INTO fulfillment_order_lines(id,fulfillment_order_id,part_name,quantity,catalog_item_id) VALUES (1,1,'DEMAND TEST',4,1),(2,1,'DEMAND TEST',3,1),(3,1,'LEGACY',6,NULL),(4,2,'DEMAND TEST',99,1)")
                c.execute('INSERT INTO stock_reservations VALUES (1,1,1,4)')
                v = c.execute("INSERT INTO vehicles(model,make_year) VALUES ('MODEL',2020)").lastrowid
                claim = c.execute("INSERT INTO claims(accident_id,vehicle_id,damage_zone) VALUES ('ACC-00000000001',?,'Front')", (v,)).lastrowid
                c.execute("INSERT INTO claim_predictions(claim_id,part_id,confidence_pct,urgency,human_action) VALUES (?,?,80,'High','APPROVED')", (claim,p))
            result = client.get('/api/demand-summary').json()
            for field, expected in {'pending_claims':1,'approved_part_occurrences':1,'pending_catalog_units':7,'unreserved_pending_units':3,'unmapped_pending_units':6,'catalog_on_hand':5,'reserved_units':4,'available_units':1,'stockout_records':1,'low_availability_records':1}.items():
                self.assertEqual(result[field], expected, field)
            self.assertEqual(result['sku_rows'][0]['global_unallocated_shortage_units'], 2)
            self.assertEqual(len(result['warehouse_stock']), 2)
