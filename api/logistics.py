"""Transactional inventory allocation, dispatch, receipt and companion additions."""
import hashlib
import json
import math
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from .database import get_connection, load_rule_release
from .catalog import require_catalog

router = APIRouter(prefix="/api")


def order_row(connection, order_id):
    row = connection.execute("SELECT * FROM fulfillment_orders WHERE id = ?", (order_id,)).fetchone()
    if row is None:
        raise HTTPException(404, "Fulfillment order not found")
    return row


def editable(connection, order_id):
    if order_row(connection, order_id)["status"] != "PENDING":
        raise HTTPException(409, "Only pending orders can be edited")
    if connection.execute("SELECT 1 FROM stock_reservations r JOIN fulfillment_order_lines l ON l.id = r.fulfillment_line_id WHERE l.fulfillment_order_id = ?", (order_id,)).fetchone():
        raise HTTPException(409, "Release stock reservations before editing order lines")


def warehouse_id(connection, name):
    row = connection.execute("SELECT id FROM warehouses WHERE name = ?", (name.strip(),)).fetchone()
    if row is None:
        raise HTTPException(404, "Warehouse not found")
    return row["id"]


def availability(connection, warehouse, item):
    stock = connection.execute("SELECT quantity FROM catalog_inventory WHERE warehouse_id = ? AND catalog_item_id = ?", (warehouse, item)).fetchone()
    reserved = connection.execute("SELECT COALESCE(SUM(quantity), 0) FROM stock_reservations WHERE warehouse_id = ? AND catalog_item_id = ?", (warehouse, item)).fetchone()[0]
    return (stock[0] if stock else 0) - reserved


def movement(connection, key, warehouse, item, delta, kind, order=None, purchase=None, reserved=0, reason=None):
    connection.execute("""INSERT INTO inventory_movements(operation_key, warehouse_id, catalog_item_id, quantity_delta, reservation_delta, kind, fulfillment_order_id, purchase_order_id, reason)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""", (key, warehouse, item, delta, reserved, kind, order, purchase, reason))


class WarehouseRequest(BaseModel):
    warehouse_name: str = Field(min_length=1)


@router.get('/warehouses')
def warehouses():
    with get_connection() as connection:
        return [dict(row) for row in connection.execute('SELECT id, name FROM warehouses ORDER BY name')]


@router.get('/inventory/movements')
def movements():
    with get_connection() as connection:
        return [dict(row) for row in connection.execute("""SELECT m.*, c.sku, w.name AS warehouse_name FROM inventory_movements m
            JOIN catalog_items c ON c.id = m.catalog_item_id JOIN warehouses w ON w.id = m.warehouse_id ORDER BY m.id DESC LIMIT 200""")]


@router.post('/fulfillment/{order_id}/reserve')
def reserve(order_id: int, request: WarehouseRequest):
    with get_connection() as connection:
        connection.execute('BEGIN IMMEDIATE')
        if order_row(connection, order_id)['status'] != 'PENDING':
            raise HTTPException(409, 'Only pending orders can reserve stock')
        warehouse = warehouse_id(connection, request.warehouse_name)
        lines = list(connection.execute('SELECT * FROM fulfillment_order_lines WHERE fulfillment_order_id = ?', (order_id,)))
        existing = list(connection.execute('SELECT r.* FROM stock_reservations r JOIN fulfillment_order_lines l ON l.id = r.fulfillment_line_id WHERE l.fulfillment_order_id = ?', (order_id,)))
        if existing:
            if len(existing) == len(lines) and all(row['warehouse_id'] == warehouse for row in existing):
                return {'reserved': order_id, 'replayed': True}
            raise HTTPException(409, 'Release the existing reservation before changing warehouses')
        if not lines or any(line['catalog_item_id'] is None for line in lines):
            raise HTTPException(409, 'Map every order line to a catalog SKU before reserving')
        for line in lines:
            if availability(connection, warehouse, line['catalog_item_id']) < line['quantity']:
                raise HTTPException(409, 'Insufficient available stock; no reservation was made')
            connection.execute('INSERT INTO stock_reservations(fulfillment_line_id, warehouse_id, catalog_item_id, quantity) VALUES (?, ?, ?, ?)', (line['id'], warehouse, line['catalog_item_id'], line['quantity']))
            movement(connection, uuid4().hex, warehouse, line['catalog_item_id'], 0, 'RESERVE', order_id, reserved=line['quantity'])
        return {'reserved': order_id, 'replayed': False}


