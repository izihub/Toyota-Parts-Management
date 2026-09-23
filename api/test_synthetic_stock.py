"""Database contracts for the future synthetic stock generator."""
import sqlite3
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from . import database
from .seed_synthetic_stock import generate


class SyntheticSchemaTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.path_patch = patch.object(database, 'DATABASE_PATH', Path(self.temp.name) / 'demo.db')
        self.path_patch.start()
        database.init_database()
        with database.get_connection() as c:
            part = c.execute("INSERT INTO parts(part_name) VALUES ('DEMO TEST PART')").lastrowid
            c.execute("INSERT INTO catalog_items(id, sku, part_id, display_name) VALUES (1, 'SYN-TEST', ?, '[SYNTHETIC] Test')", (part,))
            c.execute('INSERT INTO catalog_inventory(warehouse_id, catalog_item_id, quantity) VALUES (1, 1, 8)')
            c.execute("INSERT INTO synthetic_stock_generations VALUES ('demo-v1', 42, '{}', 'config', 'source', 1, CURRENT_TIMESTAMP)")
            c.execute("INSERT INTO inventory_movements(id, operation_key, warehouse_id, catalog_item_id, quantity_delta, kind) VALUES (1, 'synthetic:demo-v1:1', 1, 1, 8, 'SYNTHETIC_OPENING')")

    def tearDown(self):
        self.path_patch.stop()
        self.temp.cleanup()

    def insert_entry(self, quantity=8, scenario='fully_stocked', movement=1, generation='demo-v1'):
        with database.get_connection() as c:
            c.execute('''INSERT INTO synthetic_stock_entries(generation_id, warehouse_id, catalog_item_id,
                identity_json, opening_quantity, reorder_level, scenario, opening_movement_id)
                VALUES (?, 1, 1, '{}', ?, 4, ?, ?)''', (generation, quantity, scenario, movement))

    def test_repeatable_migration_preserves_changed_balance_and_provenance(self):
        self.insert_entry()
        with database.get_connection() as c:
            c.execute('UPDATE catalog_inventory SET quantity=6 WHERE catalog_item_id=1')
        database.init_database()
        database.init_database()
        with database.get_connection() as c:
            self.assertEqual(c.execute('SELECT quantity FROM catalog_inventory').fetchone()[0], 6)
            self.assertEqual(c.execute('SELECT opening_quantity FROM synthetic_stock_entries').fetchone()[0], 8)
            self.assertEqual(c.execute('PRAGMA foreign_key_check').fetchall(), [])
        with self.assertRaises(sqlite3.IntegrityError):
            self.insert_entry()
        with database.get_connection() as c:
            c.execute("INSERT INTO synthetic_stock_generations VALUES ('demo-v2', 43, '{}', 'new', 'source', 1, CURRENT_TIMESTAMP)")
        with self.assertRaises(sqlite3.IntegrityError):
            self.insert_entry(generation='demo-v2')

    def test_zero_stock_and_invalid_entries(self):
        for quantity, scenario, movement in [(-1, 'fully_stocked', 1), (1.5, 'low_stock', 1), (8, 'low_stock', 1), (0, 'stockout', 1), (8, 'fully_stocked', None)]:
            with self.assertRaises(sqlite3.IntegrityError):
                self.insert_entry(quantity, scenario, movement)
        with self.assertRaises(sqlite3.IntegrityError):
            self.insert_entry(generation='missing')
        self.insert_entry(0, 'stockout', None)

    def test_older_database_gets_empty_registry_without_stock_changes(self):
        with database.get_connection() as c:
            c.execute('DROP TABLE synthetic_stock_entries')
            c.execute('DROP TABLE synthetic_stock_generations')
        database.init_database()
        with database.get_connection() as c:
            self.assertEqual(c.execute('SELECT COUNT(*) FROM synthetic_stock_entries').fetchone()[0], 0)
            self.assertEqual(c.execute('SELECT COUNT(*) FROM synthetic_stock_generations').fetchone()[0], 0)
            self.assertEqual(c.execute('SELECT quantity FROM catalog_inventory').fetchone()[0], 8)

    def test_generator_preview_commit_replay_and_conflict(self):
        source = database.DATABASE_PATH
        root = Path(self.temp.name)
        target = root / 'seeded.db'
        scope = root / 'scope.json'
        config_path = root / 'config.json'
        config = json.loads((database.PROJECT_ROOT / 'api/synthetic_stock_config.json').read_text())
        config['scope_file'] = str(scope)
        scope.write_text(json.dumps({'scope_id': config['generation_id'], 'warehouse': 'Demo Warehouse',
            'source_database': str(source), 'target_database': str(target), 'source_claims': [
                {'accident_id': 'TEST-CLAIM', 'model': 'AQUA NHP10', 'make_year': 2013,
                 'parts': ['DEMO TEST PART'], 'scenario': 'fully_stocked'}]}))
        config_path.write_text(json.dumps(config))
        with database.get_connection() as c:
            vehicle = c.execute("INSERT INTO vehicles(model, make_year) VALUES ('AQUA NHP10', 2013)").lastrowid
            claim = c.execute("INSERT INTO claims(accident_id, vehicle_id, damage_zone) VALUES ('TEST-CLAIM', ?, 'Front')", (vehicle,)).lastrowid
            c.execute("INSERT INTO claim_predictions(claim_id, part_id, confidence_pct, urgency) SELECT ?, id, 80, 'High' FROM parts WHERE part_name='DEMO TEST PART'", (claim,))
        original = source.read_bytes()
        preview = generate(config_path)
        self.assertFalse(target.exists())
        self.assertEqual(preview, generate(config_path))
        self.assertEqual(generate(config_path, commit=True)['status'], 'created')
        c = sqlite3.connect(target)
        try:
            self.assertEqual(c.execute('SELECT COUNT(*) FROM claims').fetchone()[0], 0)
            self.assertEqual(c.execute('SELECT COUNT(*) FROM inventory_movements').fetchone()[0], 1)
            c.execute('UPDATE catalog_inventory SET quantity=quantity-2')
            c.commit()
            remaining = c.execute('SELECT quantity FROM catalog_inventory').fetchone()[0]
            self.assertEqual(generate(config_path, commit=True)['status'], 'skipped')
            self.assertEqual(c.execute('SELECT quantity FROM catalog_inventory').fetchone()[0], remaining)
            self.assertEqual(c.execute('PRAGMA foreign_key_check').fetchall(), [])
        finally:
            c.close()
        config['seed'] = 43
        config_path.write_text(json.dumps(config))
        with self.assertRaisesRegex(ValueError, 'different configuration'):
            generate(config_path, commit=True)
        with self.assertRaisesRegex(ValueError, 'different databases'):
            generate(config_path, target=source)
        self.assertEqual(source.read_bytes(), original)
