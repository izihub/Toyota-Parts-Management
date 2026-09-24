from __future__ import annotations

import json
import hashlib
import sqlite3
import os
from contextlib import contextmanager
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATABASE_PATH = (PROJECT_ROOT / os.environ.get('TOYOTA_DATABASE_PATH', 'api/toyota_parts.db')).resolve()
SCHEMA_PATH = Path(__file__).with_name("schema.sql")
RULES_CANDIDATES = (
    Path(__file__).with_name("real_warehouse_synergy_rules.json"),
    PROJECT_ROOT / "src" / "real_warehouse_synergy_rules.json",
)


@contextmanager
def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        with connection:
            yield connection
    finally:
        connection.close()


def load_synergy_rules() -> list[dict[str, Any]]:
    return load_rule_release()[0]


def next_accident_id(connection):
    """Call inside BEGIN IMMEDIATE so allocation and insertion stay serialized."""
    row = connection.execute("SELECT seq FROM sqlite_sequence WHERE name='claims'").fetchone()
    return f"ACC-{(row[0] if row else 0) + 1:011d}"


def load_rule_release():
    for path in RULES_CANDIDATES:
        if path.exists():
            text = path.read_text(encoding="utf-8").replace("\r\n", "\n")
            return json.loads(text), hashlib.sha256(text.encode("utf-8")).hexdigest()
    return [], None