@router.post('/fulfillment/{order_id}/release')
def release(order_id: int):
    with get_connection() as connection:
        connection.execute('BEGIN IMMEDIATE')
        if order_row(connection, order_id)['status'] != 'PENDING':
            raise HTTPException(409, 'Dispatched orders cannot release stock')
        rows = list(connection.execute('SELECT r.* FROM stock_reservations r JOIN fulfillment_order_lines l ON l.id = r.fulfillment_line_id WHERE l.fulfillment_order_id = ?', (order_id,)))
        for row in rows:
            connection.execute('DELETE FROM stock_reservations WHERE fulfillment_line_id = ?', (row['fulfillment_line_id'],))
            movement(connection, uuid4().hex, row['warehouse_id'], row['catalog_item_id'], 0, 'RELEASE', order_id, reserved=-row['quantity'])
        return {'released': order_id}


def transition(order_id, status):
    if status not in ('PENDING', 'IN TRANSIT', 'FULFILLED'):
        raise HTTPException(400, 'Invalid status')
    with get_connection() as connection:
        connection.execute('BEGIN IMMEDIATE')
        current = order_row(connection, order_id)['status']
        if current == status:
            return {'status': status}
        if (current, status) not in [('PENDING', 'IN TRANSIT'), ('IN TRANSIT', 'FULFILLED')]:
            raise HTTPException(409, 'Reserve, dispatch, then confirm delivery; backward transitions are not allowed')
        if status == 'IN TRANSIT':
            lines = list(connection.execute('SELECT l.*, r.warehouse_id, r.quantity AS reserved_quantity FROM fulfillment_order_lines l LEFT JOIN stock_reservations r ON r.fulfillment_line_id = l.id WHERE l.fulfillment_order_id = ?', (order_id,)))
            if not lines or any(line['warehouse_id'] is None or line['reserved_quantity'] != line['quantity'] for line in lines):
                raise HTTPException(409, 'Reserve all order lines before dispatch')
            for line in lines:
                cursor = connection.execute('UPDATE catalog_inventory SET quantity = quantity - ? WHERE warehouse_id = ? AND catalog_item_id = ? AND quantity >= ?', (line['quantity'], line['warehouse_id'], line['catalog_item_id'], line['quantity']))
                if cursor.rowcount != 1:
                    raise HTTPException(409, 'Insufficient stock; dispatch was not applied')
                connection.execute('DELETE FROM stock_reservations WHERE fulfillment_line_id = ?', (line['id'],))
                movement(connection, f"dispatch:{order_id}:{line['id']}", line['warehouse_id'], line['catalog_item_id'], -line['quantity'], 'DISPATCH', order_id, reserved=-line['quantity'])
        connection.execute('UPDATE fulfillment_orders SET status = ? WHERE id = ?', (status, order_id))
        return {'status': status}


class MapLineRequest(BaseModel):
    sku: str = Field(min_length=1)
    vehicle_model: str = Field(min_length=1)
    make_year: int = Field(strict=True, ge=1886, le=2100)


@router.post('/fulfillment/{order_id}/lines/{line_id}/catalog')
def map_line(order_id: int, line_id: int, request: MapLineRequest):
    with get_connection() as connection:
        connection.execute('BEGIN IMMEDIATE')
        editable(connection, order_id)
        line = connection.execute('SELECT * FROM fulfillment_order_lines WHERE id = ? AND fulfillment_order_id = ?', (line_id, order_id)).fetchone()
        if line is None:
            raise HTTPException(404, 'Order line not found')
        if line['catalog_item_id'] is not None:
            raise HTTPException(409, 'Order line already has a verified catalog identity')
        model = request.vehicle_model.strip().upper()
        if line['vehicle_model'] and (line['vehicle_model'].strip().upper() != model or line['make_year'] != request.make_year):
            raise HTTPException(400, 'Selected fitment must match the recorded vehicle')
        item = require_catalog(connection, request.sku, line['part_name'], model, request.make_year)
        connection.execute('UPDATE fulfillment_order_lines SET catalog_item_id = ?, vehicle_model = ?, make_year = ? WHERE id = ?', (item['id'], model, request.make_year, line_id))
        return {'mapped': line_id}


