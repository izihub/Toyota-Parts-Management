from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from types import SimpleNamespace
from contextlib import closing

from fastapi.testclient import TestClient

from . import database, main


class ClaimsApiTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(dir=Path(__file__).parent)
        self.path_patch = patch.object(database, "DATABASE_PATH", Path(self.temp.name) / "test.db")
        self.path_patch.start()
        self.model_patch = patch.object(main, "get_model_data", return_value={"classes": ["FRONT BUMPER", "BONNET"], "thresholds": [0.5, 0.5]})
        self.model_patch.start()
        self.version_patch = patch.object(main, "MODEL_VERSION", "test-model-version")
        self.version_patch.start()
        self.sample_patch = patch.object(main, "build_sample", return_value=None)
        self.sample_patch.start()
        self.probs_patch = patch.object(main, "positive_probabilities", return_value=[0.8, 0.6])
        self.probs = self.probs_patch.start()
        self.client_context = TestClient(main.app)
        self.client = self.client_context.__enter__()

    def tearDown(self):
        self.client_context.__exit__(None, None, None)
        for item in (self.probs_patch, self.sample_patch, self.version_patch, self.model_patch, self.path_patch):
            item.stop()
        self.temp.cleanup()

    def intake(self, key="claim-1"):
        return self.client.post("/api/predict-intake", json={"model": "AQUA NHP10", "make_year": 2013, "damage_zone": "Front"}, headers={"Idempotency-Key": key})

    def test_metadata_and_idempotent_intake(self):
        first = self.intake()
        self.assertEqual(first.status_code, 200, first.text)
        self.assertEqual(first.json()['accident_id'], 'ACC-00000000001')
        database.init_database()
        self.assertEqual(self.intake().json(), first.json())
        self.assertEqual(self.probs.call_count, 1)
        row = self.client.get("/api/claims").json()[0]
        self.assertEqual(row["damage_zone"], "Front")
        self.assertEqual(row["model_version"], "test-model-version")
        self.assertEqual(row["parts"][0]["threshold"], 0.5)
        conflict = self.client.post("/api/predict-intake", json={"model": "OTHER", "make_year": 2013}, headers={"Idempotency-Key": "claim-1"})
        self.assertEqual(conflict.status_code, 409)
        self.assertEqual(len(self.client.get("/api/claims").json()), 1)

    def test_partial_mixed_and_whole_review(self):
        claim_id = self.intake().json()["accident_id"]
        for part, action in [("FRONT BUMPER", "APPROVED"), ("BONNET", "REJECTED")]:
            response = self.client.post("/api/claims/review", json={"parts": [{"accident_id": claim_id, "part_name": part}], "action": action})
            self.assertEqual(response.status_code, 200, response.text)
            if action == "APPROVED":
                pending = self.client.get("/api/claims").json()[0]
                self.assertEqual([p["name"] for p in pending["parts"]], ["BONNET"])
        self.assertEqual(self.client.get("/api/claims").json(), [])
        history = self.client.get("/api/claims?status=ALL").json()[0]
        self.assertEqual(history["status"], "APPROVED")
        self.assertEqual({p["human_action"] for p in history["parts"]}, {"APPROVED", "REJECTED"})
        self.client.post("/api/claims/review", json={"accident_ids": [claim_id], "action": "REJECTED"})
        history = self.client.get("/api/claims?status=REJECTED").json()[0]
        self.assertTrue(all(p["human_action"] == "REJECTED" for p in history["parts"]))

    def test_no_predictions_and_invalid_payload(self):
        self.probs.return_value = [0.1, 0.1]
        self.intake()
        self.assertEqual(self.client.get("/api/claims").json()[0]["parts"], [])
        for payload in [{"model": " ", "make_year": 2013}, {"model": "AQUA", "make_year": 2013.5}, {"model": "AQUA", "make_year": 2013, "damage_zone": None}]:
            self.assertEqual(self.client.post("/api/predict-intake", json=payload).status_code, 422)
        self.assertEqual(self.client.post("/api/claims/review", json={"action": "APPROVED"}).status_code, 400)

    def test_review_rolls_back_on_missing_part(self):
        claim_id = self.intake().json()["accident_id"]
        response = self.client.post("/api/claims/review", json={"parts": [{"accident_id": claim_id, "part_name": "BONNET"}, {"accident_id": claim_id, "part_name": "MISSING"}], "action": "APPROVED"})
        self.assertEqual(response.status_code, 404)
        self.assertEqual(len(self.client.get("/api/claims").json()[0]["parts"]), 2)

    def test_readiness_creates_no_claim_and_migrations_repeat(self):
        database.init_database()
        database.init_database()
        self.assertEqual(self.client.get("/api/ready").status_code, 200)
        self.assertEqual(self.client.get("/api/claims?status=ALL").json(), [])
        with patch.object(main, "get_model_data", side_effect=main.HTTPException(503, "Unavailable")):
            response = self.client.get("/api/ready")
            self.assertEqual(response.status_code, 503)
            self.assertFalse(response.json()["model"])

    def test_metadata_uses_fitted_variants_and_supported_zones(self):
        prep = SimpleNamespace(
            transformers_=[("cat", None, ["Model_Grouped", "Damage_Zone"])],
            named_transformers_={"cat": SimpleNamespace(categories_=[
                ["OTHER_MODEL", "CAMRY AXVH70", "AQUA NHP10"], ["Front", "Rear", "Top"],
            ])},
        )
        model = {"pipeline": SimpleNamespace(named_steps={"prep": prep})}
        with patch.object(main, "get_model_data", return_value=model):
            response = self.client.get("/api/model-metadata")
            self.assertEqual(response.status_code, 200)
            metadata = response.json()
            self.assertEqual(metadata["vehicle_models"], ["AQUA NHP10", "CAMRY AXVH70"])
            self.assertEqual(metadata["damage_zones"], ["Front", "Rear"])
            self.assertEqual((metadata["min_year"], metadata["max_year"]), (1886, 2100))
        with patch.object(main, "get_model_data", side_effect=main.HTTPException(503, "Unavailable")):
            self.assertEqual(self.client.get("/api/model-metadata").status_code, 503)

    def test_bundle_rounding_version_and_empty_results(self):
        response = self.client.get('/api/reorder-bundle?primary_part=LH%20FOG%20LAMP&quantity=2')
        self.assertEqual(response.status_code, 200)
        bundle = response.json()
        companion = next(item for item in bundle['companions'] if item['companionPart'] == 'RH FOG LAMP')
        self.assertEqual(companion['suggestedOrderQty'], 2)
        self.assertEqual(companion['confidencePct'], 61)
        self.assertEqual(bundle['rule_version'], database.load_rule_release()[1])
        self.assertEqual(self.client.get('/api/reorder-bundle?primary_part=UNMATCHED&quantity=1').json()['companions'], [])
        self.assertEqual(self.client.get('/api/reorder-bundle?primary_part=FRONT%20BUMPER&quantity=1.5').status_code, 422)

    def test_bundle_order_persists_source_shipping_and_rejects_duplicate_parts(self):
        self.create_sku('BUMPER-A', 'FRONT BUMPER')
        source = {'kind': 'bundle', 'primary_part': 'FRONT BUMPER', 'rule_version': 'release-1', 'mode': 'offline'}
        line = {'supplier': 'Toyota', 'vehicle': 'AQUA NHP10 (2013)', 'vehicle_model': 'AQUA NHP10', 'make_year': 2013, 'sku': 'BUMPER-A', 'part': 'FRONT BUMPER', 'quantity': 2, 'unit_price': 1200, 'source': source}
        response = self.client.post('/api/orders', json={'lines': [line], 'status': 'DRAFT', 'shipping_cost': 150})
        self.assertEqual(response.status_code, 200, response.text)
        saved = self.client.get('/api/orders').json()[0]
        self.assertEqual(saved['source'], source)
        self.assertEqual(saved['shipping_cost'], 150)
        self.assertEqual(saved['vehicle'], line['vehicle'])
        duplicate = self.client.post('/api/orders', json={'lines': [line, {**line, 'vehicle': 'Different model'}]})
        self.assertEqual(duplicate.status_code, 400)
        for change in [{'supplier': ''}, {'vehicle': ''}, {'unit_price': None}, {'quantity': 1.5}]:
            response = self.client.post('/api/orders', json={'lines': [{**line, **change}]})
            self.assertIn(response.status_code, (400, 422))
        self.assertEqual(len(self.client.get('/api/orders').json()), 1)

    def logistics_order(self, quantity=2, extra=None):
        if not self.client.get('/api/workshops').json():
            self.client.post('/api/workshops', json={'name': 'Workshop', 'organization': 'Toyota'})
        self.create_sku('LOG-A', 'LH FOG LAMP')
        response = self.client.post('/api/fulfillment', json={'workshop_name': 'Workshop', 'parts': [{'part_name': 'LH FOG LAMP', 'sku': 'LOG-A', 'vehicle_model': 'AQUA NHP10', 'make_year': 2013, 'quantity': quantity}, *(extra or [])]})
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()['id'].replace('fulfill-', '')

    def logistics_stock(self, quantity=5):
        response = self.client.post('/api/stock', json=[{'sku': 'LOG-A', 'part_name': 'LH FOG LAMP', 'vehicle_model': 'AQUA NHP10', 'make_year': 2013, 'quantity': quantity}])
        self.assertEqual(response.status_code, 200, response.text)

    def test_reserve_dispatch_delivery_retries(self):
        order = self.logistics_order()
        self.logistics_stock()
        url = f'/api/fulfillment/{order}'
        self.assertEqual(self.client.patch(url + '?status=FULFILLED').status_code, 409)
        for _ in range(2):
            self.assertEqual(self.client.post(url + '/reserve', json={'warehouse_name': 'Main Warehouse'}).status_code, 200)
        stock = self.client.get('/api/stock').json()[0]
        self.assertEqual((stock['quantity'], stock['available_quantity']), (5, 3))
        for status in ['IN TRANSIT', 'IN TRANSIT', 'FULFILLED', 'FULFILLED']:
            response = self.client.patch(url, params={'status': status})
            self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(self.client.get('/api/stock').json()[0]['quantity'], 3)
        self.assertEqual(self.client.patch(url + '?status=PENDING').status_code, 409)
        ledger = self.client.get('/api/inventory/movements').json()
        self.assertEqual(len([m for m in ledger if m['kind'] == 'DISPATCH']), 1)

    def test_reservation_rollback_competition_release_and_adjustment(self):
        self.create_sku('LOG-B', 'RH FOG LAMP')
        order = self.logistics_order(extra=[{'part_name': 'RH FOG LAMP', 'sku': 'LOG-B', 'vehicle_model': 'AQUA NHP10', 'make_year': 2013, 'quantity': 1}])
        self.logistics_stock(3)
        reserve = lambda oid: self.client.post(f'/api/fulfillment/{oid}/reserve', json={'warehouse_name': 'Main Warehouse'})
        self.assertEqual(reserve(order).status_code, 409)
        self.assertEqual(self.client.get('/api/stock').json()[0]['reserved_quantity'], 0)
        first, second = self.logistics_order(), self.logistics_order()
        self.assertEqual(reserve(first).status_code, 200)
        self.assertEqual(reserve(second).status_code, 409)
        body = {'warehouse_name': 'Main Warehouse', 'sku': 'LOG-A', 'quantity_delta': -2, 'reason': 'Count correction', 'request_key': 'adjust-test'}
        self.assertEqual(self.client.post('/api/inventory/adjust', json=body).status_code, 409)
        self.assertEqual(self.client.post(f'/api/fulfillment/{first}/release').status_code, 200)
        for _ in range(2):
            self.assertEqual(self.client.post('/api/inventory/adjust', json=body).status_code, 200)
        self.assertEqual(self.client.get('/api/stock').json()[0]['quantity'], 1)

    def test_companion_persistence_replay_and_fitment(self):
        order = self.logistics_order()
        self.create_sku('RIGHT', 'RH FOG LAMP')
        self.create_sku('WRONG', 'RH FOG LAMP', 'RAV4 XA50', 2024)
        url = f'/api/fulfillment/{order}/companions'
        suggestion = next(s for s in self.client.get(url).json() if s['part_name'] == 'RH FOG LAMP')
        self.assertEqual(suggestion['suggested_quantity'], 2)
        body = {**suggestion, 'sku': 'WRONG', 'quantity': 2, 'unit_price': 50, 'request_key': 'comp-test'}
        self.assertEqual(self.client.post(url, json=body).status_code, 400)
        body['sku'] = 'RIGHT'
        first = self.client.post(url, json=body)
        self.assertEqual(first.status_code, 200, first.text)
        self.assertEqual(self.client.post(url, json=body).json(), first.json())
        row = self.client.get('/api/fulfillment').json()[0]
        self.assertEqual(len(row['parts']), 2)
        with database.get_connection() as c:
            self.assertEqual(c.execute('SELECT COUNT(*) FROM demand_events').fetchone()[0], 2)
        self.assertTrue(row['parts'][1]['source']['rule_version'])
        self.assertFalse(any(s['part_name'] == 'RH FOG LAMP' for s in self.client.get(url).json()))

    def test_purchase_receipt_once(self):
        self.create_sku('LOG-A', 'LH FOG LAMP')
        line = {'part': 'LH FOG LAMP', 'sku': 'LOG-A', 'vehicle_model': 'AQUA NHP10', 'make_year': 2013, 'vehicle': 'AQUA NHP10 2013', 'supplier': 'Toyota', 'quantity': 4, 'unit_price': 50}
        response = self.client.post('/api/orders', json={'status': 'SUBMITTED', 'lines': [line]})
        self.assertEqual(response.status_code, 200, response.text)
        order = self.client.get('/api/orders').json()[0]['id']
        url = f'/api/orders/{order}/receive'
        for _ in range(2):
            response = self.client.post(url, json={'warehouse_name': 'Main Warehouse'})
            self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(self.client.get('/api/stock').json()[0]['quantity'], 4)
        self.assertEqual(self.client.get('/api/orders').json()[0]['status'], 'RECEIVED')
        self.assertEqual(self.client.post(url, json={'warehouse_name': 'Other'}).status_code, 409)

    def test_empty_metrics_and_zero_prediction_claim(self):
        metrics = self.client.get('/api/metrics').json()
        self.assertEqual(metrics['available_units'], 0)
        self.assertEqual(metrics['total_orders'], 0)
        self.assertIsNone(metrics['delivery_rate'])
        self.assertEqual(metrics['workshops'], [])
        self.probs.return_value = [0.1, 0.1]
        self.intake()
        metrics = self.client.get('/api/metrics').json()
        self.assertEqual(metrics['pending_claims'], 1)
        self.assertEqual(metrics['unreviewed_predictions'], 0)

    def test_complete_claim_to_delivery_metrics_and_reload(self):
        claim = self.intake('workflow').json()['accident_id']
        self.assertEqual(self.client.get('/api/metrics').json()['unreviewed_predictions'], 2)
        self.client.post('/api/claims/review', json={'parts': [{'accident_id': claim, 'part_name': 'FRONT BUMPER'}], 'action': 'APPROVED'})
        self.client.post('/api/claims/review', json={'parts': [{'accident_id': claim, 'part_name': 'BONNET'}], 'action': 'REJECTED'})
        self.create_sku('FLOW', 'FRONT BUMPER')
        self.client.post('/api/workshops', json={'name': 'Workflow shop', 'organization': 'Toyota'})
        purchase = self.client.post('/api/orders', json={'status': 'SUBMITTED', 'lines': [{'sku': 'FLOW', 'part': 'FRONT BUMPER', 'vehicle': 'AQUA NHP10 2013', 'vehicle_model': 'AQUA NHP10', 'make_year': 2013, 'supplier': 'Toyota', 'quantity': 3, 'unit_price': 100}]})
        self.assertEqual(purchase.status_code, 200, purchase.text)
        purchase_id = self.client.get('/api/orders').json()[0]['id']
        self.assertEqual(self.client.post(f'/api/orders/{purchase_id}/receive', json={'warehouse_name': 'Main Warehouse'}).status_code, 200)
        converted = self.client.post(f'/api/claims/{claim}/fulfillment-draft', json={'workshop_name': 'Workflow shop', 'lines': [{'part_name': 'FRONT BUMPER', 'sku': 'FLOW', 'quantity': 2, 'unit_price': 150}]})
        self.assertEqual(converted.status_code, 200, converted.text)
        order_id = converted.json()['id'].replace('fulfill-', '')
        url = f'/api/fulfillment/{order_id}'
        self.assertEqual(self.client.post(url + '/reserve', json={'warehouse_name': 'Main Warehouse'}).status_code, 200)
        reserved = self.client.get('/api/metrics').json()
        self.assertEqual((reserved['catalog_on_hand'], reserved['reserved_units'], reserved['available_units']), (3, 2, 1))
        self.assertEqual(reserved['delivery_rate'], 0)
        for status in ['IN TRANSIT', 'FULFILLED', 'FULFILLED']:
            self.assertEqual(self.client.patch(url, params={'status': status}).status_code, 200)
        database.init_database()
        final = self.client.get('/api/metrics').json()
        self.assertEqual((final['catalog_on_hand'], final['reserved_units'], final['available_units']), (1, 0, 1))
        self.assertEqual((final['approved_predictions'], final['unreviewed_predictions'], final['pending_claims']), (1, 0, 0))
        self.assertEqual(final['delivery_rate'], 100)
        self.assertEqual(final['workshops'][0]['delivered'], 1)
        self.assertEqual(self.client.get('/api/fulfillment').json()[0]['accident_id'], claim)

    def test_demand_capture_once_atomic_and_source_classification(self):
        from .demand_service import record_requested_demand
        order = self.logistics_order()
        with database.get_connection() as c:
            event = c.execute('SELECT * FROM demand_events').fetchone()
            self.assertEqual((event['quantity_delta'], event['data_source']), (2, 'LIVE'))
            record_requested_demand(c, event['source_line_id'])
            self.assertEqual(c.execute('SELECT COUNT(*) FROM demand_events').fetchone()[0], 1)
        self.assertEqual(self.client.delete(f'/api/fulfillment/{order}').status_code, 409)
        self.logistics_stock()
        self.assertEqual(self.client.post(f'/api/fulfillment/{order}/reserve', json={'warehouse_name': 'Main Warehouse'}).status_code, 200)
        self.assertEqual(self.client.patch(f'/api/fulfillment/{order}', params={'status': 'IN TRANSIT'}).status_code, 200)
        with database.get_connection() as c:
            self.assertEqual(c.execute('SELECT COUNT(*) FROM demand_events').fetchone()[0], 1)
        response = self.client.post('/api/fulfillment', json={'workshop_name': 'Workshop', 'parts': [
            {'part_name': 'LH FOG LAMP', 'sku': 'LOG-A', 'vehicle_model': 'AQUA NHP10', 'make_year': 2013, 'quantity': 1},
            {'part_name': 'INVALID', 'sku': 'MISSING', 'quantity': 1}]})
        self.assertEqual(response.status_code, 404)
        with database.get_connection() as c:
            self.assertEqual(c.execute('SELECT COUNT(*) FROM demand_events').fetchone()[0], 1)
            c.execute("INSERT INTO synthetic_stock_generations(generation_id,seed,config_json,config_hash,source_snapshot_hash,warehouse_id) VALUES ('demo',42,'{}','c','s',1)")
        self.logistics_order()
        with database.get_connection() as c:
            self.assertEqual(c.execute('SELECT data_source FROM demand_events ORDER BY id DESC').fetchone()[0], 'SYNTHETIC')

    def create_sku(self, sku, part, model='AQUA NHP10', year=2013):
        response = self.client.post('/api/catalog', json={'sku': sku, 'part_name': part, 'display_name': sku, 'fitments': [{'model': model, 'make_year': year}]})
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    def test_sku_stock_and_purchase_keep_same_label_variants_separate(self):
        self.create_sku('BUMPER-A', 'FRONT BUMPER')
        self.create_sku('BUMPER-B', 'FRONT BUMPER', 'RAV4 XA50', 2024)
        for sku, model, year, quantity in [('BUMPER-A', 'AQUA NHP10', 2013, 3), ('BUMPER-B', 'RAV4 XA50', 2024, 7)]:
            response = self.client.post('/api/stock', json=[{'sku': sku, 'part_name': 'FRONT BUMPER', 'vehicle_model': model, 'make_year': year, 'quantity': quantity}])
            self.assertEqual(response.status_code, 200, response.text)
        stock = self.client.get('/api/stock').json()
        self.assertEqual({row['sku']: row['quantity'] for row in stock}, {'BUMPER-A': 3, 'BUMPER-B': 7})
        bad = self.client.post('/api/stock', json=[{'sku': 'BUMPER-A', 'part_name': 'FRONT BUMPER', 'vehicle_model': 'RAV4 XA50', 'make_year': 2024, 'quantity': 5}])
        self.assertEqual(bad.status_code, 400)
        lines = [{'part': 'FRONT BUMPER', 'sku': sku, 'vehicle_model': model, 'make_year': year, 'vehicle': model, 'supplier': 'Toyota', 'quantity': 1, 'unit_price': 100} for sku, model, year in [('BUMPER-A', 'AQUA NHP10', 2013), ('BUMPER-B', 'RAV4 XA50', 2024)]]
        response = self.client.post('/api/orders', json={'lines': lines})
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual({row['sku'] for row in self.client.get('/api/orders').json()}, {'BUMPER-A', 'BUMPER-B'})

    def test_claim_conversion_fitment_atomicity_replay_and_traceability(self):
        claim_id = self.intake().json()['accident_id']
        with database.get_connection() as c:
            c.execute("UPDATE claims SET source_type='TRAINING_DATASET' WHERE accident_id=?", (claim_id,))
        self.create_sku('BUMPER-A', 'FRONT BUMPER')
        self.create_sku('BONNET-WRONG', 'BONNET', 'RAV4 XA50', 2024)
        self.create_sku('BONNET-A', 'BONNET')
        self.client.post('/api/workshops', json={'name': 'Repair shop', 'organization': 'Toyota'})
        payload = {'workshop_name': 'Repair shop', 'lines': [{'part_name': 'FRONT BUMPER', 'sku': 'BUMPER-A', 'quantity': 1, 'unit_price': 100}, {'part_name': 'BONNET', 'sku': 'BONNET-WRONG', 'quantity': 1, 'unit_price': 200}]}
        url = f'/api/claims/{claim_id}/fulfillment-draft'
        self.assertEqual(self.client.post(url, json=payload).status_code, 409)
        self.client.post('/api/claims/review', json={'accident_ids': [claim_id], 'action': 'APPROVED'})
        self.assertEqual(self.client.post(url, json=payload).status_code, 400)
        self.assertEqual(self.client.get('/api/fulfillment').json(), [])
        payload['lines'][1]['sku'] = 'BONNET-A'
        first = self.client.post(url, json=payload)
        self.assertEqual(first.status_code, 200, first.text)
        repeated = self.client.post(url, json={**payload, 'lines': list(reversed(payload['lines']))})
        self.assertEqual(repeated.json()['id'], first.json()['id'])
        self.assertTrue(repeated.json()['replayed'])
        with database.get_connection() as c:
            events = c.execute('SELECT data_source FROM demand_events').fetchall()
            self.assertEqual([e[0] for e in events], ['HISTORICAL', 'HISTORICAL'])
        payload['lines'][0]['quantity'] = 2
        self.assertEqual(self.client.post(url, json=payload).status_code, 409)
        orders = self.client.get('/api/fulfillment').json()
        self.assertEqual(len(orders), 1)
        self.assertEqual(orders[0]['accident_id'], claim_id)
        self.assertTrue(all(part['claim_prediction_id'] and part['vehicle_model'] == 'AQUA NHP10' for part in orders[0]['parts']))
        self.assertEqual(self.client.delete('/api/fulfillment/' + first.json()['id'].split('-')[1]).status_code, 409)
        self.assertEqual(self.client.post('/api/claims/review', json={'accident_ids': [claim_id], 'action': 'REJECTED'}).status_code, 409)

    def test_legacy_purchase_migration_preserves_data_and_is_repeatable(self):
        from pathlib import Path
        import sqlite3
        legacy_path = Path(self.temp.name) / 'legacy.db'
        legacy_schema = database.SCHEMA_PATH.read_text().replace('    catalog_item_id INTEGER REFERENCES catalog_items(id)\n);', '    UNIQUE(purchase_order_id, part_id)\n);', 1)
        with closing(sqlite3.connect(legacy_path)) as connection, connection:
            connection.executescript(legacy_schema)
            connection.execute("INSERT INTO parts(part_name) VALUES ('LEGACY PART')")
            connection.execute("INSERT INTO purchase_orders(order_number) VALUES ('PO-LEGACY')")
            connection.execute("INSERT INTO purchase_order_lines(purchase_order_id, part_id, quantity, vehicle, source_json) VALUES (1, 1, 2, 'Old fitment', '{}')")
        with patch.object(database, 'DATABASE_PATH', legacy_path):
            database.init_database()
            database.init_database()
            with database.get_connection() as connection:
                line = dict(connection.execute('SELECT * FROM purchase_order_lines').fetchone())
                self.assertEqual((line['id'], line['quantity'], line['vehicle'], line['source_json']), (1, 2, 'Old fitment', '{}'))
                self.assertEqual(connection.execute('PRAGMA foreign_key_check').fetchall(), [])


if __name__ == "__main__":
    unittest.main()
