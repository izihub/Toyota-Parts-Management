PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS import_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dataset TEXT NOT NULL,
    file_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(dataset, file_hash)
);

CREATE TABLE IF NOT EXISTS training_import_records (
    dataset TEXT NOT NULL,
    source_claim_id TEXT NOT NULL,
    input_hash TEXT NOT NULL,
    source_json TEXT NOT NULL,
    file_hash TEXT NOT NULL,
    claim_id INTEGER NOT NULL UNIQUE REFERENCES claims(id),
    import_batch_id INTEGER REFERENCES import_batches(id),
    imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(dataset, source_claim_id)
);

CREATE TABLE IF NOT EXISTS intake_requests (
    request_key TEXT PRIMARY KEY,
    request_hash TEXT NOT NULL,
    response_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model TEXT NOT NULL,
    make_year INTEGER NOT NULL CHECK (make_year BETWEEN 1886 AND 2100),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(model, make_year)
);

CREATE TABLE IF NOT EXISTS claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    accident_id TEXT NOT NULL UNIQUE,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    damage_zone TEXT NOT NULL CHECK (damage_zone IN ('Front', 'Rear', 'Side')),
    model_version TEXT,
    source_type TEXT NOT NULL DEFAULT 'LIVE' CHECK (source_type IN ('LIVE', 'TRAINING_DATASET')),
    dataset_source TEXT,
    source_claim_id TEXT,
    accident_date TEXT,
    import_batch_id INTEGER REFERENCES import_batches(id),
    reviewed_at TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    part_name TEXT NOT NULL UNIQUE,
    part_number TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS claim_predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    claim_id INTEGER NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    part_id INTEGER NOT NULL REFERENCES parts(id),
    confidence_pct REAL NOT NULL CHECK (confidence_pct BETWEEN 0 AND 100),
    urgency TEXT NOT NULL CHECK (urgency IN ('High', 'Medium', 'Low')),
    human_action TEXT CHECK (human_action IN ('APPROVED', 'REJECTED')),
    threshold REAL CHECK (threshold BETWEEN 0 AND 1),
    reviewed_at TEXT,
    UNIQUE(claim_id, part_id)
);

CREATE TABLE IF NOT EXISTS warehouses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    location TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    part_id INTEGER NOT NULL REFERENCES parts(id),
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reorder_level INTEGER NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
    UNIQUE(warehouse_id, part_id)
);

CREATE TABLE IF NOT EXISTS workshops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    organization TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT NOT NULL UNIQUE,
    shipping_cost REAL NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
    workshop_id INTEGER REFERENCES workshops(id),
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_order_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    part_id INTEGER NOT NULL REFERENCES parts(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price REAL NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
    supplier TEXT,
    source_json TEXT,
    vehicle TEXT,
    catalog_item_id INTEGER REFERENCES catalog_items(id)
);

CREATE TABLE IF NOT EXISTS synergy_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    antecedent_part_id INTEGER NOT NULL REFERENCES parts(id),
    consequent_part_id INTEGER NOT NULL REFERENCES parts(id),
    support REAL NOT NULL,
    confidence REAL NOT NULL,
    lift REAL NOT NULL,
    UNIQUE(antecedent_part_id, consequent_part_id)
);

CREATE TABLE IF NOT EXISTS fulfillment_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workshop_id INTEGER NOT NULL REFERENCES workshops(id),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN TRANSIT', 'FULFILLED')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fulfillment_order_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fulfillment_order_id INTEGER NOT NULL REFERENCES fulfillment_orders(id) ON DELETE CASCADE,
    part_name TEXT NOT NULL,
    vehicle_model TEXT,
    make_year INTEGER,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price REAL NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
    catalog_item_id INTEGER REFERENCES catalog_items(id),
    claim_prediction_id INTEGER REFERENCES claim_predictions(id),
    source_json TEXT
);

