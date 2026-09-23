# Adding reasonable synthetic stock to the existing app

## Implementation progress — Step 8 completed

Added `api/test_demo_stock_workflow.py` and ran it against a temporary SQLite backup of the seeded demo database. The application demo retains its **44 units**; test workshops and orders were created only in the temporary copy.

Verified through the API:

| Operation | On hand | Reserved | Available |
| --- | --- | --- | --- |
| Opening balances | 44 | 0 | 44 |
| Reserve 2 units of each of the 4 fully stocked parts | 44 | 8 | 36 |
| Release reservation | 44 | 0 | 44 |
| Reserve again and dispatch | 36 | 0 | 36 |
| Confirm delivery | 36 | 0 | 36 |

Low-stock and stockout orders return HTTP 409, including a mixed order whose first line has enough stock: the whole reservation rolls back. Duplicate reservation, release, dispatch and delivery requests do not duplicate stock effects. Dispatch without reservation, delivery before dispatch, release after dispatch and backward status transitions are rejected.

Each final SKU balance reconciles with its movement ledger. Re-running the seeder after dispatch returns `skipped`, leaving the reduced balances and movement counts intact. Database reinitialization preserves those balances, and foreign-key checks pass.

```powershell
py -3.13 -m unittest api.test_demo_stock_workflow api.test_synthetic_stock
```

All **5 tests passed**. The acceptance test expects the original seeded demo baseline; it deliberately fails if that baseline has been changed. Automated stock-workflow validation is complete. Browser interaction/visual verification remains manual.

## Implementation progress — Step 7 completed

The backend now reads `TOYOTA_DATABASE_PATH`. Relative paths resolve from the project root; when unset, it retains the original `api/toyota_parts.db` default. The running backend was switched to `api/demo_parts.db` for this step.

Start the demo backend (after stopping any backend already using port 8000):

```powershell
.\api\start_demo.ps1
```

The launcher checks that the demo database exists and restores the shell's previous environment setting on exit. To return to the original claims database, stop the demo backend and start explicitly:

```powershell
$env:TOYOTA_DATABASE_PATH = 'api/toyota_parts.db'
py -3.13 -m uvicorn api.main:app --host 127.0.0.1 --port 8000
```

`GET /api/environment` identifies the active database by filename and whether it contains synthetic generations. The dashboard shows a synthetic-stock banner; stock rows carry a `[SYNTHETIC]` label based on generation provenance rather than guessing from SKU text.

Verified through the running API: 10 synthetic stock rows, 44 on-hand units and zero pending claims in the demo database. The original imported claims remain in the original database. TypeScript and production build passed. Reload the frontend after switching databases to clear previously loaded view data. Visual browser verification remains manual.

Next: **Step 8 — test reservation, release, dispatch, delivery and insufficient-stock handling with the demo stock**.

## Implementation progress — Step 6 completed

Committed generation `toyota-demo-stock-v1` to **`api/demo_parts.db`**, with results saved in `imports/synthetic-stock-result.json`.

- Created **Demo Warehouse**, **10 synthetic SKUs** with exact demo fitments, and **44 opening units** matching the preview.
- Recorded **8 positive opening movements** totaling 44 units; the 2 zero-stock entries have no movement.
- Verified quantities, reorder levels, provenance-to-movement links, foreign keys and SQLite integrity.
- Repeated the commit: returned `skipped` and preserved all balances and ledger counts.
- No claims or reservations were created. Source claims were not copied or approved.

The synthetic balances are stored in the separate demo database. This step does not switch the running application away from its existing database.

Next: **Step 7 — connect the app to the demo database with explicit configuration and visible synthetic-stock labels**.

## Implementation progress — Step 5 completed

Ran the generator in dry-run mode and saved `imports/synthetic-stock-preview.json`. The result is **ready**, with no detected source-identity or target conflicts.

| Scenario | SKUs | Planned total units | Reservation of 2 per part |
| --- | --- | --- | --- |
| Fully stocked — VITZ KSP130, 2015 | 4 | 40 | Sufficient for every selected part. |
| Low stock — AQUA NHP10, 2013 | 4 | 4 | Insufficient: each SKU has 1 unit. |
| Stockout — VITZ KSP130, 2020 | 2 | 0 | Insufficient. |

