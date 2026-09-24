"""Current operational demand; no future-demand estimates are fabricated."""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Literal
from .forecast_runs import save_run, load_run
from .database import get_connection
from .forecasting import baseline

router = APIRouter(prefix='/api')


class ForecastRunRequest(BaseModel):
    request_key: str = Field(min_length=1, max_length=128, pattern=r'^\S+$')
    data_source: Literal['LIVE', 'HISTORICAL', 'SYNTHETIC'] = 'LIVE'


@router.post('/demand-forecast-runs')
def create_forecast_run(request: ForecastRunRequest):
    with get_connection() as c:
        c.execute('BEGIN IMMEDIATE')
        try:
            return save_run(c, request.request_key, data_source=request.data_source)
        except ValueError as exc:
            raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get('/demand-forecast-runs')
def list_forecast_runs(limit: int = Query(default=20, ge=1, le=100)):
    with get_connection() as c:
        return [dict(row) for row in c.execute('''SELECT id,created_at,data_source,method_version
            FROM forecast_runs ORDER BY id DESC LIMIT ?''', (limit,))]


@router.get('/demand-forecast-runs/{run_id}')
def get_forecast_run(run_id: int):
    with get_connection() as c:
        result = load_run(c, run_id)
        if result is None:
            raise HTTPException(status_code=404, detail='Forecast run not found')
        return result


@router.get('/demand-summary')
def demand_summary():
    with get_connection() as c:
        c.execute('BEGIN')
        def count(sql):
            return c.execute(sql).fetchone()[0]

        stock = [dict(row) for row in c.execute('''
            WITH reserved AS (
                SELECT warehouse_id, catalog_item_id, SUM(quantity) AS quantity
                FROM stock_reservations GROUP BY warehouse_id, catalog_item_id
            )
            SELECT i.warehouse_id, w.name AS warehouse, i.catalog_item_id, ci.sku,
                p.part_name, i.quantity AS on_hand, COALESCE(r.quantity,0) AS reserved,
                i.quantity - COALESCE(r.quantity,0) AS available, i.reorder_level,
                EXISTS(SELECT 1 FROM synthetic_stock_entries s WHERE s.warehouse_id=i.warehouse_id
                    AND s.catalog_item_id=i.catalog_item_id) AS synthetic
            FROM catalog_inventory i JOIN warehouses w ON w.id=i.warehouse_id
            JOIN catalog_items ci ON ci.id=i.catalog_item_id JOIN parts p ON p.id=ci.part_id
            LEFT JOIN reserved r ON r.warehouse_id=i.warehouse_id AND r.catalog_item_id=i.catalog_item_id
            ORDER BY ci.sku, w.name''')]
        sku_rows = [dict(row) for row in c.execute('''
            WITH demand AS (
                SELECT l.catalog_item_id, SUM(l.quantity) AS pending,
                    SUM(l.quantity - COALESCE(r.quantity,0)) AS unreserved
                FROM fulfillment_order_lines l JOIN fulfillment_orders f ON f.id=l.fulfillment_order_id
                LEFT JOIN stock_reservations r ON r.fulfillment_line_id=l.id
                WHERE f.status='PENDING' AND l.catalog_item_id IS NOT NULL GROUP BY l.catalog_item_id
            ), stock AS (
                SELECT catalog_item_id, SUM(quantity) AS quantity FROM catalog_inventory GROUP BY catalog_item_id
            ), reserved AS (
                SELECT catalog_item_id, SUM(quantity) AS quantity FROM stock_reservations GROUP BY catalog_item_id
            )
            SELECT ci.id AS catalog_item_id, ci.sku, p.part_name,
                COALESCE(s.quantity,0) AS on_hand, COALESCE(r.quantity,0) AS reserved,
                COALESCE(s.quantity,0)-COALESCE(r.quantity,0) AS available,
                COALESCE(d.pending,0) AS pending_units, COALESCE(d.unreserved,0) AS unreserved_pending_units
            FROM catalog_items ci JOIN parts p ON p.id=ci.part_id
            LEFT JOIN demand d ON d.catalog_item_id=ci.id LEFT JOIN stock s ON s.catalog_item_id=ci.id
            LEFT JOIN reserved r ON r.catalog_item_id=ci.id ORDER BY ci.sku''')]
        for row in stock:
            row['synthetic'] = bool(row['synthetic'])
            row['stock_status'] = 'STOCKOUT' if row['available'] == 0 else 'LOW' if 0 < row['available'] < row['reorder_level'] else 'AVAILABLE'
        for row in sku_rows:
            row['global_unallocated_shortage_units'] = max(0, row['unreserved_pending_units'] - row['available'])
        return {
            'scope': {'warehouses': 'ALL', 'data_sources': 'ALL_INCLUDING_HISTORICAL_AND_SYNTHETIC', 'period': 'CURRENT_STATE'},
            'as_of': count("SELECT strftime('%Y-%m-%dT%H:%M:%SZ','now')"),
            'pending_claims': count("SELECT COUNT(*) FROM claims WHERE status='PENDING'"),
            'approved_part_occurrences': count("SELECT COUNT(*) FROM claim_predictions WHERE human_action='APPROVED'"),
            'pending_catalog_units': sum(r['pending_units'] for r in sku_rows),
            'unreserved_pending_units': sum(r['unreserved_pending_units'] for r in sku_rows),
            'unmapped_pending_units': count("SELECT COALESCE(SUM(l.quantity),0) FROM fulfillment_order_lines l JOIN fulfillment_orders f ON f.id=l.fulfillment_order_id WHERE f.status='PENDING' AND l.catalog_item_id IS NULL"),
            'catalog_on_hand': sum(r['on_hand'] for r in stock),
            'reserved_units': sum(r['reserved'] for r in stock),
            'available_units': sum(r['available'] for r in stock),
            'legacy_stock_units': count('SELECT COALESCE(SUM(quantity),0) FROM inventory'),
            'stockout_records': sum(r['stock_status'] == 'STOCKOUT' for r in stock),
            'low_availability_records': sum(r['stock_status'] == 'LOW' for r in stock),
            'sku_rows': sku_rows, 'warehouse_stock': stock,
            'forecast': baseline(c),
            'notes': ['Approved predictions count part occurrences, not requested units.',
                      'Unreserved demand is global; an unreserved order has no assigned warehouse.',
                      'Global shortage is a pooled comparison, not a guarantee of single-warehouse fulfillment.',
                      'Stockout counts cover recorded warehouse/SKU balances; missing balances are not counted.'],
        }
