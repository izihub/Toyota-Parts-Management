# Data for the Demand Forecast tab

## Why some data is missing

The application currently has two separate SQLite databases:

| Database | Data |
| --- | --- |
| `api/toyota_parts.db` | Imported historical claims, newly submitted claims and human review decisions. |
| `api/demo_parts.db` | Synthetic catalog entries and stock: initially 10 SKUs and 44 units. Claims were deliberately not copied here. |

The backend connects to one database at a time through `TOYOTA_DATABASE_PATH`. It currently uses the original claims database. Stock in the other database cannot appear in its stock table.

The tab uses API data, not an Excel file directly:

- `/api/claims?status=ALL`: pending claims, approved part predictions and rejected claims.
- `/api/stock`: warehouse stock, fitments, reservations and available quantities.
- `/api/metrics`: saved claim, stock and fulfillment counts.

An empty stock table does not mean the claims dataset was lost.

## Recommended implementation: a combined demo database

Create **`api/combined_demo.db`** containing a copy of the original claims database, then add the synthetic stock to that copy. Preserve both original databases.

```text
toyota_parts.db ── SQLite backup copy ──> combined_demo.db
                                               ↑
synthetic scope + configuration ── generator ────┘
                                               ↓
                                 FastAPI → Demand Forecast tab
```

This is a demonstration environment. Synthetic quantities and generated fitments must remain clearly labeled.

## Step 1 — Inspect and back up

1. Check `/api/environment` to confirm the active database.
2. Back up the original claims database with SQLite's backup API.
3. Check whether `api/combined_demo.db` already exists. If it does, inspect it rather than overwriting it; it may contain new reviews or orders.
4. Inspect the existing synthetic scope and configuration:
   - `api/synthetic_stock_scope.json`
   - `api/synthetic_stock_config.json`

The current scope covers three claims and ten exact part/model/year identities. It does not supply stock for every imported claim.

## Step 2 — Create the combined database

Use SQLite's backup API to copy `api/toyota_parts.db` to a **new** `api/combined_demo.db`. A consistent database backup is preferable to copying a database file while it may be receiving writes.

Copying the complete database preserves:

- Accident IDs and original dataset identifiers.
- Predictions, scores, thresholds and model provenance.
- Human review decisions and claim statuses.
- Import batches and historical source records.
- Existing catalog, orders, stock and links, if present.

Do not recreate claims by submitting every record to the prediction endpoint. That would generate new claims instead of preserving the existing records and decisions.

Do not overwrite the copy on every startup. After the app begins using it, its changes are independent of the original database; there is no automatic synchronization between the two.

## Step 3 — Preview synthetic stock against the combined target

After creating the copy, run the existing generator from the project root:

```powershell
py -3.13 -m api.seed_synthetic_stock --source-database api/toyota_parts.db --database api/combined_demo.db --dry-run --report imports/synthetic-stock-combined-preview.json
```

Verify:

- The target is `combined_demo.db`, not the source database.
- Selected claims still match the configured vehicle details and suggested parts.
- Synthetic SKU identities do not conflict with existing catalog entries.
- The planned total is consistent with the configuration—currently 44 units across 10 SKUs.
- The preview reports `ready`, or `skipped` for an identical generation already present.

Do not bypass a conflict by deleting existing catalog or stock records. Review the scope or generation configuration first.

## Step 4 — Commit synthetic stock

Once the preview is valid:

```powershell
py -3.13 -m api.seed_synthetic_stock --source-database api/toyota_parts.db --database api/combined_demo.db --commit --report imports/synthetic-stock-combined-result.json
```

The generator adds catalog identities, fitments, warehouse balances, opening movements and generation provenance. It does not approve, copy or modify claims—the claims are already present because of Step 2.

Repeated identical commits return `skipped`. They do not restore stock already consumed by dispatch or adjustments.

The generator initializes missing tables but does not run every application migration. Backend startup applies the normal migrations when the combined database is opened.

## Step 5 — Connect the backend

Stop the backend currently listening on port 8000 before starting another instance. In PowerShell, from the project root:

```powershell
$env:TOYOTA_DATABASE_PATH = 'api/combined_demo.db'
py -3.13 -m uvicorn api.main:app --host 127.0.0.1 --port 8000
```