Validated 10 unique synthetic SKUs and 44 planned opening units. Source claims matched the saved scope. The target `api/demo_parts.db` did not exist after preview; no stock was inserted. This confirms the initial stock scenarios, not a completed fulfillment transaction.

Next: **Step 6 — commit the reviewed generation to the separate demo database and verify balances and ledger entries**.

## Implementation progress — Step 4 completed

Implemented `api/seed_synthetic_stock.py`. It reads the configuration and scope, verifies each selected claim's vehicle and suggested parts against the source database, and produces deterministic synthetic SKUs and quantities. It requires a separate target database.

Available commands from the project root:

```powershell
py -3.13 -m api.seed_synthetic_stock --dry-run --report imports/synthetic-stock-preview.json
py -3.13 -m api.seed_synthetic_stock --commit --report imports/synthetic-stock-result.json
py -3.13 -m unittest api.test_synthetic_stock
```

Default configuration: `api/synthetic_stock_config.json`. Optional overrides: `--config`, `--source-database`, and `--database`. Preview is the default; it does not create the target or change database contents. Reports are explicit output files, and protected input/database paths cannot be used as report destinations.

Commit creates the warehouse, synthetic catalog identities/fitments, balances, generation registry and opening movements in one data transaction. Zero-stock rows have no opening movement. Schema initialization can create empty tables before that transaction; stock data is committed together or rolled back together. Claims and approvals are never copied or changed.

Identical completed generations return `skipped`, preserving current balances after dispatch or adjustment. Changed configurations, changed source snapshots, incomplete saved generations, conflicting scenarios, or existing SKUs outside the generation fail explicitly. The first version conservatively rejects reuse of existing SKUs rather than guessing ownership.

Validation: four tests passed covering schema constraints/migrations plus deterministic preview, commit, unchanged source database, safe replay after balance changes and conflict rejection. No application/demo stock was inserted during implementation; tests used temporary databases.

Next: **Step 5 — run and inspect the preview report for the selected scope**. Later proposal sections predate implementation; use the commands above for the implemented generator.

## Implementation progress — Step 3 completed

Added database support in `api/schema.sql`, applied through the existing repeatable schema initialization in `api/database.py`:

- `synthetic_stock_generations` stores the unique generation ID, integer seed, configuration JSON/hash, source snapshot hash, warehouse and creation timestamp.
- `synthetic_stock_entries` stores each stock identity, initial quantity, initial reorder level, scenario and optional opening-movement reference.
- Foreign keys connect entries to their generation, warehouse/SKU balance and movement ledger. A generation's entries must use its warehouse.
- Unique warehouse/SKU ownership prevents a different generation from silently seeding the same balance again.
- Quantities must be nonnegative integers. Scenario constraints enforce fully stocked, positive low-stock and zero-stock conditions.
- Positive opening quantities require a movement reference; zero-stock entries require none. The upcoming generator must also verify that the referenced movement has the matching warehouse, SKU, quantity and synthetic-opening event type.

Initial quantities are provenance, not the current balance: dispatch and adjustments change `catalog_inventory`, while generation records retain the original values. Startup does not reset balances or label existing stock as synthetic.

Validation: six synthetic-schema/import tests passed, including existing-database initialization, repeated startup, unchanged current balances, duplicate rejection, invalid quantities and zero-stock support. No synthetic stock was inserted into the application database; tests used temporary databases. The schema additions will be applied on the next backend startup or `py -3.13 -m api.database`.

Next: **Step 4 — implement `api/seed_synthetic_stock.py` with dry-run and commit behavior**.

## Implementation progress — Step 2 completed

Added `api/synthetic_stock_config.json`, referencing the Step 1 scope. Paths are relative to the project root. Seed **42** and explicit scenario assignments make this small demonstration reproducible:

| Scope group | Part identities | Quantity per SKU | Reorder level |
| --- | --- | --- | --- |
| VITZ KSP130, 2015 — fully stocked | 4 | 8–12 | 4 |
| AQUA NHP10, 2013 — low stock | 4 | 1–2 | 3 |
| VITZ KSP130, 2020 — stockout | 2 | 0 | 2 |

The planned demo order requests **2 units per part**. The fully stocked group supports that request; low stock is below its reorder level and may fail reservation depending on the generated quantity; the stockout group always fails until replenished. Reorder levels are demo thresholds, not a demand forecast.

For the forthcoming generator, `sha256_identity_modulo_v1` means:

