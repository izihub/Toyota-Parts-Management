import hashlib
import sqlite3
import tempfile
import unittest
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch
from fastapi.testclient import TestClient
from . import database, main
from .seed_forecast_demo import generate, SCENARIOS
from .forecast_runs import load_run


class ForecastDemoTests(unittest.TestCase):
    def test_preview_creation_replay_and_source_isolation(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / 'demo.db'
            now = datetime(2026, 9, 24, tzinfo=timezone.utc)
            preview = generate(target, as_of=now)
            self.assertFalse(target.exists())
            self.assertFalse(preview['committed'])
            report = generate(target, commit=True, as_of=now)
            self.assertEqual(report['ready_skus'], 3)
            self.assertEqual(report['forecast_status'], 'PARTIAL')
            self.assertEqual(report['evaluation_samples'], 60)
            with closing(sqlite3.connect(target)) as c:
                c.row_factory = sqlite3.Row
                self.assertEqual(c.execute('SELECT COUNT(*) FROM demand_events').fetchone()[0], 45)
                self.assertEqual(c.execute('SELECT COUNT(*) FROM demand_coverage').fetchone()[0], 60)
                self.assertEqual(c.execute('SELECT COUNT(*) FROM claims').fetchone()[0], 0)
                result = load_run(c, report['synthetic_run_id'])
                rows = {r['sku']: r for r in result['forecast']['sku_rows']}
                self.assertEqual(rows['DEMO-STEADY']['units'], 16)
                self.assertEqual(rows['DEMO-VARIABLE']['units'], sum(SCENARIOS['DEMO-VARIABLE'][1][-8:]) / 2)
                self.assertEqual(rows['DEMO-ZERO']['units'], 0)
                self.assertIsNone(rows['DEMO-GAP']['units'])
                self.assertIsNone(rows['DEMO-GAP']['history'][-1]['units'])
                self.assertEqual(len(rows['DEMO-STEADY']['history']), 8)
                self.assertEqual(len(rows['DEMO-STEADY']['weeks']), 4)
                self.assertIsNone(result['forecast']['units'])
                live = load_run(c, report['live_run_id'])
                self.assertEqual(live['forecast']['ready_skus'], 0)
                self.assertIsNone(live['evaluation']['mae'])
                self.assertEqual(c.execute('PRAGMA foreign_key_check').fetchall(), [])
            before = hashlib.sha256(target.read_bytes()).hexdigest()
            with self.assertRaises(ValueError):
                generate(target, commit=True)
            self.assertEqual(hashlib.sha256(target.read_bytes()).hexdigest(), before)
            with patch.object(database, 'DATABASE_PATH', target), TestClient(main.app) as client:
                environment = client.get('/api/environment').json()
                self.assertTrue(environment['contains_synthetic_demand'])
                self.assertFalse(environment['contains_synthetic_stock'])
                self.assertEqual(len(client.get('/api/demand-forecast-runs').json()), 2)
                payload = {'request_key': 'forecast-demo-synthetic-v1', 'data_source': 'SYNTHETIC'}
                # Simulate a lost response: repeat the committed request.
                replay = client.post('/api/demand-forecast-runs', json=payload)
                self.assertEqual(replay.status_code, 200)
                self.assertEqual(replay.json(), result)
                self.assertEqual(client.get(f"/api/demand-forecast-runs/{result['id']}").json(), result)
                self.assertEqual(len(client.get('/api/demand-forecast-runs').json()), 2)


if __name__ == '__main__':
    unittest.main()
