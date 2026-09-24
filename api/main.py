from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Query, Header
from pydantic import BaseModel, Field, field_validator
from typing import Any, Literal
import hashlib
import json
import sqlite3
import math
import joblib
from uuid import uuid4
from pathlib import Path
from .database import init_database, load_synergy_rules, load_rule_release, get_connection, next_accident_id
from .ml_contract import validate_model, build_sample, positive_probabilities
from .catalog import router as catalog_router, require_catalog
from .metrics import router as metrics_router
from .demand import router as demand_router
from .demand_service import record_requested_demand
from .logistics import router as logistics_router, transition, movement

app = FastAPI(title="Toyota Claims Intake AI")
app.include_router(catalog_router)
app.include_router(logistics_router)
app.include_router(metrics_router)
app.include_router(demand_router)


@app.get('/api/environment')
def environment():
    from .database import DATABASE_PATH
    with get_connection() as connection:
        synthetic = connection.execute('SELECT COUNT(*) FROM synthetic_stock_generations').fetchone()[0] > 0
        synthetic_demand = connection.execute("SELECT EXISTS(SELECT 1 FROM demand_events WHERE data_source='SYNTHETIC')").fetchone()[0] > 0
    return {'database_name': DATABASE_PATH.name, 'contains_synthetic_stock': synthetic, 'contains_synthetic_demand': synthetic_demand}


@app.on_event("startup")
def initialize_database() -> None:
    init_database()

# Allow Vite frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load tuned model at startup
MODEL_DATA = None
MODEL_VERSION = None


def get_model_data():
    global MODEL_DATA, MODEL_VERSION
    if MODEL_DATA is None:
        try:
            candidate = joblib.load(Path(__file__).with_name("real_model_option_a_tuned.joblib"))
            # Serve individual claims without spawning joblib worker processes.
            pipeline = candidate['pipeline']
            pipeline.set_params(**{name: 1 for name in pipeline.get_params(deep=True) if name == 'n_jobs' or name.endswith('__n_jobs')})
            for estimator in pipeline.named_steps['clf'].estimators_:
                estimator.set_params(**{name: 1 for name in estimator.get_params(deep=True) if name == 'n_jobs' or name.endswith('__n_jobs')})
            validate_model(candidate)
            MODEL_VERSION = hashlib.sha256(Path(__file__).with_name("real_model_option_a_tuned.joblib").read_bytes()).hexdigest()
            MODEL_DATA = candidate
        except (OSError, AttributeError, ImportError, ValueError, KeyError, TypeError) as error:
            raise HTTPException(503, "Prediction model is unavailable; install the pinned API dependencies") from error
    return MODEL_DATA

@app.get("/api/model-metadata")
def model_metadata():
    data = get_model_data()
    prep = data["pipeline"].named_steps["prep"]
    columns = next(columns for name, _, columns in prep.transformers_ if name == "cat")
    vocabulary = dict(zip(columns, prep.named_transformers_["cat"].categories_))
    return {
        "model_version": MODEL_VERSION,
        "vehicle_models": sorted(str(value) for value in vocabulary["Model_Grouped"] if value != "OTHER_MODEL"),
        "damage_zones": [zone for zone in ("Front", "Rear", "Side") if zone in vocabulary.get("Damage_Zone", ("Front", "Rear", "Side"))],
        "min_year": 1886, "max_year": 2100,
    }


class VehicleClaimRequest(BaseModel):
    model: str = Field(min_length=1, max_length=150)
    make_year: int = Field(strict=True, ge=1886, le=2100)
    damage_zone: Literal["Front", "Rear", "Side"] = "Front"

    @field_validator("model")
    @classmethod
    def normalize_model(cls, value):
        value = value.strip().upper()
        if not value:
            raise ValueError("Vehicle model is required")
        return value


class ClaimPartResponse(BaseModel):
    name: str
    confidence_pct: float
    urgency: str
    threshold: float | None = None
    human_action: Literal["APPROVED", "REJECTED"] | None = None


class ClaimResponse(BaseModel):
    id: str
    date: str
    vehicle: str
    year: int
    damage_zone: str
    status: str
    model_version: str | None
    fulfillment_order_id: int | None = None
    parts: list[ClaimPartResponse]