1. Normalize part/model by trimming and uppercasing; use an integer year.
2. Serialize `[42, part_name, model, make_year]` with Python `json.dumps(..., ensure_ascii=True, separators=(',', ':'))` and encode as UTF-8.
3. Convert its SHA-256 hex digest to an integer.
4. Calculate `min_quantity + digest_integer % (max_quantity - min_quantity + 1)`.

This derives each quantity independently of source row order. The scope assigns scenarios explicitly; the percentage bands discussed later are alternatives for larger datasets, not settings for this first version.

Configuration also requires synthetic SKU/name prefixes, unchanged-generation replay without top-ups, rejection of conflicting generations or unowned stock balances, and no automatic copying or approval of claims. The generator will enforce these policies in its implementation step; the configuration alone does not enforce them.

No database or stock balances were changed. Next: **Step 3 — database support for synthetic generations and stock-entry provenance**.

## Implementation progress — Step 1 completed

The initial demo scope is saved in `api/synthetic_stock_scope.json`, based on a read-only inspection of saved pending claims:

| Claim | Vehicle | Suggested part identities | Planned scenario |
| --- | --- | --- | --- |
| ACC-00000000003 | VITZ KSP130, 2015 | 4 | Fully stocked: demonstrate successful reservation and dispatch. |
| ACC-00000000005 | AQUA NHP10, 2013 | 4 | Low stock: demonstrate limited availability. |
| ACC-00000000006 | VITZ KSP130, 2020 | 2 | Stockout: demonstrate insufficient-stock rejection. |

This selects **10 distinct part/model/year identities**, one **Demo Warehouse**, and a separate target database, `api/demo_parts.db`. No catalog items existed at inspection, so subsequent steps must create explicitly synthetic SKUs. The scope file is a manifest, not an executable seeder configuration yet.

The selected claims have not been approved, copied, or modified. Stock generation will not automatically approve them. Their suggested parts are demo identity inputs, not proof of physical compatibility. Labels such as `DICKY DOOR` and `TAIL DOOR` remain distinct until an explicit catalog alias decision is made.

Step 2 will add the quantity configuration, fixed seed, reorder levels and exact shortage assignments. Neither the demo database nor stock balances have been created in Step 1.

For the underlying catalog identity, fitment, balance, reservation, receipt, and dispatch concepts, read [Part catalog and SKU stock explained](PART_CATALOG_AND_SKU_STOCK_EXPLAINED.md).

## Purpose and current status

Synthetic stock can make the demonstration useful for catalog selection, claim conversion, reservations, dispatch and shortage scenarios. It should look plausible for a demonstration and be clearly labeled as synthetic; it is not a measured inventory balance or a validated procurement recommendation.

This guide proposes the implementation. No stock has been generated or inserted by this documentation task.

## 1. Use catalog stock

The application stores two kinds of stock:

| Storage | Meaning | Use for this task |
| --- | --- | --- |
| `inventory` | Legacy part-name stock without verified SKU fitment | Avoid for new synthetic scenarios. |
| `catalog_inventory` | Stock for a catalog SKU at a warehouse | Use this so reservation and dispatch can work. |

Each generated stock line needs a warehouse, catalog SKU, canonical part label, explicitly recorded model/year fitment, integer quantity and reorder level.

Use an isolated demonstration database first. The current dashboard sums all warehouses, so putting synthetic stock in a separate warehouse in the live database still changes its totals.

## 2. Choose the source of part identities

Use existing catalog items where their fitments are verified. For a demonstration without a populated catalog, extract distinct combinations of:

```text
canonical suggested part + vehicle variant + manufacture year
```

from the imported claims and their prediction rows. Create clearly synthetic SKUs for these combinations. A model suggestion does not prove physical compatibility: mark these generated fitments as demo assumptions and do not use them for real procurement.

Do not merge different variants merely because they share a part label. Do not automatically assume compatibility across adjacent manufacture years. If a real SKU is known to fit several years, record those fitments explicitly.

Keep historical `Parts_Replaced` labels separate from model-generated suggestions. Choose one documented source for scenario weighting rather than mixing the two and counting an accident twice.

## 3. Give synthetic SKUs stable identities

Example display values:

```text
SKU: SYN-<stable hash of canonical part/model/year>
Name: [SYNTHETIC] FRONT BUMPER — AQUA NHP10 — 2013
Warehouse: Demo Warehouse
```

