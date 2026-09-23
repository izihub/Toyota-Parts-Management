"""Import one normalized CSV/Excel row per historical claim; dry run by default."""
import argparse
import csv
import hashlib
import json
import sqlite3
from datetime import date, datetime
from pathlib import Path

from . import database, main as api
from .ml_contract import build_sample, positive_probabilities

ALIASES = {
    'source_claim_id': ('source_claim_id', 'Accident ID', 'Accident_ID'),
    'model': ('model', 'Model', 'Vehicle Model'),
    'make_year': ('make_year', 'Make_Year', 'Make Year', 'Year'),
    'damage_zone': ('damage_zone', 'Damage_Zone', 'Damage Zone', 'Inferred Damage Zone', 'Zone'),
    'accident_date': ('accident_date', 'Accident Date'),
    'parts_replaced': ('parts_replaced', 'Parts_Replaced', 'Parts Replaced'),
}


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True).encode()).hexdigest()


def read_rows(path, sheet=None):
    if path.suffix.lower() == '.csv':
        with path.open(encoding='utf-8-sig', newline='') as source:
            reader = csv.DictReader(source)
            headers = reader.fieldnames or []
            rows = list(reader)
    elif path.suffix.lower() == '.xlsx':
        try:
            import openpyxl
        except ImportError as error:
            raise ValueError('Excel import requires openpyxl; alternatively export the sheet as UTF-8 CSV.') from error
        workbook = openpyxl.load_workbook(path, read_only=True, data_only=True)
        try:
            table = workbook[sheet] if sheet else workbook.active
            iterator = table.iter_rows(values_only=True)
            headers = list(next(iterator, ()))
            rows = [dict(zip(headers, row)) for row in iterator if any(value is not None for value in row)]
        finally:
            workbook.close()
    else:
        raise ValueError('Use a .csv or .xlsx file.')
    normalized = [str(header).strip() for header in headers]
    if len(set(normalized)) != len(normalized):
        raise ValueError('Duplicate column headers are not allowed.')
    mapping = {}
    for target, aliases in ALIASES.items():
        matches = [header for header in normalized if header in aliases]
        if len(matches) > 1:
            raise ValueError(f'Ambiguous columns for {target}: {matches}')
        if not matches and target in ('source_claim_id', 'model', 'make_year', 'damage_zone'):
            raise ValueError(f'Missing required column: {target}')
        mapping[target] = matches[0] if matches else None
    for number, raw in enumerate(rows, 2):
        raw = {str(key).strip(): value for key, value in raw.items()}
        yield number, {target: raw.get(header) for target, header in mapping.items()}


def normalize(raw):
    def text(key):
        return str(raw[key]).strip() if raw.get(key) is not None else ''
    source_id = text('source_claim_id')
    if not source_id or len(source_id) > 150:
        raise ValueError('A stable source_claim_id of 1–150 characters is required.')
    year = text('make_year')
    # Excel commonly represents whole numbers as floats; reject fractional years.
    if year.endswith('.0'):
        year = year[:-2]
    if not year.isdigit():
        raise ValueError('make_year must be an integer.')
    request = api.VehicleClaimRequest(model=text('model'), make_year=int(year), damage_zone=text('damage_zone').title())
    historical_date = raw.get('accident_date')
    if isinstance(historical_date, (date, datetime)):
        historical_date = historical_date.date().isoformat() if isinstance(historical_date, datetime) else historical_date.isoformat()
    elif text('accident_date'):
        historical_date = date.fromisoformat(text('accident_date')).isoformat()
    else:
        historical_date = None
    return {'source_claim_id': source_id, **request.model_dump(), 'accident_date': historical_date, 'parts_replaced': text('parts_replaced')}


def lookup(connection, dataset, source_id):
    if not connection.execute("SELECT 1 FROM sqlite_master WHERE name='training_import_records'").fetchone():
        return None
    return connection.execute('SELECT input_hash, claim_id FROM training_import_records WHERE dataset=? AND source_claim_id=?', (dataset, source_id)).fetchone()