class IntakePartResponse(BaseModel):
    part_name: str
    confidence_pct: float
    urgency: str
    threshold: float


class IntakeResponse(BaseModel):
    accident_id: str
    vehicle: str
    damage_zone: str
    model_version: str
    predicted_parts: list[IntakePartResponse]


@app.get("/api/claims", response_model=list[ClaimResponse])
def list_claims(status: Literal["PENDING", "APPROVED", "REJECTED", "ALL"] = "PENDING"):
    with get_connection() as connection:
        rows = connection.execute("""
            SELECT c.accident_id, c.created_at, c.damage_zone, c.status,
                   c.model_version, (SELECT fulfillment_order_id FROM claim_conversions WHERE claim_id = c.id) AS fulfillment_order_id,
                   v.model, v.make_year, p.part_name,
                   cp.confidence_pct, cp.urgency, cp.threshold, cp.human_action
            FROM claims c JOIN vehicles v ON v.id = c.vehicle_id
            LEFT JOIN claim_predictions cp ON cp.claim_id = c.id
            LEFT JOIN parts p ON p.id = cp.part_id
            WHERE (? = 'ALL' OR c.status = ?)
            ORDER BY c.id DESC, cp.confidence_pct DESC
        """, (status, status))
        claims: dict[str, dict[str, Any]] = {}
        for row in rows:
            item = dict(row)
            claim = claims.setdefault(item["accident_id"], {
                "id": item["accident_id"], "date": item["created_at"],
                "vehicle": item["model"], "year": item["make_year"],
                "status": item["status"], "damage_zone": item["damage_zone"],
                "model_version": item["model_version"], "fulfillment_order_id": item["fulfillment_order_id"], "parts": [],
            })
            if item["part_name"] and (status != "PENDING" or item["human_action"] is None):
                claim["parts"].append({"name": item["part_name"], "confidence_pct": item["confidence_pct"], "urgency": item["urgency"], "threshold": item["threshold"], "human_action": item["human_action"]})
        return list(claims.values())


class ReorderBundleResponse(BaseModel):
    primary_part: str
    quantity: int
    companions: list[dict[str, Any]]
    rule_version: str


class StockEntry(BaseModel):
    vehicle_model: str
    make_year: int
    part_name: str
    quantity: int = Field(strict=True, gt=0)
    warehouse_name: str = "Main Warehouse"
    sku: str | None = None


class OrderSource(BaseModel):
    kind: Literal["manual", "bundle"] = "manual"
    primary_part: str | None = None
    rule_version: str | None = None
    mode: Literal["online", "offline"] | None = None


class OrderLine(BaseModel):
    supplier: str
    vehicle: str
    part: str
    quantity: int = Field(strict=True, gt=0)
    unit_price: float = Field(ge=0, allow_inf_nan=False)
    source: OrderSource = Field(default_factory=OrderSource)
    sku: str | None = None
    vehicle_model: str | None = None
    make_year: int | None = Field(default=None, strict=True, ge=1886, le=2100)


class OrderRequest(BaseModel):
    lines: list[OrderLine]
    status: str = "DRAFT"
    shipping_cost: float = Field(default=0, ge=0, allow_inf_nan=False)


class WorkshopRequest(BaseModel):
    name: str
    organization: str


class FulfillmentLine(BaseModel):
    part_name: str
    vehicle_model: str = ""
    make_year: int = 2026
    quantity: int = Field(strict=True, gt=0)
    unit_price: float = Field(default=0, ge=0, allow_inf_nan=False)
    sku: str | None = None


class FulfillmentRequest(BaseModel):
    workshop_name: str
    parts: list[FulfillmentLine]


class ReviewPart(BaseModel):
    accident_id: str = Field(min_length=1)
    part_name: str = Field(min_length=1)


class ReviewRequest(BaseModel):
    accident_ids: list[str] = Field(default_factory=list)
    parts: list[ReviewPart] = Field(default_factory=list)
    action: Literal["APPROVED", "REJECTED"]


class ReviewResponse(BaseModel):
    reviewed: int