Use a deterministic hash such as SHA-256 with collision checking, not Python's process-dependent `hash()`. Persist the complete identity tuple. Rerunning generation must produce the same SKU for the same identity.

For the first version, create one demo SKU per exact identity tuple. Do not generate a fake Toyota OEM part number that could be mistaken for a real catalog reference.

## 4. Set reasonable demonstration quantities

The imported claims are historical records, not a measured sales rate. Model confidence is also not a stock quantity. Avoid calculating stock directly as `confidence × number of claims` or calling the result a demand forecast.

A simple, configurable starting policy is:

| Scenario band | How to select it | Initial stock range | Reorder level |
| --- | --- | --- | --- |
| Frequent | Top 20% of SKU identities by distinct source-claim occurrences | 12–30 units | 6 units |
| Regular | Next 30% | 5–15 units | 3 units |
| Occasional | Remaining identities | 1–6 units | 1 unit |

These ranges are illustrative demo settings, not Toyota inventory norms. Rank ties consistently by SKU. If there are fewer than five identities, assign bands explicitly so the result is understandable.

Count a claim at most once per identity. If using existing catalog SKUs with multiple fitments, aggregate the identity counts into the SKU before assigning stock; do not generate separate physical balances for every fitment of one SKU.

### Include deliberate test scenarios

Use mutually exclusive, deterministic groups, for example:

- 10% of SKUs: zero stock, to demonstrate shortages.
- 15%: stock below reorder level, to demonstrate low availability.
- Remaining SKUs: quantities from their band, at or above reorder level.

For a low-stock SKU with reorder level 1, zero is the only nonnegative below-threshold quantity; either place it in the stockout group or choose a different SKU for the low-stock group. Round scenario counts consistently for small catalogs.

The app currently supports full-order reservation from one warehouse. Ensure at least one chosen demonstration order has every required SKU stocked at the same warehouse. Include any companion parts you intend to add to that order.

## 5. Make generation reproducible

Suggested configuration file: `api/synthetic_stock_config.json`.

```json
{
  "dataset_namespace": "toyota-history-v1",
  "generation_id": "demo-stock-v1",
  "seed": 42,
  "warehouse": "Demo Warehouse",
  "stockout_fraction": 0.10,
  "low_stock_fraction": 0.15,
  "bands": {
    "frequent": {"min": 12, "max": 30, "reorder_level": 6},
    "regular": {"min": 5, "max": 15, "reorder_level": 3},
    "occasional": {"min": 1, "max": 6, "reorder_level": 1}
  }
}
```

Store the configuration hash and source snapshot hash in the generation manifest. Sort source identities before processing; ideally derive each SKU's random stream from the seed and its stable identity so unrelated new rows do not reshuffle all quantities.

Never silently overwrite a previously committed generation with changed configuration. Require a new generation ID and explicit additive-versus-new-database behavior.

## 6. Files to implement or update

| File | Proposed change |
| --- | --- |
| `api/seed_synthetic_stock.py` — new | CLI generator with dry run, commit, database selection and JSON/CSV report. |
| `api/synthetic_stock_config.json` — new | Quantity bands, scenario proportions, warehouse and random seed. |
| `api/schema.sql` | Add generation provenance and an idempotency registry; optionally catalog/warehouse synthetic flags. |
| `api/database.py` | Repeatable migrations for those fields/tables. |
| `api/catalog.py` | Reuse catalog validation and expose synthetic provenance if added. |
| `api/logistics.py` | Reuse movement-ledger semantics for synthetic opening stock. |
| `api/main.py` | Return synthetic labels in stock responses if stored as structured fields. |
| `src/CatalogManager.tsx` | Show synthetic catalog identities distinctly if they are displayed alongside real items. |
| `src/App.tsx` | Show stock and provenance in the active Demand Forecast view; add scenario badges only if needed. |
| `src/OperationalMetrics.tsx`, `api/metrics.py` | Add explicit synthetic/live scope if both share a database. |
| `api/test_synthetic_stock.py` — new | Test reproducibility, retries, stock balances and lifecycle behavior. |
| `.gitignore` | Exclude generated database backups and reports containing real source identifiers. |

