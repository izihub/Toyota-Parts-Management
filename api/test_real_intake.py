"""Exercise the serving configuration and real model without production writes."""
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from fastapi.testclient import TestClient
from . import database, main


class RealIntakeTests(unittest.TestCase):
    def test_real_intake_retry_review_and_approved_metrics(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(database, 'DATABASE_PATH', Path(directory) / 'test.db'), TestClient(main.app) as client:
                model = main.get_model_data()
                self.assertTrue(all(estimator.n_jobs == 1 for estimator in model['pipeline'].named_steps['clf'].estimators_))
                body = {'model': 'AQUA NHP10', 'make_year': 2013, 'damage_zone': 'Front'}
                headers = {'Idempotency-Key': 'real-inference-check'}
                response = client.post('/api/predict-intake', json=body, headers=headers)
                self.assertEqual(response.status_code, 200, response.text)
                self.assertEqual(client.post('/api/predict-intake', json=body, headers=headers).json(), response.json())
                claim = client.get('/api/claims').json()[0]
                self.assertEqual(claim['vehicle'], body['model'])
                self.assertTrue(claim['parts'])
                part = claim['parts'][0]['name']
                review = client.post('/api/claims/review', json={'parts': [{'accident_id': claim['id'], 'part_name': part}], 'action': 'APPROVED'})
                self.assertEqual(review.status_code, 200, review.text)
                history = client.get('/api/claims?status=ALL').json()[0]
                self.assertEqual([p['name'] for p in history['parts'] if p['human_action'] == 'APPROVED'], [part])
                self.assertEqual(client.get('/api/metrics').json()['approved_predictions'], 1)