CREATE TABLE IF NOT EXISTS catalog_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT NOT NULL UNIQUE,
    part_id INTEGER NOT NULL REFERENCES parts(id),
    display_name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS catalog_fitments (
    catalog_item_id INTEGER NOT NULL REFERENCES catalog_items(id),
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    PRIMARY KEY(catalog_item_id, vehicle_id)
);
CREATE TABLE IF NOT EXISTS part_aliases (
    alias TEXT PRIMARY KEY,
    part_id INTEGER NOT NULL REFERENCES parts(id)
);
CREATE TABLE IF NOT EXISTS catalog_inventory (
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    catalog_item_id INTEGER NOT NULL REFERENCES catalog_items(id),
    quantity INTEGER NOT NULL DEFAULT 0 CHECK(quantity >= 0),
    reorder_level INTEGER NOT NULL DEFAULT 0 CHECK(reorder_level >= 0),
    PRIMARY KEY(warehouse_id, catalog_item_id)
);
CREATE TABLE IF NOT EXISTS claim_conversions (
    claim_id INTEGER PRIMARY KEY REFERENCES claims(id),
    fulfillment_order_id INTEGER NOT NULL UNIQUE REFERENCES fulfillment_orders(id),
    request_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_reservations (
    fulfillment_line_id INTEGER PRIMARY KEY REFERENCES fulfillment_order_lines(id),
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    catalog_item_id INTEGER NOT NULL REFERENCES catalog_items(id),
    quantity INTEGER NOT NULL CHECK(quantity > 0)
);
CREATE TABLE IF NOT EXISTS inventory_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation_key TEXT NOT NULL UNIQUE,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    catalog_item_id INTEGER NOT NULL REFERENCES catalog_items(id),
    quantity_delta INTEGER NOT NULL,
    reservation_delta INTEGER NOT NULL DEFAULT 0,
    kind TEXT NOT NULL,
    fulfillment_order_id INTEGER REFERENCES fulfillment_orders(id),
    purchase_order_id INTEGER REFERENCES purchase_orders(id),
    reason TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS logistics_requests (
    request_key TEXT PRIMARY KEY,
    request_hash TEXT NOT NULL,
    response_json TEXT NOT NULL
);

-- Opening-stock provenance. Entries remain unchanged after dispatch/adjustments.
CREATE TABLE IF NOT EXISTS synthetic_stock_generations (
    generation_id TEXT PRIMARY KEY CHECK(length(trim(generation_id)) > 0),
    seed INTEGER NOT NULL CHECK(typeof(seed) = 'integer'),
    config_json TEXT NOT NULL CHECK(json_valid(config_json)),
    config_hash TEXT NOT NULL,
    source_snapshot_hash TEXT NOT NULL,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(generation_id, warehouse_id)
);

CREATE TABLE IF NOT EXISTS synthetic_stock_entries (
    generation_id TEXT NOT NULL,
    warehouse_id INTEGER NOT NULL,
    catalog_item_id INTEGER NOT NULL,
    identity_json TEXT NOT NULL CHECK(json_valid(identity_json)),
    opening_quantity INTEGER NOT NULL CHECK(typeof(opening_quantity) = 'integer' AND opening_quantity >= 0),
    reorder_level INTEGER NOT NULL CHECK(typeof(reorder_level) = 'integer' AND reorder_level >= 0),
    scenario TEXT NOT NULL CHECK(scenario IN ('fully_stocked', 'low_stock', 'stockout')),
    opening_movement_id INTEGER UNIQUE REFERENCES inventory_movements(id),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(generation_id, warehouse_id, catalog_item_id),
    UNIQUE(warehouse_id, catalog_item_id),
    FOREIGN KEY(generation_id, warehouse_id) REFERENCES synthetic_stock_generations(generation_id, warehouse_id),
    FOREIGN KEY(warehouse_id, catalog_item_id) REFERENCES catalog_inventory(warehouse_id, catalog_item_id),
    CHECK((opening_quantity = 0 AND opening_movement_id IS NULL) OR
          (opening_quantity > 0 AND opening_movement_id IS NOT NULL)),
    CHECK((scenario = 'fully_stocked' AND opening_quantity > 0 AND opening_quantity >= reorder_level) OR
          (scenario = 'low_stock' AND opening_quantity > 0 AND opening_quantity < reorder_level) OR
          (scenario = 'stockout' AND opening_quantity = 0))
);