@app.post("/api/claims/review", response_model=ReviewResponse)
def review_claims(request: ReviewRequest):
    action = request.action
    whole = set(request.accident_ids)
    selected = {(part.accident_id, part.part_name) for part in request.parts}
    if not whole and not selected:
        raise HTTPException(400, "Select at least one claim or part")
    with get_connection() as connection:
        connection.execute("BEGIN IMMEDIATE")
        affected = whole | {claim_id for claim_id, _ in selected}
        for accident_id in affected:
            claim = connection.execute("SELECT id FROM claims WHERE accident_id = ?", (accident_id,)).fetchone()
            if claim is None:
                raise HTTPException(404, "Claim not found")
            claim_id = claim["id"]
            if connection.execute("SELECT 1 FROM claim_conversions WHERE claim_id = ?", (claim_id,)).fetchone():
                raise HTTPException(409, "Converted claim reviews are locked to preserve order traceability")
            for _, part_name in sorted(pair for pair in selected if pair[0] == accident_id):
                cursor = connection.execute("""
                    UPDATE claim_predictions SET human_action = ?, reviewed_at = CURRENT_TIMESTAMP
                    WHERE claim_id = ? AND part_id = (SELECT id FROM parts WHERE part_name = ?)
                """, (action, claim_id, part_name))
                if cursor.rowcount == 0:
                    raise HTTPException(404, "Prediction part not found")
            if accident_id in whole:
                connection.execute("UPDATE claim_predictions SET human_action = ?, reviewed_at = CURRENT_TIMESTAMP WHERE claim_id = ?", (action, claim_id))
            decisions = [row[0] for row in connection.execute("SELECT human_action FROM claim_predictions WHERE claim_id = ?", (claim_id,))]
            # Mixed completed reviews are APPROVED if any part was accepted;
            # individual decisions remain available in history.
            status = ("PENDING" if None in decisions else "APPROVED" if "APPROVED" in decisions else "REJECTED") if decisions else action
            connection.execute("UPDATE claims SET status = ?, reviewed_at = CASE WHEN ? = 'PENDING' THEN NULL ELSE CURRENT_TIMESTAMP END WHERE id = ?", (status, status, claim_id))
    return {"reviewed": len(whole) + sum(1 for claim_id, _ in selected if claim_id not in whole)}


@app.get("/api/workshops")
def list_workshops():
    with get_connection() as connection:
        return [dict(row) for row in connection.execute("SELECT name, organization, created_at FROM workshops ORDER BY id DESC")]


@app.post("/api/workshops")
def add_workshop(request: WorkshopRequest):
    if not request.name.strip() or not request.organization.strip():
        raise HTTPException(400, "Workshop name and organization are required")
    with get_connection() as connection:
        connection.execute("INSERT INTO workshops(name, organization) VALUES (?, ?)",
                           (request.name.strip(), request.organization.strip()))
    return {"name": request.name.strip()}


@app.get("/api/fulfillment")
def list_fulfillment():
    with get_connection() as connection:
        rows = connection.execute("""
            SELECT f.id, f.status, w.name AS workshop, l.part_name, l.vehicle_model,
                   l.make_year, l.quantity, l.unit_price, ci.sku, l.claim_prediction_id, l.id AS line_id, l.catalog_item_id, l.source_json,
                   r.quantity AS reserved_quantity, rw.name AS reserved_warehouse,
                   c.accident_id
            FROM fulfillment_orders f JOIN workshops w ON w.id = f.workshop_id
            JOIN fulfillment_order_lines l ON l.fulfillment_order_id = f.id
            LEFT JOIN catalog_items ci ON ci.id = l.catalog_item_id
            LEFT JOIN stock_reservations r ON r.fulfillment_line_id = l.id
            LEFT JOIN warehouses rw ON rw.id = r.warehouse_id
            LEFT JOIN claim_conversions cv ON cv.fulfillment_order_id = f.id
            LEFT JOIN claims c ON c.id = cv.claim_id
            ORDER BY f.id DESC, l.id
        """)
        orders: dict[int, dict[str, Any]] = {}
        for row in rows:
            item = dict(row)
            order = orders.setdefault(item["id"], {"id": f"fulfill-{item['id']}", "workshop": item["workshop"], "status": item["status"], "accident_id": item["accident_id"], "parts": []})
            order["parts"].append({"id": item["line_id"], "catalog_item_id": item["catalog_item_id"], "name": item["part_name"], "sku": item["sku"] or item["part_name"], "qty": item["quantity"], "unitPrice": item["unit_price"], "vehicle_model": item["vehicle_model"], "make_year": item["make_year"], "claim_prediction_id": item["claim_prediction_id"], "reserved_quantity": item["reserved_quantity"] or 0, "reserved_warehouse": item["reserved_warehouse"], "source": json.loads(item["source_json"]) if item["source_json"] else None})
        return list(orders.values())


