"""Import monthly historical part occurrences, never inferred unit demand."""
import argparse
import csv
from contextlib import closing
import hashlib
import json
from pathlib import Path
import re
import sqlite3
from collections import Counter
from . import database

MONTHS = {name: i for i, name in enumerate('JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC'.split(), 1)}
ALIASES = {
    'id': ('Accident ID', 'source_claim_id'), 'model': ('Model', 'model'),
    'year': ('Make Year', 'Make_Year', 'make_year'), 'month': ('Month', 'period_month'),
    'parts': ('Parts_Replaced', 'Parts Replaced', 'parts_replaced'),
}


def normalize(row):
    def get(field):
        matches = [key for key in ALIASES[field] if key in row]
        if len(matches) != 1:
            raise ValueError(f'Missing or ambiguous {field} column')
        value = row[matches[0]]
        return str(value).strip() if value is not None else ''
    source_id, model = get('id'), get('model').upper()
    if not source_id or not model:
        raise ValueError('Accident ID and model are required')
    year = get('year')
    if year.endswith('.0'):
        year = year[:-2]
    if not year.isdigit() or not 1886 <= int(year) <= 2100:
        raise ValueError('Invalid manufacture year')
    month = get('month').upper()
    if re.fullmatch(r'\d{4}-(0[1-9]|1[0-2])', month):
        period = month
    else:
        tokens = month.split()
        if len(tokens) != 2 or tokens[0] not in MONTHS or not re.fullmatch(r'\d{4}', tokens[1]):
            raise ValueError('Month must be YYYY-MM or MON YYYY')
        period = f'{tokens[1]}-{MONTHS[tokens[0]]:02d}'
    if not 1900 <= int(period[:4]) <= 2100:
        raise ValueError('Historical year must be between 1900 and 2100')
    parts = sorted({part.strip().upper() for part in re.split('[,;]', get('parts')) if part.strip()})
    if not parts:
        raise ValueError('No replaced parts provided')
    return {'source_claim_id': source_id, 'model': model, 'make_year': int(year), 'period_month': period, 'parts': parts}


def read_rows(path, sheet=None):
    if path.suffix.lower() == '.csv':
        with path.open(encoding='utf-8-sig', newline='') as f:
            reader = csv.DictReader(f)
            headers = reader.fieldnames or []
            rows = list(reader)
    elif path.suffix.lower() == '.xlsx':
        import openpyxl
        workbook = openpyxl.load_workbook(path, read_only=True, data_only=True)
        try:
            values = (workbook[sheet] if sheet else workbook.active).iter_rows(values_only=True)
            headers = list(next(values, ()))
            rows = [dict(zip(headers, row)) for row in values]
        finally:
            workbook.close()
    else:
        raise ValueError('Use CSV or XLSX')
    if len({str(h).strip() for h in headers}) != len(headers):
        raise ValueError('Duplicate column headers')
    return [{str(k).strip(): v for k, v in row.items()} for row in rows]


def run(path, dataset, commit=False, sheet=None):
    path = Path(path)
    dataset = dataset.strip()
    if not dataset or len(dataset) > 150:
        raise ValueError('A dataset namespace of 1–150 characters is required')
    file_hash = hashlib.sha256(path.read_bytes()).hexdigest()
    results, valid = [], []
    for index, raw in enumerate(read_rows(path, sheet), 2):
        try:
            valid.append((index, normalize(raw)))
        except ValueError as e:
            results.append({'row': index, 'status': 'invalid', 'error': str(e)})
    counts = Counter(record['source_claim_id'] for _, record in valid)
    existing = {}
    if database.DATABASE_PATH.exists():
        with closing(sqlite3.connect(database.DATABASE_PATH.resolve().as_uri() + '?mode=ro', uri=True)) as c:
            if c.execute("SELECT 1 FROM sqlite_master WHERE name='historical_demand_records'").fetchone():
                existing = dict(c.execute('SELECT source_claim_id,input_hash FROM historical_demand_records WHERE dataset=?', (dataset,)))
    if commit:
        database.init_database()
    for index, record in valid:
        key = record['source_claim_id']
        digest = hashlib.sha256(json.dumps(record, sort_keys=True).encode()).hexdigest()
        result = {'row': index, 'source_claim_id': key, 'period_month': record['period_month'], 'occurrences': len(record['parts'])}
        if counts[key] > 1:
            result.update(status='invalid', error='Repeated accident ID in file; prepare one row per accident')
        elif key in existing:
            result['status'] = 'skipped' if existing[key] == digest else 'conflict'
        elif not commit:
            result['status'] = 'valid'
        else:
            with database.get_connection() as c:
                c.execute('BEGIN IMMEDIATE')
                previous = c.execute('SELECT input_hash FROM historical_demand_records WHERE dataset=? AND source_claim_id=?', (dataset, key)).fetchone()
                if previous:
                    result['status'] = 'skipped' if previous[0] == digest else 'conflict'
                else:
                    record_id = c.execute('INSERT INTO historical_demand_records(dataset,source_claim_id,model,make_year,period_month,input_hash,file_hash) VALUES (?,?,?,?,?,?,?)', (dataset,key,record['model'],record['make_year'],record['period_month'],digest,file_hash)).lastrowid
                    c.executemany('INSERT INTO historical_part_occurrences VALUES (?,?)', [(record_id, part) for part in record['parts']])
                    result['status'] = 'created'
        results.append(result)
    return {'dataset': dataset, 'mode': 'commit' if commit else 'dry-run', 'measure': 'distinct_part_occurrences_per_accident',
            'coverage': 'UNKNOWN', 'records': results,
            'counts': {status: sum(r['status'] == status for r in results) for status in ('valid','created','skipped','conflict','invalid')}}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--file', type=Path, required=True)
    parser.add_argument('--dataset', required=True)
    parser.add_argument('--database', type=Path)
    parser.add_argument('--sheet')
    parser.add_argument('--report', type=Path)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--dry-run', action='store_true')
    mode.add_argument('--commit', action='store_true')
    args = parser.parse_args()
    if args.database:
        database.DATABASE_PATH = args.database.resolve()
    if args.report and any(args.report.resolve() == p.resolve() or (args.report.exists() and p.exists() and args.report.samefile(p)) for p in (args.file, database.DATABASE_PATH)):
        parser.error('Report must not overwrite source or database')
    try:
        report = run(args.file, args.dataset, args.commit, args.sheet)
        text = json.dumps(report, indent=2)
        if args.report:
            args.report.write_text(text + '\n', encoding='utf-8')
        print(text)
        return int(bool(report['counts']['invalid'] or report['counts']['conflict']))
    except (OSError, ValueError, KeyError, ImportError, sqlite3.Error) as e:
        parser.exit(2, f'History import failed: {e}\n')


if __name__ == '__main__':
    raise SystemExit(main())