`src/imports/DemandInventoryForecast-1/index.tsx` is not automatically the active application screen just because it is open in the editor. The current integration work uses `src/App.tsx`; confirm component imports before editing a generated design file.

## 7. Database design

Suggested additional records:

### `synthetic_stock_generations`

Store a unique generation ID, seed, configuration JSON/hash, source snapshot hash, creation timestamp and target warehouse.

### `synthetic_stock_entries`

Store generation ID, warehouse ID, catalog item ID, opening quantity, reorder level and scenario band. Use a unique constraint on `(generation_id, warehouse_id, catalog_item_id)`.

### Stock and ledger

For a new generation in an isolated demo database:

1. Create the generation record.
2. Create or validate the warehouse and catalog identities.
3. Insert opening catalog balances and reorder levels.
4. Record positive opening balances as `SYNTHETIC_OPENING` inventory movements with a stable operation key and a clear reason.
5. Record zero-stock entries in the generation registry and `catalog_inventory`; a zero opening balance does not need a fabricated stock movement.
6. Commit balances, provenance and movements in the same transaction.

Do not repeatedly call `POST /api/stock` as a retry mechanism: that endpoint adds quantities on every successful call and does not provide seed-generation idempotency. It also requires positive quantities, so it cannot create zero-stock scenarios by itself.

On a repeat of the same generation, validate the stored configuration and skip previously committed entries. Do not reset their balances: users may already have reserved or dispatched stock. A changed generation request must not silently top up existing stock.

## 8. Recommended implementation sequence

1. Back up the existing database and create a separate demo database target.
2. Read the chosen claim/catalog source without changing it.
3. Build and validate unique SKU identities; flag assumed fitments as synthetic.
4. Generate deterministic quantities and scenario assignments from configuration.
5. Dry-run a report showing SKU count, quantities, stockouts, low-stock entries, invalid identities and existing-generation conflicts.
6. Review the report, especially the chosen end-to-end demonstration order.
7. Commit catalog entries, warehouse stock, provenance and ledger events atomically.
8. Start the app against the demo database and inspect the resulting stock table.
9. Verify reservation, release, dispatch and delivery using the synthetic stock.
10. Repeat the same seed command and confirm that balances do not change.

The backend currently uses a module-level database path. A CLI `--database` option alone will not switch the running API. Add shared environment-based database-path configuration, or otherwise configure the backend explicitly, before expecting the browser to show a separate demo database.

## 9. Proposed commands

These commands describe the intended interface; the seeder does **not** exist yet.

```powershell
# Read identities from the current database, preview writes to an isolated target
py -3.13 -m api.seed_synthetic_stock --source-database api/toyota_parts.db --database api/demo_parts.db --config api/synthetic_stock_config.json --dry-run --report imports/synthetic-stock-preview.json

# Apply the reviewed generation to the demo target
py -3.13 -m api.seed_synthetic_stock --source-database api/toyota_parts.db --database api/demo_parts.db --config api/synthetic_stock_config.json --commit --report imports/synthetic-stock-result.json

# Run targeted verification
py -3.13 -m unittest api.test_synthetic_stock
```

Clarify whether the demo target should also receive copied claims. Seeding catalog stock into an empty target does not automatically copy the source claims, reviews or fulfillment orders.

## 10. Acceptance checks

| Test | Expected result |
| --- | --- |
| Same input and seed | Same SKU identities and initial planned quantities. |
| Dry run | No target database creation or mutation. |
| First commit | All planned valid entries and movements persist. |
| Repeat commit | No additional stock or duplicate movements. |
| Retry after dispatch | Dispatched balances remain unchanged. |
| Conflicting catalog identity | Report and reject; no guessed fitment merge. |
| Reserve quantity within availability | Reserved rises; on hand stays unchanged. |
| Reserve beyond availability | Whole reservation fails without partial changes. |
| Dispatch twice | Stock deducted once. |
| Confirm delivery | No further deduction. |
| Reconcile ledger | Opening entries plus later stock deltas match on-hand balances. |
| Mixed real and synthetic data | Provenance and metric scope remain visible. |

## Recommended first version

Use a single **Demo Warehouse**, a fixed seed, and a small catalog covering a few selected claims and their companions. Validate that workflow before scaling to every imported part/vehicle combination. The existing dataset and model outputs are enough for demonstration identities and weighting; real-world replenishment quantities would require actual consumption, supplier lead times and service targets.
