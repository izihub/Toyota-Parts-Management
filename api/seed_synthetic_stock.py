"""Generate synthetic opening stock in a separate database; preview by default."""
import argparse
from contextlib import closing
import hashlib
import json
from pathlib import Path
import sqlite3

from .database import PROJECT_ROOT, SCHEMA_PATH


def encode(value):
    return json.dumps(value, ensure_ascii=True, sort_keys=True, separators=(',', ':'))


def fingerprint(value):
    return hashlib.sha256(encode(value).encode()).hexdigest()


def project_path(value):
    return (PROJECT_ROOT / value).resolve()


def connect(path, readonly=False):
    c = sqlite3.connect(path.as_uri() + '?mode=ro', uri=True) if readonly else sqlite3.connect(path)
    c.row_factory = sqlite3.Row
    c.execute('PRAGMA foreign_keys=ON')
    return c


def plan(config_path, source=None, target=None):
    config = json.loads(Path(config_path).read_text(encoding='utf-8'))
    scope = json.loads(project_path(config['scope_file']).read_text(encoding='utf-8'))
    source = project_path(source or scope['source_database'])
    target = project_path(target or scope['target_database'])
    if source == target or (target.exists() and source.samefile(target)):
        raise ValueError('Source and demo target must be different databases.')
    required = {'config_version': 1, 'path_base': 'project_root', 'quantity_algorithm': 'sha256_identity_modulo_v1',
                'existing_generation_policy': 'skip_if_identical_else_conflict', 'existing_stock_policy': 'reject_unowned_balance',
                'copy_claims': False, 'auto_approve_claims': False}
    if any(config.get(k) != v for k, v in required.items()):
        raise ValueError('Unsupported configuration version, algorithm or policy.')
    if type(config['seed']) is not int or not config['generation_id'].strip() or config['generation_id'] != scope['scope_id']:
        raise ValueError('An integer seed and matching generation/scope IDs are required.')
    if config['sku_prefix'] != 'SYN-' or not config['display_name_prefix'].startswith('[SYNTHETIC]') or not scope['warehouse'].strip():
        raise ValueError('Synthetic labels and a warehouse name are required.')
    entries = {}
    snapshot = []
    with closing(connect(source, True)) as c:
        for claim in scope['source_claims']:
            row = c.execute('SELECT c.id, v.model, v.make_year FROM claims c JOIN vehicles v ON v.id=c.vehicle_id WHERE c.accident_id=?', (claim['accident_id'],)).fetchone()
            if row is None or (row['model'], row['make_year']) != (claim['model'], claim['make_year']):
                raise ValueError(f"Claim identity mismatch: {claim['accident_id']}")
            parts = {r[0] for r in c.execute('SELECT p.part_name FROM claim_predictions cp JOIN parts p ON p.id=cp.part_id WHERE cp.claim_id=?', (row['id'],))}
            if set(claim['parts']) != parts:
                raise ValueError(f"Suggested parts changed for {claim['accident_id']}; review the scope.")
            snapshot.append({**claim, 'parts': sorted(parts)})
            scenario = claim['scenario']
            band = config['scenarios'][scenario]
            lo, hi, level = (band[k] for k in ('min_quantity', 'max_quantity', 'reorder_level'))
            if not all(type(v) is int for v in (lo, hi, level)) or not 0 <= lo <= hi or level < 0:
                raise ValueError('Quantity ranges and reorder levels must be nonnegative integers.')
            if not ((scenario == 'fully_stocked' and lo >= max(1, level, config['demo_order_quantity_per_part'])) or
                    (scenario == 'low_stock' and 0 < lo <= hi < level) or (scenario == 'stockout' and lo == hi == 0)):
                raise ValueError('Quantity range does not match the selected scenario.')
            for part in sorted(parts):
                identity = [part.strip().upper(), row['model'].strip().upper(), row['make_year']]
                sku = config['sku_prefix'] + fingerprint(identity)[:24].upper()
                quantity = lo + int(fingerprint([config['seed'], *identity]), 16) % (hi - lo + 1)
                entry = {'sku': sku, 'identity': identity, 'quantity': quantity, 'reorder_level': level, 'scenario': scenario,
                         'display_name': config['display_name_prefix'] + f'{identity[0]} — {identity[1]} — {identity[2]}'}
                if sku in entries and entries[sku] != entry:
                    raise ValueError('Conflicting identity/scenario or SKU hash collision.')
                entries[sku] = entry
    if not entries:
        raise ValueError('The scope contains no part identities.')
    return {'generation_id': config['generation_id'], 'seed': config['seed'], 'config_json': encode(config),
            'config_hash': fingerprint(config), 'source_snapshot_hash': fingerprint(sorted(snapshot, key=lambda x: x['accident_id'])),
            'warehouse': scope['warehouse'].strip(), 'source_database': str(source), 'target_database': str(target),
            'entries': sorted(entries.values(), key=lambda x: x['sku'])}