def companion_suggestions(connection, order_id):
    order_row(connection, order_id)
    lines = [dict(row) for row in connection.execute('SELECT l.*, p.part_name AS canonical_name FROM fulfillment_order_lines l LEFT JOIN catalog_items c ON c.id = l.catalog_item_id LEFT JOIN parts p ON p.id = c.part_id WHERE l.fulfillment_order_id = ?', (order_id,))]
    rules, version = load_rule_release()
    if version is None:
        raise HTTPException(503, 'Companion rules unavailable')
    present = {(line['canonical_name'] or line['part_name'].strip().upper(), line['vehicle_model'], line['make_year']) for line in lines}
    suggestions = {}
    for line in lines:
        if not line['catalog_item_id']:
            continue
        for rule in rules:
            key = (rule['consequent'], line['vehicle_model'], line['make_year'])
            if rule['antecedent'] != line['canonical_name'] or key in present or rule['consequent'] == rule['antecedent']:
                continue
            quantity = max(1, math.ceil(line['quantity'] * rule['confidence']))
            suggestion = {'part_name': key[0], 'vehicle_model': key[1], 'make_year': key[2], 'source_line_id': line['id'], 'suggested_quantity': quantity, 'confidence_pct': math.floor(rule['confidence'] * 100 + .5), 'lift': rule['lift'], 'rule_version': version}
            # Do not sum overlapping associations: use the strongest quantity requirement.
            if key not in suggestions or (quantity, rule['lift']) > (suggestions[key]['suggested_quantity'], suggestions[key]['lift']):
                suggestions[key] = suggestion
    return sorted(suggestions.values(), key=lambda item: (-item['lift'], item['part_name'], item['vehicle_model'], item['make_year']))


@router.get('/fulfillment/{order_id}/companions')
def companions(order_id: int):
    with get_connection() as connection:
        return companion_suggestions(connection, order_id)


class CompanionRequest(BaseModel):
    source_line_id: int
    part_name: str
    sku: str
    quantity: int = Field(strict=True, gt=0)
    unit_price: float = Field(ge=0, allow_inf_nan=False)
    rule_version: str
    request_key: str = Field(min_length=1, max_length=128)


def replay(connection, key, payload):
    fingerprint = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
    row = connection.execute('SELECT * FROM logistics_requests WHERE request_key = ?', (key,)).fetchone()
    if row:
        if row['request_hash'] != fingerprint:
            raise HTTPException(409, 'Request key was already used with different details')
        return fingerprint, json.loads(row['response_json'])
    return fingerprint, None


def record_request(connection, key, fingerprint, response):
    connection.execute('INSERT INTO logistics_requests VALUES (?, ?, ?)', (key, fingerprint, json.dumps(response)))


@router.post('/fulfillment/{order_id}/companions')
def add_companion(order_id: int, request: CompanionRequest):
    with get_connection() as connection:
        connection.execute('BEGIN IMMEDIATE')
        key = 'companion:' + request.request_key
        fingerprint, cached = replay(connection, key, {'order_id': order_id, **request.model_dump()})
        if cached is not None:
            return cached
        editable(connection, order_id)
        match = next((item for item in companion_suggestions(connection, order_id) if item['source_line_id'] == request.source_line_id and item['part_name'] == request.part_name and item['rule_version'] == request.rule_version), None)
        if match is None:
            raise HTTPException(409, 'Suggestion changed or companion is already present; refresh recommendations')
        item = require_catalog(connection, request.sku, request.part_name, match['vehicle_model'], match['make_year'])
        line_id = connection.execute('''INSERT INTO fulfillment_order_lines(fulfillment_order_id, part_name, vehicle_model, make_year, quantity, unit_price, catalog_item_id, source_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)''', (order_id, request.part_name, match['vehicle_model'], match['make_year'], request.quantity, request.unit_price, item['id'], json.dumps(match))).lastrowid
        response = {'line_id': line_id}
        record_request(connection, key, fingerprint, response)
        return response