Confirm that `combined_demo.db` exists before starting: a mistyped path can initialize an empty database.

Refresh the browser after switching. The existing frontend API proxy continues to use port 8000. `/api/environment` should identify `combined_demo.db` and report synthetic stock. The dashboard should display its synthetic-stock banner.

Do not use `api/start_demo.ps1` for this target without changing that launcher: it currently selects `api/demo_parts.db`.

To return to the original database, stop the combined-demo backend and start:

```powershell
$env:TOYOTA_DATABASE_PATH = 'api/toyota_parts.db'
py -3.13 -m uvicorn api.main:app --host 127.0.0.1 --port 8000
```

## Step 6 — Verify the tab

| Area | Expected result |
| --- | --- |
| Pending claims | The pending claims copied from the original database. |
| Approved part predictions | Parts with saved `APPROVED` human decisions. |
| Rejected claims | Claims with completed rejected status. |
| Stock table | Existing copied stock, if any, plus the seeded synthetic SKUs. |
| Available units | Catalog on-hand stock minus reservations. |
| Catalog fitments | Exact model/year combinations recorded for each SKU. |
| Synthetic labels | Visible for seeded inventory. |
| Movement history | Synthetic opening events and subsequent operations. |

Check counts against the source snapshot rather than a permanently hardcoded number. Users may have created or reviewed claims since earlier imports.

Test one approval in the combined database: it should disappear from pending work as appropriate and appear in approved predictions. The original database should retain its previous decisions because these are separate environments.

Verify foreign keys, stock-to-ledger totals and a repeated seed command. Perform destructive or stock-consuming acceptance tests on a temporary copy if you want to preserve the demonstration's opening balances.

## Files involved

| File | Role or proposed work |
| --- | --- |
| `api/combined_demo.db` | New combined copy; not created by this documentation task. |
| `api/database.py` | Existing database-path configuration and startup migrations. |
| `api/seed_synthetic_stock.py` | Existing preview/commit generator; use target override. |
| `api/synthetic_stock_scope.json` | Existing selected claims and part identities. Expand only when a larger demo is wanted. |
| `api/synthetic_stock_config.json` | Existing quantity and generation policies. |
| `api/start_combined_demo.ps1` | Optional new launcher that checks the target exists and sets its path. Not implemented yet. |
| `src/DatabaseBanner.tsx` | Existing active-database/synthetic-stock notice. |
| `src/ApprovedPredictions.tsx` | Existing claim-status tabs. |
| `src/App.tsx` | Active stock and prediction views. |
| `src/OperationalMetrics.tsx`, `api/metrics.py` | Existing operational metrics. |

No new ML training is necessary to combine the existing records and stock. Editing the generated design file `src/imports/DemandInventoryForecast-1/index.tsx` is not required unless the active application is changed to use that component.

## Showing data is different from forecasting future demand

The current model predicts which parts may be damaged for a vehicle and impact zone. Association rules suggest companion parts. The dashboard summarizes saved records and inventory.

These features do not estimate how many units will be needed next week or next month.

For a true time-based demand forecast, collect:

| Data | Why it matters |
| --- | --- |
| SKU and verified fitment | Defines the item being forecast. |
| Order/request date and quantity | Measures demand over time, including requests that could not be supplied. |
| Dispatch/consumption date and quantity | Measures fulfilled usage; this can understate demand during stockouts. |
| Returns and cancellations | Allows gross requests and net demand to be distinguished. |
| Stockout periods | Identifies periods when zero sales did not mean zero demand. |
| Warehouse | Supports location-specific forecasts. |
| Supplier lead time | Converts forecasts into replenishment planning. |

Choose a forecast horizon and aggregation level, such as weekly demand per SKU. Preserve a time-ordered holdout period, compare simple baselines with candidate models, and report forecast uncertainty and errors. Synthetic stock balances are unsuitable as training targets for real demand forecasting.

Possible later implementation files include a dated demand-history table, an ingestion job, a separate forecasting service/model, and a forecast endpoint. Those are a separate project from combining the current demo data.

## Next action

Create and verify the combined database, preview synthetic stock against it, then commit and switch the backend. **This document does not create the database, seed stock or change the running application.**
