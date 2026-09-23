"""Explicit SKU fitment and reviewed-claim conversion; no inferred compatibility."""
import hashlib
import json
import sqlite3

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator

from .database import get_connection

router = APIRouter(prefix="/api")


class Fitment(BaseModel):
    model: str = Field(min_length=1, max_length=150)
    make_year: int = Field(strict=True, ge=1886, le=2100)

    @field_validator("model")
    @classmethod
    def normalize(cls, value):
        if not value.strip():
            raise ValueError("Model is required")
        return value.strip().upper()


class CatalogRequest(BaseModel):
    sku: str = Field(min_length=1, max_length=100)
    part_name: str = Field(min_length=1, max_length=150)
    display_name: str = Field(min_length=1, max_length=200)
    fitments: list[Fitment] = Field(min_length=1)
    aliases: list[str] = Field(default_factory=list)

    @field_validator("sku", "part_name", "display_name")
    @classmethod
    def normalize(cls, value):
        if not value.strip():
            raise ValueError("Catalog fields must not be blank")
        return value.strip().upper()


def resolve_part(connection, name):
    name = name.strip().upper()
    return connection.execute("""
        SELECT id FROM parts WHERE part_name = ?
        UNION SELECT part_id AS id FROM part_aliases WHERE alias = ?
    """, (name, name)).fetchone()


def require_catalog(connection, sku, part_name=None, model=None, year=None):
    item = connection.execute("SELECT * FROM catalog_items WHERE sku = ?", (sku.strip().upper(),)).fetchone()
    if item is None:
        raise HTTPException(404, "Catalog SKU not found")
    if part_name is not None:
        part = resolve_part(connection, part_name)
        if part is None or part["id"] != item["part_id"]:
            raise HTTPException(400, "SKU does not match the selected part")
    if model is not None:
        match = connection.execute("""
            SELECT 1 FROM catalog_fitments f JOIN vehicles v ON v.id = f.vehicle_id
            WHERE f.catalog_item_id = ? AND v.model = ? AND v.make_year = ?
        """, (item["id"], model.strip().upper(), year)).fetchone()
        if match is None:
            raise HTTPException(400, "SKU is not cataloged for this vehicle and year")
    return item


@router.get("/catalog")
def list_catalog():
    with get_connection() as connection:
        items = [dict(row) for row in connection.execute("SELECT c.id, c.sku, c.display_name, p.part_name FROM catalog_items c JOIN parts p ON p.id = c.part_id ORDER BY c.sku")]
        for item in items:
            item["fitments"] = [dict(row) for row in connection.execute("SELECT v.model, v.make_year FROM catalog_fitments f JOIN vehicles v ON v.id = f.vehicle_id WHERE f.catalog_item_id = ? ORDER BY v.model, v.make_year", (item["id"],))]
        return items


@router.post("/catalog")
def add_catalog(request: CatalogRequest):
    try:
        with get_connection() as connection:
            connection.execute("BEGIN IMMEDIATE")
            part = resolve_part(connection, request.part_name)
            if part is None:
                connection.execute("INSERT INTO parts(part_name) VALUES (?)", (request.part_name,))
                part = resolve_part(connection, request.part_name)
            existing = connection.execute("SELECT * FROM catalog_items WHERE sku = ?", (request.sku,)).fetchone()
            if existing and (existing["part_id"] != part["id"] or existing["display_name"] != request.display_name):
                raise HTTPException(409, "Existing SKU has different catalog details")
            connection.execute("INSERT OR IGNORE INTO catalog_items(sku, part_id, display_name) VALUES (?, ?, ?)", (request.sku, part["id"], request.display_name))
            item = require_catalog(connection, request.sku)
            for fitment in request.fitments:
                connection.execute("INSERT OR IGNORE INTO vehicles(model, make_year) VALUES (?, ?)", (fitment.model, fitment.make_year))
                connection.execute("INSERT OR IGNORE INTO catalog_fitments(catalog_item_id, vehicle_id) SELECT ?, id FROM vehicles WHERE model = ? AND make_year = ?", (item["id"], fitment.model, fitment.make_year))
            for alias in request.aliases:
                alias = alias.strip().upper()
                if not alias:
                    raise HTTPException(400, "Part alias must not be blank")
                mapped = resolve_part(connection, alias)
                if mapped and mapped["id"] != part["id"]:
                    raise HTTPException(409, "Alias already refers to another part")
                connection.execute("INSERT OR IGNORE INTO part_aliases(alias, part_id) VALUES (?, ?)", (alias, part["id"]))
            return {"id": item["id"], "sku": item["sku"]}
    except sqlite3.IntegrityError as error:
        raise HTTPException(409, "Catalog entry conflicts with existing data") from error


