import csv
import json
import sqlite3
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from . import database
from .import_training_claims import import_file


class ImportTests(unittest.TestCase):
    def test_legacy_provenance_backfill_is_repeatable(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / 'legacy.db'
            schema = database.SCHEMA_PATH.read_text(encoding='utf-8')
            schema = '\n'.join(line for line in schema.splitlines() if not any(field in line for field in (
                'source_type TEXT', 'dataset_source TEXT', 'source_claim_id TEXT,', 'accident_date TEXT', 'import_batch_id INTEGER')))
            connection = sqlite3.connect(target)
            try:
                connection.executescript(schema)
                connection.execute("INSERT INTO vehicles(model, make_year) VALUES ('AQUA NHP10', 2013)")
                connection.execute("INSERT INTO claims(accident_id, vehicle_id, damage_zone, status, created_at) VALUES ('HIST-1', 1, 'Front', 'APPROVED', '2025-01-01')")
                connection.execute("INSERT INTO claims(accident_id, vehicle_id, damage_zone) VALUES ('LIVE-1', 1, 'Rear')")
                connection.execute("INSERT INTO training_import_records(dataset, source_claim_id, input_hash, source_json, file_hash, claim_id) VALUES (?, ?, ?, ?, ?, ?)", ('history', 'ORIGINAL-1', 'input', json.dumps({'accident_date': '2020-02-03'}), 'file', 1))
                connection.commit()
            finally:
                connection.close()
            with patch.object(database, 'DATABASE_PATH', target):
                database.init_database()
                database.init_database()
                with database.get_connection() as connection:
                    row = connection.execute('SELECT * FROM claims WHERE id=1').fetchone()
                    self.assertEqual((row['source_type'], row['dataset_source'], row['source_claim_id'], row['accident_date']), ('TRAINING_DATASET', 'history', 'ORIGINAL-1', '2020-02-03'))
                    self.assertEqual((row['status'], row['created_at']), ('APPROVED', '2025-01-01'))
                    self.assertEqual(connection.execute('SELECT COUNT(*) FROM import_batches').fetchone()[0], 1)
                    self.assertEqual(connection.execute('SELECT import_batch_id FROM training_import_records').fetchone()[0], row['import_batch_id'])
                    self.assertEqual(connection.execute('SELECT source_type FROM claims WHERE id=2').fetchone()[0], 'LIVE')
                    self.assertEqual(connection.execute('PRAGMA foreign_key_check').fetchall(), [])

    def test_real_import_dry_run_replay_conflict_and_review_preservation(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / 'claims.csv'
            def write(year=2013):
                with source.open('w', newline='', encoding='utf-8') as stream:
                    writer = csv.writer(stream)
                    writer.writerow(['source_claim_id', 'model', 'make_year', 'damage_zone'])
                    writer.writerow(['A1', 'AQUA NHP10', year, 'Front'])
                    writer.writerow(['BAD', 'AQUA NHP10', 2013, 'Unknown'])
            write()
            target = root / 'claims.db'
            with patch.object(database, 'DATABASE_PATH', target):
                self.assertEqual(import_file(source, 'test')['counts']['valid'], 1)
                self.assertFalse(target.exists())
                report = import_file(source, 'test', commit=True)
                self.assertEqual(report['counts']['created'], 1)
                self.assertEqual(report['counts']['invalid'], 1)
                with database.get_connection() as connection:
                    imported = connection.execute('SELECT * FROM claims').fetchone()
                    self.assertEqual(imported['dataset_source'], 'test')
                    self.assertEqual(imported['source_claim_id'], 'A1')
                    self.assertIsNotNone(imported['import_batch_id'])
                    self.assertEqual(connection.execute('SELECT status FROM claims').fetchone()[0], 'PENDING')
                    self.assertGreater(connection.execute('SELECT COUNT(*) FROM claim_predictions').fetchone()[0], 0)
                    connection.execute("UPDATE claim_predictions SET human_action='APPROVED'")
                before = target.read_bytes()
                self.assertEqual(import_file(source, 'test')['counts']['skipped'], 1)
                self.assertEqual(target.read_bytes(), before)
                self.assertEqual(import_file(source, 'test', commit=True)['counts']['skipped'], 1)
                write(2014)
                self.assertEqual(import_file(source, 'test', commit=True)['counts']['conflict'], 1)
                with database.get_connection() as connection:
                    self.assertEqual(connection.execute('SELECT COUNT(*) FROM claims').fetchone()[0], 1)
                    self.assertEqual(connection.execute("SELECT COUNT(*) FROM claim_predictions WHERE human_action IS NULL").fetchone()[0], 0)
                    self.assertEqual(connection.execute('PRAGMA foreign_key_check').fetchall(), [])

    def test_duplicate_source_ids_are_not_guessed(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'duplicate.csv'
            source.write_text('source_claim_id,model,make_year,damage_zone\nA,AQUA NHP10,2013,Front\nA,AQUA NHP10,2013,Rear\n')
            with patch.object(database, 'DATABASE_PATH', Path(directory) / 'new.db'):
                self.assertEqual(import_file(source, 'test')['counts']['invalid'], 2)
                self.assertFalse(database.DATABASE_PATH.exists())