@app.post("/api/fulfillment")
def create_fulfillment(request: FulfillmentRequest):
    if not request.parts:
        raise HTTPException(400, "At least one part is required")
    with get_connection() as connection:
        workshop = connection.execute("SELECT id FROM workshops WHERE name = ?", (request.workshop_name.strip(),)).fetchone()
        if workshop is None:
            raise HTTPException(404, "Workshop not found")
        cursor = connection.execute("INSERT INTO fulfillment_orders(workshop_id) VALUES (?)", (workshop["id"],))
        for part in request.parts:
            if not part.part_name.strip() or part.quantity <= 0 or part.unit_price < 0:
                raise HTTPException(400, "Invalid fulfillment part")
            catalog_item = require_catalog(connection, part.sku, part.part_name, part.vehicle_model, part.make_year) if part.sku else None
            line_cursor = connection.execute("""
                INSERT INTO fulfillment_order_lines(fulfillment_order_id, part_name, vehicle_model, make_year, quantity, unit_price, catalog_item_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (cursor.lastrowid, part.part_name.strip().upper(), part.vehicle_model.strip().upper(), part.make_year, part.quantity, part.unit_price, catalog_item['id'] if catalog_item else None))
            record_requested_demand(connection, line_cursor.lastrowid)
    return {"id": f"fulfill-{cursor.lastrowid}"}


@app.patch("/api/fulfillment/{order_id}")
def update_fulfillment(order_id: int, status: str):
    return transition(order_id, status)


@app.delete("/api/fulfillment/{order_id}")
def delete_fulfillment(order_id: int):
    with get_connection() as connection:
        connection.execute("BEGIN IMMEDIATE")
        order = connection.execute('SELECT status FROM fulfillment_orders WHERE id = ?', (order_id,)).fetchone()
        if order and (order['status'] != 'PENDING' or connection.execute('SELECT 1 FROM inventory_movements WHERE fulfillment_order_id = ?', (order_id,)).fetchone()):
            raise HTTPException(409, 'Orders with inventory history or dispatch cannot be deleted')
        if connection.execute("SELECT 1 FROM claim_conversions WHERE fulfillment_order_id = ?", (order_id,)).fetchone():
            raise HTTPException(409, "A claim-linked fulfillment order cannot be deleted")
        if connection.execute('SELECT 1 FROM demand_events e JOIN fulfillment_order_lines l ON l.id=e.source_line_id WHERE l.fulfillment_order_id=?', (order_id,)).fetchone():
            raise HTTPException(409, 'Orders with recorded demand cannot be deleted; demand history must be preserved')
        cursor = connection.execute("DELETE FROM fulfillment_orders WHERE id = ?", (order_id,))
        if cursor.rowcount == 0:
            raise HTTPException(404, "Order not found")
    return {"deleted": order_id}


@app.get("/api/stock")
def list_stock():
    with get_connection() as connection:
        legacy = [dict(row) for row in connection.execute("""
            SELECT i.id, w.name AS warehouse_name, p.part_name, p.part_number,
                   i.quantity, i.reorder_level
            FROM inventory i JOIN warehouses w ON w.id = i.warehouse_id
            JOIN parts p ON p.id = i.part_id ORDER BY p.part_name
        """)]
        for item in legacy:
            item.update(sku=None, fitments=[], identity_status="LEGACY_UNMAPPED")
        catalog = [dict(row) for row in connection.execute("""
            SELECT 'sku-' || i.warehouse_id || '-' || ci.id AS id, w.name AS warehouse_name,
                   p.part_name, ci.sku AS part_number, ci.sku, ci.id AS catalog_item_id, i.quantity, i.reorder_level
            FROM catalog_inventory i JOIN catalog_items ci ON ci.id = i.catalog_item_id
            JOIN parts p ON p.id = ci.part_id JOIN warehouses w ON w.id = i.warehouse_id
            ORDER BY ci.sku, w.name
        """)]
        for item in catalog:
            item["identity_status"] = "CATALOGED"
            item['synthetic'] = connection.execute('SELECT 1 FROM synthetic_stock_entries WHERE warehouse_id=(SELECT id FROM warehouses WHERE name=?) AND catalog_item_id=?', (item['warehouse_name'], item['catalog_item_id'])).fetchone() is not None
            reserved = connection.execute('SELECT COALESCE(SUM(r.quantity), 0) FROM stock_reservations r JOIN warehouses w ON w.id = r.warehouse_id WHERE w.name = ? AND r.catalog_item_id = ?', (item['warehouse_name'], item['catalog_item_id'])).fetchone()[0]
            item['reserved_quantity'] = reserved
            item['available_quantity'] = item['quantity'] - reserved
            item["fitments"] = [dict(row) for row in connection.execute("SELECT v.model, v.make_year FROM catalog_fitments f JOIN vehicles v ON v.id = f.vehicle_id WHERE f.catalog_item_id = ?", (item["catalog_item_id"],))]
        return legacy + catalog


@app.post("/api/stock")
def add_stock(entries: list[StockEntry]):
    if not entries:
        raise HTTPException(400, "At least one stock entry is required")
    with get_connection() as connection:
        for entry in entries:
            if not entry.vehicle_model.strip() or not entry.part_name.strip() or entry.quantity <= 0:
                raise HTTPException(400, "Model, part and positive quantity are required")
            if entry.sku:
                item = require_catalog(connection, entry.sku, entry.part_name, entry.vehicle_model, entry.make_year)
                warehouse_name = entry.warehouse_name.strip() or "Main Warehouse"
                connection.execute("INSERT OR IGNORE INTO warehouses(name) VALUES (?)", (warehouse_name,))
                connection.execute("""INSERT INTO catalog_inventory(warehouse_id, catalog_item_id, quantity)
                    SELECT id, ?, ? FROM warehouses WHERE name = ?
                    ON CONFLICT(warehouse_id, catalog_item_id) DO UPDATE SET quantity = quantity + excluded.quantity""", (item["id"], entry.quantity, warehouse_name))
                warehouse = connection.execute('SELECT id FROM warehouses WHERE name = ?', (warehouse_name,)).fetchone()[0]
                movement(connection, uuid4().hex, warehouse, item['id'], entry.quantity, 'STOCK_ENTRY', reason='Manual SKU stock entry')
                continue
            part_name = entry.part_name.strip().upper()
            warehouse_name = entry.warehouse_name.strip() or "Main Warehouse"
            connection.execute("INSERT OR IGNORE INTO parts(part_name) VALUES (?)", (part_name,))
            connection.execute("INSERT OR IGNORE INTO warehouses(name) VALUES (?)", (warehouse_name,))
            connection.execute("INSERT OR IGNORE INTO vehicles(model, make_year) VALUES (?, ?)",
                               (entry.vehicle_model.strip().upper(), entry.make_year))
            connection.execute("""
                INSERT INTO inventory(warehouse_id, part_id, quantity)
                SELECT w.id, p.id, ? FROM warehouses w, parts p
                WHERE w.name = ? AND p.part_name = ?
                ON CONFLICT(warehouse_id, part_id) DO UPDATE SET quantity = quantity + excluded.quantity
            """, (entry.quantity, warehouse_name, part_name))
    return {"added": len(entries)}


@app.get("/api/orders")
def list_orders():
    with get_connection() as connection:
        rows = [dict(row) for row in connection.execute("""
            SELECT po.id, po.order_number, po.status, po.created_at, po.shipping_cost,
                   p.part_name AS part, l.quantity AS qty, l.unit_price AS unitPrice,
                   l.supplier, l.vehicle, l.source_json, ci.sku
            FROM purchase_orders po JOIN purchase_order_lines l ON l.purchase_order_id = po.id
            JOIN parts p ON p.id = l.part_id
            LEFT JOIN catalog_items ci ON ci.id = l.catalog_item_id ORDER BY po.id DESC, l.id
        """)]
        for row in rows:
            raw_source = row.pop("source_json")
            row["source"] = json.loads(raw_source) if raw_source else None
        return rows


@app.post("/api/orders")
def create_order(request: OrderRequest):
    if request.status not in ("DRAFT", "SUBMITTED") or not request.lines:
        raise HTTPException(400, "Valid status and at least one line are required")
    identities = [("sku", line.sku.strip().upper(), line.supplier.strip().upper(), (line.vehicle_model or '').strip().upper(), line.make_year) if line.sku else ("legacy", line.part.strip().upper()) for line in request.lines]
    if len(set(identities)) != len(identities):
        raise HTTPException(400, "Repeated order lines must be resolved before saving")
    if any(not line.supplier.strip() or not line.vehicle.strip() for line in request.lines):
        raise HTTPException(400, "Supplier and vehicle compatibility are required for every line")
    if any(line.source.kind == "bundle" and (not line.source.primary_part or not line.source.rule_version or not line.source.mode) for line in request.lines):
        raise HTTPException(400, "Bundle lines require recommendation source details")
    if any(line.source.kind == "bundle" and not line.sku for line in request.lines):
        raise HTTPException(400, "Bundle lines require a verified catalog SKU and fitment")
    with get_connection() as connection:
        order_number = f"PO-{__import__('uuid').uuid4().hex[:10].upper()}"
        cursor = connection.execute("INSERT INTO purchase_orders(order_number, status, shipping_cost) VALUES (?, ?, ?)",
                                    (order_number, request.status, request.shipping_cost))
        for line in request.lines:
            if not line.part.strip() or line.quantity <= 0 or line.unit_price < 0:
                raise HTTPException(400, "Each line needs a part, positive quantity and valid price")
            part_name = line.part.strip().upper()
            catalog_id = None
            vehicle = line.vehicle.strip()
            if line.sku:
                if not line.vehicle_model or line.make_year is None:
                    raise HTTPException(400, "Catalog orders require a vehicle model and year")
                item = require_catalog(connection, line.sku, part_name, line.vehicle_model, line.make_year)
                catalog_id = item["id"]
                part_name = connection.execute("SELECT part_name FROM parts WHERE id = ?", (item["part_id"],)).fetchone()[0]
                vehicle = f"{line.vehicle_model.strip().upper()} ({line.make_year})"
            connection.execute("INSERT OR IGNORE INTO parts(part_name) VALUES (?)", (part_name,))
            connection.execute("""
                INSERT INTO purchase_order_lines(purchase_order_id, part_id, quantity, unit_price, supplier, vehicle, source_json, catalog_item_id)
                SELECT ?, id, ?, ?, ?, ?, ?, ? FROM parts WHERE part_name = ?
            """, (cursor.lastrowid, line.quantity, line.unit_price, line.supplier.strip(), vehicle, line.source.model_dump_json(), catalog_id, part_name))
    return {"order_number": order_number, "status": request.status}


def cached_intake(connection, key, request_hash):
    if not key:
        return None
    row = connection.execute("SELECT request_hash, response_json FROM intake_requests WHERE request_key = ?", (key,)).fetchone()
    if row is None:
        return None
    if row["request_hash"] != request_hash:
        raise HTTPException(409, "Idempotency key already used for a different intake")
    return json.loads(row["response_json"])


@app.post("/api/predict-intake", response_model=IntakeResponse)
def predict_intake_parts(req: VehicleClaimRequest, idempotency_key: str | None = Header(default=None, min_length=1, max_length=128)):
    # Direct Python callers may omit the FastAPI header dependency.
    key = idempotency_key if isinstance(idempotency_key, str) else None
    if key is not None and not key.strip():
        raise HTTPException(400, "Idempotency key must not be blank")
    request_hash = hashlib.sha256(req.model_dump_json().encode()).hexdigest()
    with get_connection() as connection:
        cached = cached_intake(connection, key, request_hash)
        if cached is not None:
            return cached
    if not req.model.strip() or req.damage_zone not in ("Front", "Rear", "Side") or not 1886 <= req.make_year <= 2100:
        raise HTTPException(400, "Invalid model, damage zone or make year")
    model_data = get_model_data()
    try:
        sample = build_sample(model_data, req.model, req.make_year, req.damage_zone)
    except ValueError as error:
        raise HTTPException(400, str(error)) from error
    probs_1d = positive_probabilities(model_data, sample)
    
    chips = []
    for idx, part_name in enumerate(model_data["classes"]):
        prob = probs_1d[idx]
        t = model_data["thresholds"][idx]
        if prob >= t:
            chips.append({
                "part_name": part_name,
                "confidence_pct": round(float(prob) * 100, 1),
                "threshold": float(t),
                "urgency": "High" if prob >= 0.65 else ("Medium" if prob >= 0.45 else "Low")
            })
            
    chips.sort(key=lambda x: x["confidence_pct"], reverse=True)
    accident_id = None
    result = {
        "accident_id": accident_id,
        "vehicle": f"{req.model.upper()} ({req.make_year})",
        "damage_zone": req.damage_zone,
        "model_version": MODEL_VERSION,
        "predicted_parts": chips,
    }
    with get_connection() as connection:
        connection.execute("BEGIN IMMEDIATE")
        cached = cached_intake(connection, key, request_hash)
        if cached is not None:
            return cached
        accident_id = next_accident_id(connection)
        result["accident_id"] = accident_id
        model_name = req.model.strip().upper()
        connection.execute("INSERT OR IGNORE INTO vehicles(model, make_year) VALUES (?, ?)", (model_name, req.make_year))
        cursor = connection.execute("""
            INSERT INTO claims(accident_id, vehicle_id, damage_zone, model_version)
            SELECT ?, id, ?, ? FROM vehicles WHERE model = ? AND make_year = ?
        """, (accident_id, req.damage_zone, MODEL_VERSION, model_name, req.make_year))
        for chip in chips:
            connection.execute("INSERT OR IGNORE INTO parts(part_name) VALUES (?)", (chip["part_name"],))
            connection.execute("""
                INSERT INTO claim_predictions(claim_id, part_id, confidence_pct, urgency, threshold)
                SELECT ?, id, ?, ?, ? FROM parts WHERE part_name = ?
            """, (cursor.lastrowid, chip["confidence_pct"], chip["urgency"], chip["threshold"], chip["part_name"]))
        if key:
            connection.execute("INSERT INTO intake_requests(request_key, request_hash, response_json) VALUES (?, ?, ?)", (key, request_hash, json.dumps(result)))
    return result


@app.get("/api/ready")
def readiness():
    from fastapi.responses import JSONResponse
    report = {"database": False, "model": False, "rules": False, "model_version": None, "rule_version": None}
    try:
        with get_connection() as connection:
            connection.execute("SELECT model_version FROM claims LIMIT 1")
        report["database"] = True
    except sqlite3.Error:
        pass
    try:
        get_model_data()
        report.update(model=True, model_version=MODEL_VERSION)
    except HTTPException:
        pass
    try:
        rules = load_synergy_rules()
        if rules:
            report.update(rules=True, rule_version=hashlib.sha256(json.dumps(rules, sort_keys=True).encode()).hexdigest())
    except (OSError, ValueError):
        pass
    ready = all(report[field] for field in ("database", "model", "rules"))
    return JSONResponse({"ready": ready, **report}, status_code=200 if ready else 503)


@app.get("/api/reorder-bundle", response_model=ReorderBundleResponse)
def get_reorder_bundle(
    primary_part: str = Query(..., min_length=1),
    quantity: int = Query(..., ge=1),
):
    primary_part = primary_part.strip().upper()
    if not primary_part:
        raise HTTPException(400, "Primary part is required")
    rules, version = load_rule_release()
    if version is None:
        raise HTTPException(503, "Recommendation rules unavailable")
    companions = [
        {
            "companionPart": rule["consequent"],
            "lift": rule["lift"],
            "suggestedOrderQty": max(1, math.ceil(quantity * rule["confidence"])),
            "confidencePct": math.floor(rule["confidence"] * 100 + 0.5),
        }
        for rule in rules
        if rule["antecedent"] == primary_part and rule["consequent"] != primary_part
    ]
    companions.sort(key=lambda item: (-item["lift"], item["companionPart"]))
    return {"primary_part": primary_part, "quantity": quantity, "companions": companions, "rule_version": version}