class ConversionLine(BaseModel):
    part_name: str = Field(min_length=1)
    sku: str = Field(min_length=1)
    quantity: int = Field(strict=True, gt=0)
    unit_price: float = Field(ge=0, allow_inf_nan=False)

    @field_validator("part_name", "sku")
    @classmethod
    def normalize(cls, value):
        if not value.strip():
            raise ValueError("Part and SKU are required")
        return value.strip().upper()


class ConversionRequest(BaseModel):
    workshop_name: str = Field(min_length=1)
    lines: list[ConversionLine] = Field(min_length=1)


@router.post("/claims/{accident_id}/fulfillment-draft")
def convert_claim(accident_id: str, request: ConversionRequest):
    payload = {"workshop_name": request.workshop_name.strip(), "lines": sorted((line.model_dump() for line in request.lines), key=lambda line: (line["part_name"], line["sku"]))}
    fingerprint = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
    with get_connection() as connection:
        connection.execute("BEGIN IMMEDIATE")
        claim = connection.execute("SELECT c.*, v.model, v.make_year FROM claims c JOIN vehicles v ON v.id = c.vehicle_id WHERE accident_id = ?", (accident_id,)).fetchone()
        if claim is None:
            raise HTTPException(404, "Claim not found")
        previous = connection.execute("SELECT * FROM claim_conversions WHERE claim_id = ?", (claim["id"],)).fetchone()
        if previous:
            if previous["request_hash"] != fingerprint:
                raise HTTPException(409, "Claim was already converted with different details")
            return {"id": f"fulfill-{previous['fulfillment_order_id']}", "accident_id": accident_id, "replayed": True}
        predictions = list(connection.execute("SELECT cp.*, p.part_name FROM claim_predictions cp JOIN parts p ON p.id = cp.part_id WHERE claim_id = ?", (claim["id"],)))
        accepted = {row["part_name"]: row for row in predictions if row["human_action"] == "APPROVED"}
        if claim["status"] != "APPROVED" or not accepted or any(row["human_action"] is None for row in predictions):
            raise HTTPException(409, "Complete claim review and approve at least one part before conversion")
        if len(request.lines) != len(accepted) or {line.part_name for line in request.lines} != set(accepted):
            raise HTTPException(400, "Provide exactly one SKU line for every approved part")
        workshop = connection.execute("SELECT id FROM workshops WHERE name = ?", (request.workshop_name.strip(),)).fetchone()
        if workshop is None:
            raise HTTPException(404, "Workshop not found")
        items = [require_catalog(connection, line.sku, line.part_name, claim["model"], claim["make_year"]) for line in request.lines]
        order_id = connection.execute("INSERT INTO fulfillment_orders(workshop_id) VALUES (?)", (workshop["id"],)).lastrowid
        for line, item in zip(request.lines, items):
            connection.execute("""INSERT INTO fulfillment_order_lines(fulfillment_order_id, part_name, vehicle_model, make_year, quantity, unit_price, catalog_item_id, claim_prediction_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)""", (order_id, line.part_name, claim["model"], claim["make_year"], line.quantity, line.unit_price, item["id"], accepted[line.part_name]["id"]))
        connection.execute("INSERT INTO claim_conversions(claim_id, fulfillment_order_id, request_hash) VALUES (?, ?, ?)", (claim["id"], order_id, fingerprint))
        return {"id": f"fulfill-{order_id}", "accident_id": accident_id, "replayed": False}