def import_file(path, dataset, commit=False, sheet=None, allow_unknown=False):
    path = Path(path)
    dataset = dataset.strip()
    if not dataset or len(dataset) > 150:
        raise ValueError('dataset must contain 1–150 characters.')
    file_hash = hashlib.sha256(path.read_bytes()).hexdigest()
    report = {'dataset': dataset, 'mode': 'commit' if commit else 'dry-run', 'records': []}
    records = []
    counts = {}
    for row, raw in read_rows(path, sheet):
        try:
            record = normalize(raw)
            records.append((row, record))
            key = record['source_claim_id']
            counts[key] = counts.get(key, 0) + 1
        except ValueError as error:
            report['records'].append({'row': row, 'status': 'invalid', 'error': str(error)})
    model = api.get_model_data()
    known = set(api.model_metadata()['vehicle_models'])
    if commit:
        database.init_database()
    for row, record in records:
        result = {'row': row, 'source_claim_id': record['source_claim_id']}
        fingerprint = digest(record)
        try:
            if counts[record['source_claim_id']] > 1:
                raise ValueError('Repeated source_claim_id in this file. Prepare one row per accident first.')
            if record['model'] not in known and not allow_unknown:
                raise ValueError('Unsupported vehicle variant; correct it or explicitly use --allow-unknown-model.')
            existing = None
            if database.DATABASE_PATH.exists():
                # Dry runs neither initialize nor migrate the target database.
                connection = sqlite3.connect(database.DATABASE_PATH.resolve().as_uri() + '?mode=ro', uri=True)
                try:
                    existing = lookup(connection, dataset, record['source_claim_id'])
                finally:
                    connection.close()
            if existing:
                result['status'] = 'skipped' if existing[0] == fingerprint else 'conflict'
                result['claim_id'] = existing[1]
            else:
                sample = build_sample(model, record['model'], record['make_year'], record['damage_zone'])
                scores = positive_probabilities(model, sample)
                predictions = [(str(name), float(score), float(threshold)) for name, score, threshold in zip(model['classes'], scores, model['thresholds']) if score >= threshold]
                result.update(status='valid', suggested_parts=len(predictions))
                if commit:
                    with database.get_connection() as connection:
                        connection.execute('BEGIN IMMEDIATE')
                        existing = lookup(connection, dataset, record['source_claim_id'])
                        if existing:
                            result.update(status='skipped' if existing[0] == fingerprint else 'conflict', claim_id=existing[1])
                        else:
                            connection.execute('INSERT OR IGNORE INTO import_batches(dataset, file_hash) VALUES (?, ?)', (dataset, file_hash))
                            batch_id = connection.execute('SELECT id FROM import_batches WHERE dataset=? AND file_hash=?', (dataset, file_hash)).fetchone()[0]
                            accident_id = database.next_accident_id(connection)
                            connection.execute('INSERT OR IGNORE INTO vehicles(model, make_year) VALUES (?, ?)', (record['model'], record['make_year']))
                            claim_id = connection.execute("INSERT INTO claims(accident_id, vehicle_id, damage_zone, model_version) SELECT ?, id, ?, ? FROM vehicles WHERE model=? AND make_year=?", (accident_id, record['damage_zone'], api.MODEL_VERSION, record['model'], record['make_year'])).lastrowid
                            connection.execute("UPDATE claims SET source_type='TRAINING_DATASET', dataset_source=?, source_claim_id=?, accident_date=?, import_batch_id=? WHERE id=?", (dataset, record['source_claim_id'], record['accident_date'], batch_id, claim_id))
                            for name, score, threshold in predictions:
                                connection.execute('INSERT OR IGNORE INTO parts(part_name) VALUES (?)', (name,))
                                connection.execute('INSERT INTO claim_predictions(claim_id, part_id, confidence_pct, urgency, threshold) SELECT ?, id, ?, ?, ? FROM parts WHERE part_name=?', (claim_id, round(score * 100, 1), 'High' if score >= .65 else 'Medium' if score >= .45 else 'Low', threshold, name))
                            connection.execute('INSERT INTO training_import_records(dataset, source_claim_id, input_hash, source_json, file_hash, claim_id, import_batch_id) VALUES (?, ?, ?, ?, ?, ?, ?)', (dataset, record['source_claim_id'], fingerprint, json.dumps(record), file_hash, claim_id, batch_id))
                            result.update(status='created', claim_id=claim_id, accident_id=accident_id, import_batch_id=batch_id)
        except (ValueError, sqlite3.Error) as error:
            result.update(status='invalid', error=str(error))
        report['records'].append(result)
    report['counts'] = {status: sum(row['status'] == status for row in report['records']) for status in ('valid', 'created', 'skipped', 'conflict', 'invalid')}
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--file', required=True, type=Path)
    parser.add_argument('--dataset', required=True)
    parser.add_argument('--sheet', help='Excel worksheet name; default is the active worksheet')
    parser.add_argument('--database', type=Path, help='Override the target SQLite database')
    parser.add_argument('--report', type=Path, help='Optional JSON report output')
    parser.add_argument('--allow-unknown-model', action='store_true')
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--dry-run', action='store_true')
    mode.add_argument('--commit', action='store_true')
    args = parser.parse_args()
    if args.database:
        database.DATABASE_PATH = args.database.resolve()
    if args.report and args.report.resolve() in (args.file.resolve(), database.DATABASE_PATH.resolve()):
        parser.error('Report must not overwrite the source file or database.')
    try:
        report = import_file(args.file, args.dataset, args.commit, args.sheet, args.allow_unknown_model)
    except (ValueError, OSError, KeyError, api.HTTPException) as error:
        parser.exit(2, f'Import failed: {error}\n')
    output = json.dumps(report, indent=2)
    if args.report:
        args.report.write_text(output + '\n', encoding='utf-8')
    print(output)
    return 1 if report['counts']['invalid'] or report['counts']['conflict'] else 0


if __name__ == '__main__':
    raise SystemExit(main())