def inspect_target(c, planned):
    tables = {r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    if 'synthetic_stock_generations' in tables:
        generation = c.execute('SELECT g.*, w.name AS warehouse FROM synthetic_stock_generations g JOIN warehouses w ON w.id=g.warehouse_id WHERE generation_id=?', (planned['generation_id'],)).fetchone()
        if generation:
            if any(generation[k] != planned[k] for k in ('config_hash', 'source_snapshot_hash', 'warehouse')):
                raise ValueError('Generation already exists with a different configuration or source snapshot.')
            saved = c.execute('SELECT e.*, i.sku FROM synthetic_stock_entries e JOIN catalog_items i ON i.id=e.catalog_item_id WHERE generation_id=?', (planned['generation_id'],)).fetchall()
            expected = {e['sku']: (e['quantity'], e['reorder_level'], e['scenario'], e['identity']) for e in planned['entries']}
            actual = {r['sku']: (r['opening_quantity'], r['reorder_level'], r['scenario'], json.loads(r['identity_json'])) for r in saved}
            if actual != expected:
                raise ValueError('Stored generation is incomplete or inconsistent; refusing to repair balances automatically.')
            return 'skipped'
    if 'catalog_items' in tables:
        for entry in planned['entries']:
            if c.execute('SELECT 1 FROM catalog_items WHERE sku=?', (entry['sku'],)).fetchone():
                raise ValueError(f"SKU {entry['sku']} already exists outside this generation; refusing to reuse or top up.")
    return 'ready'


def generate(config_path, commit=False, source=None, target=None):
    planned = plan(config_path, source, target)
    destination = Path(planned['target_database'])
    status = 'ready'
    if destination.exists():
        with closing(connect(destination, True)) as c:
            status = inspect_target(c, planned)
    if commit and status != 'skipped':
        destination.parent.mkdir(parents=True, exist_ok=True)
        with closing(connect(destination)) as c:
            # Fresh or older targets gain tables; no live database migrations or claim changes.
            c.executescript(SCHEMA_PATH.read_text(encoding='utf-8'))
            with c:
                c.execute('BEGIN IMMEDIATE')
                status = inspect_target(c, planned)
                if status != 'skipped':
                    c.execute('INSERT OR IGNORE INTO warehouses(name) VALUES (?)', (planned['warehouse'],))
                    warehouse = c.execute('SELECT id FROM warehouses WHERE name=?', (planned['warehouse'],)).fetchone()[0]
                    c.execute('INSERT INTO synthetic_stock_generations(generation_id, seed, config_json, config_hash, source_snapshot_hash, warehouse_id) VALUES (?, ?, ?, ?, ?, ?)', tuple(planned[k] for k in ('generation_id', 'seed', 'config_json', 'config_hash', 'source_snapshot_hash')) + (warehouse,))
                    for entry in planned['entries']:
                        part, model, year = entry['identity']
                        c.execute('INSERT OR IGNORE INTO parts(part_name) VALUES (?)', (part,))
                        part_id = c.execute('SELECT id FROM parts WHERE part_name=?', (part,)).fetchone()[0]
                        c.execute('INSERT OR IGNORE INTO vehicles(model, make_year) VALUES (?, ?)', (model, year))
                        vehicle = c.execute('SELECT id FROM vehicles WHERE model=? AND make_year=?', (model, year)).fetchone()[0]
                        item = c.execute('INSERT INTO catalog_items(sku, part_id, display_name) VALUES (?, ?, ?)', (entry['sku'], part_id, entry['display_name'])).lastrowid
                        c.execute('INSERT INTO catalog_fitments VALUES (?, ?)', (item, vehicle))
                        c.execute('INSERT INTO catalog_inventory VALUES (?, ?, ?, ?)', (warehouse, item, entry['quantity'], entry['reorder_level']))
                        movement = None
                        if entry['quantity']:
                            movement = c.execute("INSERT INTO inventory_movements(operation_key, warehouse_id, catalog_item_id, quantity_delta, kind, reason) VALUES (?, ?, ?, ?, 'SYNTHETIC_OPENING', ?)", ('synthetic:' + fingerprint([planned['generation_id'], entry['sku']]), warehouse, item, entry['quantity'], 'Synthetic demo opening stock: ' + planned['generation_id'])).lastrowid
                        c.execute('INSERT INTO synthetic_stock_entries(generation_id, warehouse_id, catalog_item_id, identity_json, opening_quantity, reorder_level, scenario, opening_movement_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', (planned['generation_id'], warehouse, item, encode(entry['identity']), entry['quantity'], entry['reorder_level'], entry['scenario'], movement))
                    status = 'created'
    return {**planned, 'mode': 'commit' if commit else 'dry-run', 'status': status,
            'sku_count': len(planned['entries']), 'planned_opening_units': sum(e['quantity'] for e in planned['entries'])}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', type=Path, default=PROJECT_ROOT / 'api/synthetic_stock_config.json')
    parser.add_argument('--source-database')
    parser.add_argument('--database')
    parser.add_argument('--report', type=Path)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--dry-run', action='store_true')
    mode.add_argument('--commit', action='store_true')
    args = parser.parse_args()
    try:
        # Validate output paths before committing or writing the report.
        config = json.loads(args.config.read_text(encoding='utf-8'))
        scope_path = project_path(config['scope_file'])
        scope = json.loads(scope_path.read_text(encoding='utf-8'))
        protected = [args.config.resolve(), scope_path, project_path(args.source_database or scope['source_database']), project_path(args.database or scope['target_database'])]
        if args.report and any(args.report.resolve() == p or (args.report.exists() and p.exists() and args.report.samefile(p)) for p in protected):
            raise ValueError('Report must not overwrite inputs or a database.')
        report = generate(args.config, args.commit, args.source_database, args.database)
        output = json.dumps(report, indent=2)
        if args.report:
            args.report.write_text(output + '\n', encoding='utf-8')
        print(output)
    except (ValueError, KeyError, TypeError, OSError, sqlite3.Error) as error:
        parser.exit(2, f'Synthetic stock generation failed: {error}\n')


if __name__ == '__main__':
    main()