@router.post('/orders/{order_id}/receive')
def receive(order_id: int, request: WarehouseRequest):
    with get_connection() as connection:
        connection.execute('BEGIN IMMEDIATE')
        key = f'receive:{order_id}'
        fingerprint, cached = replay(connection, key, {'warehouse_name': request.warehouse_name.strip()})
        if cached is not None:
            return cached
        order = connection.execute('SELECT * FROM purchase_orders WHERE id = ?', (order_id,)).fetchone()
        if order is None:
            raise HTTPException(404, 'Purchase order not found')
        if order['status'] != 'SUBMITTED':
            raise HTTPException(409, 'Only submitted purchase orders can be received')
        warehouse = warehouse_id(connection, request.warehouse_name)
        lines = list(connection.execute('SELECT * FROM purchase_order_lines WHERE purchase_order_id = ?', (order_id,)))
        if not lines or any(line['catalog_item_id'] is None for line in lines):
            raise HTTPException(409, 'Every purchase line must have a catalog SKU before receipt')
        for line in lines:
            connection.execute('''INSERT INTO catalog_inventory(warehouse_id, catalog_item_id, quantity) VALUES (?, ?, ?)
                ON CONFLICT(warehouse_id, catalog_item_id) DO UPDATE SET quantity = quantity + excluded.quantity''', (warehouse, line['catalog_item_id'], line['quantity']))
            movement(connection, f"receive:{order_id}:{line['id']}", warehouse, line['catalog_item_id'], line['quantity'], 'RECEIPT', purchase=order_id)
        connection.execute("UPDATE purchase_orders SET status = 'RECEIVED' WHERE id = ?", (order_id,))
        response = {'received': order_id}
        record_request(connection, key, fingerprint, response)
        return response


class AdjustmentRequest(BaseModel):
    warehouse_name: str = Field(min_length=1)
    sku: str = Field(min_length=1)
    quantity_delta: int = Field(strict=True)
    reason: str = Field(min_length=1, max_length=500)
    request_key: str = Field(min_length=1, max_length=128)


@router.post('/inventory/adjust')
def adjust(request: AdjustmentRequest):
    if not request.reason.strip() or request.quantity_delta == 0:
        raise HTTPException(400, 'Provide a reason and a nonzero integer adjustment')
    with get_connection() as connection:
        connection.execute('BEGIN IMMEDIATE')
        key = 'adjust:' + request.request_key
        fingerprint, cached = replay(connection, key, request.model_dump())
        if cached is not None:
            return cached
        item = require_catalog(connection, request.sku)
        warehouse = warehouse_id(connection, request.warehouse_name)
        if availability(connection, warehouse, item['id']) + request.quantity_delta < 0:
            raise HTTPException(409, 'Adjustment would consume reserved stock or make available stock negative')
        if request.quantity_delta > 0:
            connection.execute("""INSERT INTO catalog_inventory(warehouse_id, catalog_item_id, quantity) VALUES (?, ?, ?)
                ON CONFLICT(warehouse_id, catalog_item_id) DO UPDATE SET quantity = quantity + excluded.quantity""", (warehouse, item['id'], request.quantity_delta))
        else:
            connection.execute('UPDATE catalog_inventory SET quantity = quantity + ? WHERE warehouse_id = ? AND catalog_item_id = ?', (request.quantity_delta, warehouse, item['id']))
        movement(connection, key, warehouse, item['id'], request.quantity_delta, 'ADJUSTMENT', reason=request.reason.strip())
        response = {'adjusted': request.sku, 'quantity_delta': request.quantity_delta}
        record_request(connection, key, fingerprint, response)
        return response