def init_database() -> None:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with get_connection() as connection:
        # CREATE TABLE IF NOT EXISTS also migrates older databases by adding the
        # synthetic registries and demand history/coverage, without generating
        # historical demand or assuming that previously unobserved periods are zero.
        connection.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
        for table, additions in {
            "claims": {"model_version": "TEXT", "reviewed_at": "TEXT",
                       "source_type": "TEXT NOT NULL DEFAULT 'LIVE' CHECK (source_type IN ('LIVE', 'TRAINING_DATASET'))",
                       "dataset_source": "TEXT", "source_claim_id": "TEXT", "accident_date": "TEXT",
                       "import_batch_id": "INTEGER REFERENCES import_batches(id)"},
            "training_import_records": {"import_batch_id": "INTEGER REFERENCES import_batches(id)"},
            "claim_predictions": {"threshold": "REAL", "reviewed_at": "TEXT"},
            "purchase_orders": {"shipping_cost": "REAL NOT NULL DEFAULT 0"},
            "purchase_order_lines": {"source_json": "TEXT", "catalog_item_id": "INTEGER REFERENCES catalog_items(id)"},
            "fulfillment_order_lines": {"catalog_item_id": "INTEGER REFERENCES catalog_items(id)", "claim_prediction_id": "INTEGER REFERENCES claim_predictions(id)", "source_json": "TEXT"},
        }.items():
            existing = {row[1] for row in connection.execute(f"PRAGMA table_info({table})")}
            for column, declaration in additions.items():
                if column not in existing:
                    connection.execute(f"ALTER TABLE {table} ADD COLUMN {column} {declaration}")
        columns = {row[1] for row in connection.execute("PRAGMA table_info(purchase_order_lines)")}
        if "vehicle" not in columns:
            connection.execute("ALTER TABLE purchase_order_lines ADD COLUMN vehicle TEXT")
        definition = connection.execute("SELECT sql FROM sqlite_master WHERE name = 'purchase_order_lines'").fetchone()[0]
        if "UNIQUE(purchase_order_id, part_id)" in definition:
            # Keep legacy IDs and rows, removing only the obsolete name-only constraint.
            replacement = definition.replace("purchase_order_lines", "purchase_order_lines_v2", 1).replace("UNIQUE(purchase_order_id, part_id)", "CHECK (1)")
            connection.execute("BEGIN")
            connection.execute(replacement)
            names = ', '.join(row[1] for row in connection.execute("PRAGMA table_info(purchase_order_lines)"))
            connection.execute(f"INSERT INTO purchase_order_lines_v2 ({names}) SELECT {names} FROM purchase_order_lines")
            connection.execute("DROP TABLE purchase_order_lines")
            connection.execute("ALTER TABLE purchase_order_lines_v2 RENAME TO purchase_order_lines")
        connection.execute(
            "INSERT OR IGNORE INTO warehouses (name, location) VALUES (?, ?)",
            ("Main Warehouse", "Sri Lanka"),
        )
        rules, rule_version = load_rule_release()
        if rule_version is not None:
            connection.execute("DELETE FROM synergy_rules")
        for rule in rules:
            antecedent = rule["antecedent"].strip().upper()
            consequent = rule["consequent"].strip().upper()
            connection.execute("INSERT OR IGNORE INTO parts (part_name) VALUES (?)", (antecedent,))
            connection.execute("INSERT OR IGNORE INTO parts (part_name) VALUES (?)", (consequent,))
            connection.execute(
                """
                INSERT OR IGNORE INTO synergy_rules
                    (antecedent_part_id, consequent_part_id, support, confidence, lift)
                SELECT a.id, c.id, ?, ?, ?
                FROM parts a, parts c
                WHERE a.part_name = ? AND c.part_name = ?
                """,
                (rule["support"], rule["confidence"], rule["lift"], antecedent, consequent),
            )


        # Backfill only registry-confirmed imports, never infer provenance from an ID.
        for record in connection.execute('SELECT * FROM training_import_records WHERE import_batch_id IS NULL').fetchall():
            connection.execute('INSERT OR IGNORE INTO import_batches(dataset, file_hash, created_at) VALUES (?, ?, ?)',
                               (record['dataset'], record['file_hash'], record['imported_at']))
            batch = connection.execute('SELECT id FROM import_batches WHERE dataset=? AND file_hash=?',
                                       (record['dataset'], record['file_hash'])).fetchone()[0]
            try:
                source = json.loads(record['source_json'])
                historical_date = source.get('accident_date') if isinstance(source, dict) else None
                if historical_date:
                    from datetime import date
                    historical_date = date.fromisoformat(historical_date).isoformat()
            except (ValueError, TypeError):
                historical_date = None
            connection.execute('UPDATE training_import_records SET import_batch_id=? WHERE claim_id=?', (batch, record['claim_id']))
            connection.execute("""UPDATE claims SET source_type='TRAINING_DATASET', dataset_source=?,
                source_claim_id=?, accident_date=?, import_batch_id=? WHERE id=?""",
                (record['dataset'], record['source_claim_id'], historical_date, batch, record['claim_id']))
        connection.execute('CREATE UNIQUE INDEX IF NOT EXISTS claims_dataset_identity ON claims(dataset_source, source_claim_id) WHERE dataset_source IS NOT NULL AND source_claim_id IS NOT NULL')
        connection.execute('CREATE INDEX IF NOT EXISTS claims_import_batch ON claims(import_batch_id)')
        renames = {row['accident_id']: f"ACC-{row['id']:011d}" for row in connection.execute('SELECT id, accident_id FROM claims') if row['accident_id'] != f"ACC-{row['id']:011d}"}
        if renames:
            from uuid import uuid4
            prefix = uuid4().hex
            for old in renames:
                connection.execute('UPDATE claims SET accident_id=? WHERE accident_id=?', (prefix + old, old))
            for old, new in renames.items():
                connection.execute('UPDATE claims SET accident_id=? WHERE accident_id=?', (new, prefix + old))
            for row in connection.execute('SELECT request_key, response_json FROM intake_requests').fetchall():
                response = json.loads(row['response_json'])
                if response.get('accident_id') in renames:
                    response['accident_id'] = renames[response['accident_id']]
                    connection.execute('UPDATE intake_requests SET response_json=? WHERE request_key=?', (json.dumps(response), row['request_key']))


if __name__ == "__main__":
    init_database()
    print(f"Initialized {DATABASE_PATH}")
