# Demand forecasting using the existing database

## Forecast demo stock added

The forecast-only demo now also contains stock in **Synthetic Forecast Warehouse**. Refresh http://localhost:8444/ and open Demand Forecast with **All Models / All Years** and an empty stock search.

| SKU | Opening stock | Reorder level | Scenario |
| --- | ---: | ---: | --- |
| DEMO-STEADY | 20 | 8 | Available |
| DEMO-VARIABLE | 3 | 6 | Low stock |
| DEMO-ZERO | 2 | 1 | Available |
| DEMO-GAP | 0 | 4 | Stockout |

These are hand-selected demonstration balances, not purchase recommendations. Total on hand/available is **25**, reserved is **0**, and the operational summary shows **one low-availability record and one stockout**. Vehicle fitments are unspecified; no compatibility was invented. Stock rows display SYNTHETIC rather than LIVE.

Added `api/seed_forecast_stock.py` for this existing demo database. It checks the forecast-demo marker and SKUs, previews by default, and atomically writes stock balances, three nonzero opening movements and four synthetic provenance entries with `--commit`. Repeat execution skips the existing generation and never tops up changed balances. Existing stock outside this generation causes a refusal.

```powershell
py -3.13 -m api.seed_forecast_stock
py -3.13 -m api.seed_forecast_stock --commit
```

Applied after a SQLite backup at `api/backups/before-forecast-stock-20260924T121600Z.db`. Original claims and stock-demo databases were verified unchanged. Five targeted tests passed, including API visibility, replay without top-up and rejection of unmarked databases. Verified all four stock rows and summary counts through the running frontend proxy. Forecast history and saved runs remain unchanged. TypeScript and production build passed; browser appearance remains a manual check.

## Implementation progress — Step 9 completed: isolated synthetic workflow validation

Created **`api/forecast_demo.db`**, separate from both the claims database and the synthetic-stock database. It contains four demonstration SKUs, 45 synthetic quantity events and 60 weekly coverage intervals spanning **2026-06-08 through 2026-09-21** (15 complete UTC weeks). The dates are simulated occurrence/recording times so historical forecast cutoffs can be tested; they are not real collection records. No claims, approvals or inventory balances were copied or generated.

### Open the running demo

Open **http://localhost:8444/** and go to **Demand Forecast → Saved demand forecasts**. Select saved **run #1 · SYNTHETIC**, then choose a chart SKU. Run #2 uses LIVE and intentionally has no usable history, confirming that synthetic observations are excluded from live forecasts. The page displays a synthetic-demand banner with the database name.

| SKU | Scenario | Expected weekly units | Four-week units |
| --- | --- | ---: | ---: |
| `DEMO-STEADY` | Four units each observed week | 4 | 16 |
| `DEMO-VARIABLE` | Repeating 1, 2, 3, 4, 2 units | 2.625 | 10.5 |
| `DEMO-ZERO` | Complete coverage with zero requests | 0 | 0 |
| `DEMO-GAP` | Final week lacks complete coverage | Unavailable | Unavailable |

The synthetic run is **PARTIAL**, with 3/4 SKUs ready and no aggregate total. Evaluation has 60 weekly samples; eight-week mean MAE is **0.2291667 units**, compared with **0.4 units** for the last-week baseline. These values describe this constructed demonstration only.

### Reproduce or restart

Added `api/seed_forecast_demo.py`. By default it previews without writing. `--commit` exclusively creates a new database, populates the four scenarios and saves synthetic/live example runs in one transaction. It refuses existing targets, including ordinary application databases; there is no overwrite/reset option. To generate history aligned with a later date, supply a fresh filename and configure a separate demo backend to use it. Saved runs in the current demo retain their original dates and values.

```powershell
# Preview only (use a new filename because forecast_demo.db now exists):
py -3.13 -m api.seed_forecast_demo --database api/forecast_demo_next.db
# Optional creation of that new demo:
py -3.13 -m api.seed_forecast_demo --database api/forecast_demo_next.db --commit

# Restart the existing demo backend, in one terminal:
.\api\start_forecast_demo.ps1
# Restart its frontend, in a second terminal:
.\start_forecast_demo_ui.ps1
```

The startup scripts use **8001** for the demo backend and **8444** for its frontend, leaving the normal app's ports/configuration alone. They restore the invoking shell's environment variables on exit. Stop each demo process with Ctrl+C. The standard startup scripts above always select `api/forecast_demo.db`, not the optional fresh filename.

### Verification results

- **16 tests passed**, including generator preview, refusal to overwrite, 15-week data counts, exact forecasts, true zeroes, unknown coverage, source isolation, saved-run replay, API retrieval and existing forecast/history tests.
- TypeScript and production build passed.
- Through the actual frontend proxy on port 8444, verified the demo environment, both saved runs, expected per-SKU estimates and a repeated POST returning the original run without adding a duplicate.
- SHA-256 comparisons before/after generation confirmed `api/toyota_parts.db` and `api/demo_parts.db` were unchanged.

Chart data, historical/forecast lengths and API values are verified. Visual rendering, clicking chart selectors and browser timeout interactions remain manual because browser automation is unavailable in this workspace. This validation does not establish forecast quality on real demand. Real deployment still needs actual dated SKU quantities and verified coverage.

## Implementation progress — Step 8 completed: forecast tab controls and chart

Added `src/ForecastRuns.tsx`, typed run/result contracts in `src/demand.ts`, and placed the new panel inside `src/DemandForecastDetails.tsx`. Saved forecasts load independently of the operational-summary request so a summary failure does not prevent access to saved runs.

### Using the tab

1. Start or restart the updated backend so the Step 7 tables and endpoints are available, then open **Demand Forecast**.
2. In **Saved demand forecasts**, select **Live**, **Historical quantities**, or **Synthetic demo**. Sources remain separate; synthetic results have a visible demonstration label.
3. Click **Generate and save forecast**. This saves the baseline and its historical evaluation, including an explicit unavailable result if no catalog or suitable history exists.
4. Choose a saved run from the latest 100 runs. Its source, save time, method version, readiness and four-week estimate are shown. **Refresh saved runs** reloads the list and selected result.
5. Select a SKU to view eight observed weeks followed by four forecast weeks. Observations are solid blue and forecasts are dashed red. Unknown weeks are gaps, not zero. **Weekly values** exposes exact values and full UTC dates in a table.
6. Compare the eight-week mean and last-week baseline MAE cards. The panel shows the evaluated date range, sample and window counts, and expandable observed/predicted/error rows. Missing evaluation displays **Unavailable**; a valid zero error displays **0**.

The SKU table includes complete training-week counts, readiness, weekly estimates and four-week estimates. Partial runs never show a complete aggregate total. Negative-history SKUs explain why their estimate is unavailable. Forecast windows include the week beginning at the saved origin. No uncertainty band is shown because none has been calculated.

### Loading and retry behavior

Run-list and detail reads have 30-second timeouts. Saving has a 60-second timeout. Each new save uses a unique request key; an unconfirmed save retains the exact source and key for **Retry saved request**. The pending request is also kept in session storage when available, surviving a reload in the same tab. Source selection is locked while that request is unresolved. The backend returns the original saved run on replay. Refreshing a list or selecting a run does not create a run. Missing endpoints, empty lists, failed requests, missing catalog, partial history and unavailable evaluation have distinct messages.

### Validation and remaining data requirements

TypeScript checking, the production build and all **15 forecast/API/history tests** passed. No application data was generated or changed during verification. Automated browser tooling is not installed in this workspace; visual and interaction checks remain manual:

- Generate a live run, refresh, and select it again; confirm the same saved result is displayed.
- Check an empty or insufficient-history run: no fake zero forecast or accuracy should appear.
- With verified history in a test database, select different SKUs and compare chart points with **Weekly values**.
- Simulate an interrupted save, then retry; confirm the same run is returned rather than a duplicate.
- Select a synthetic run and confirm its demonstration label remains visible even when the source for a new run is Live.

This completes the planned forecast UI step. Usable estimates still require catalog mappings, dated SKU quantities and verified collection coverage. The monthly training workbook alone does not provide these prerequisites. The next practical task is validating the complete flow with suitable quantity history in a separate test database before relying on forecasts operationally.

## Implementation progress — Step 7 completed: saved runs and evaluation

Added `api/forecast_runs.py`, the `forecast_runs` and `forecast_results` tables in `api/schema.sql`, and three endpoints in `api/demand.py`. Existing database initialization creates the new tables on backend startup. This step adds backend support; run controls and evaluation cards in the UI are Step 8.

| Endpoint | Purpose |
| --- | --- |
| `POST /api/demand-forecast-runs` | Calculate and atomically save the current baseline and its historical evaluation. |
| `GET /api/demand-forecast-runs?limit=20` | List the latest run metadata; limit is 1–100. |
| `GET /api/demand-forecast-runs/{id}` | Read the saved forecast and evaluation snapshot; missing IDs return 404. |

Example from PowerShell after starting the backend:

```powershell
$forecastRequestKey = [guid]::NewGuid().ToString()
$forecastBody = @{request_key=$forecastRequestKey; data_source='LIVE'} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:8000/api/demand-forecast-runs' -ContentType 'application/json' -Body $forecastBody
Invoke-RestMethod -Uri 'http://localhost:8000/api/demand-forecast-runs?limit=20'
```

Retry a timed-out request using the same body and request key: it returns the original saved result. Reusing that key with a different source returns 409. Use a new key to calculate a fresh run. Sources must be `LIVE`, `HISTORICAL` or `SYNTHETIC`; the default is `LIVE`. Each run evaluates only its selected source. Synthetic results are demonstration results, never live accuracy.

Runs store method version `eight-week-mean-v1`, source, calculation time, training/forecast dates, readiness, the full baseline snapshot and the evaluation snapshot. Per-SKU/per-week quantities and readiness are also saved in `forecast_results`. Evaluation samples are stored in the run's JSON rather than a separate evaluation table. Later history changes do not recalculate saved results. Failed inserts roll back the whole run. A run with no catalog or insufficient history is still saved with explicit readiness and null estimates.

Evaluation uses four rolling Monday origins, seven through four weeks before the current Monday. At each origin, training uses eight prior weeks and only demand/coverage recorded by that origin. All four subsequent weeks must have complete global coverage and nonnegative net actual demand before that SKU/window is scored. Actuals use records available at evaluation time. Missing windows are skipped, not filled with zero. Coverage must be trustworthy; the current coverage table is mutable, so editing old coverage can affect future backtests. Saved runs preserve their original snapshots.

Both the eight-week mean and a last-observed-week baseline are scored on identical eligible windows. `mae` and `last_week_mae` are mean absolute errors in **weekly units**, pooled across SKU/origin/horizon samples. The response includes sample count, evaluated and candidate SKU windows, date range and detailed observations/errors. Rolling windows overlap, so sample count is not a count of independent observations. Metrics are null when no window qualifies; verified zero-demand windows can legitimately yield zero error. No accuracy percentage or claim of model superiority is generated.

Validation: 15 tests cover the baseline, numeric holdout errors, exclusion of late training records, missing actual coverage, true zero error, saved-result replay, source conflicts, atomic rollback, API validation, schema/history behavior and existing demand summary. This step does not manufacture missing catalog or quantity history, and has not created a run in the application database.

Next: **Step 8 — add forecast run controls, saved results, evaluation details and the forecast chart to the Demand Forecast tab**, with loading, error and insufficient-history states.

## Implementation progress — Step 6 completed: weekly baseline

Added `api/forecasting.py` and connected it to the existing `GET /api/demand-summary` response under `forecast`. `src/DemandForecastDetails.tsx` now shows baseline availability, ready SKU counts and the forecast window instead of the old static placeholder.

For each catalog SKU, the baseline uses the eight completed Monday-to-Monday UTC weeks preceding the current week. Weekly net requested units include signed cancellations/corrections. The arithmetic mean is repeated for four weeks starting at the current Monday (the current week is included). Partial current-week demand is excluded from training. Fractional expected units are retained; these are not rounded purchase recommendations.

Only `LIVE` demand is used by the summary API. Synthetic and historical demand are excluded, and monthly replacement occurrences are never converted into quantities. The service can explicitly select another source for future evaluation. Events and coverage recorded after `as_of` are excluded; this is a current read-only preview, not a persisted or evaluated forecast.

Each training week requires explicit global `COMPLETE` coverage for the same SKU/source. Adjacent or overlapping complete intervals are combined; any overlapping `GAP` takes precedence. Warehouse-only coverage cannot prove global completeness. A covered week without events is zero; an uncovered week is unknown. No coverage rows are manufactured. Negative net weekly totals return `INVALID_HISTORY` for the SKU and no estimate, requiring investigation before use.

The response includes eight historical weeks and four forecast weeks per SKU. `NO_CATALOG`, `INSUFFICIENT_HISTORY`, `PARTIAL` and `READY` distinguish aggregate readiness. A total is returned only when every catalog SKU is ready, so a partial result cannot look like total demand. Ready SKU estimates remain available in `forecast.sku_rows` when other SKUs lack history.

Validation: seven baseline tests and five existing demand-summary/history/import tests passed, along with TypeScript checking and the production build. Tests cover mean calculations, verified zeroes, gaps, source/time exclusions, warehouse coverage, negative net weeks, partial catalogs and empty catalogs. Visual browser verification remains manual.

To use the updated API, start or restart the existing backend with its usual database configuration. No database migration or new trained model is needed for this step. The imported workbook alone still cannot produce a unit forecast: verified dated SKU quantities and eight weeks of complete collection coverage are required.

Next: **Step 7 — evaluate the baseline with time-based holdouts and persist forecast runs/results**, keeping unavailable accuracy metrics empty when there is insufficient evaluation history.

## Implementation progress — Step 5 completed: monthly occurrence history

Inspected the provided workbook: it has month-level dates and historical replaced-part labels, but no per-part quantities. Implemented `api/import_demand_history.py` for this available data rather than inventing dated unit demand. CSV and XLSX inputs are supported; monthly dates accept `YYYY-MM` or `MON YYYY`.

Added `historical_demand_records` (dataset/accident identity, vehicle, month, input/file hashes) and `historical_part_occurrences` (one distinct label per accident). These tables are separate from claims, predictions and quantity-based `demand_events`. Original labels are not filtered to the model vocabulary or converted to guessed SKUs.

Preview found **1,000 valid records and 2,057 distinct part occurrences**, with no invalid rows or conflicts. After a SQLite backup, these were imported into `api/toyota_parts.db` under `toyota-history-v1`. Months span June 2024 through March 2026. Repeating the import skips unchanged accidents; changed source rows are conflicts, not overwrites.

```powershell
py -3.13 -m api.import_demand_history --file imports/accident_data_real.xlsx --dataset toyota-history-v1 --dry-run --report imports/demand-history-preview.json
py -3.13 -m api.import_demand_history --file imports/accident_data_real.xlsx --dataset toyota-history-v1 --database api/toyota_parts.db --commit --report imports/demand-history-result.json
py -3.13 -m unittest api.test_import_demand_history api.test_demand_history
```

Four tests passed for validation, duplicate-label deduplication, read-only preview, repeat import, conflicting changes and separation from operational demand. No daily dates, unit quantities, human approvals or complete observation coverage were invented. Collection coverage remains unknown; the dataset may be sampled. Historical occurrence trends are available in storage, but displaying them in the UI is not part of this import step.

A true unit forecast still needs verified dated SKU quantities and observation coverage. The next step can implement a baseline with explicit insufficient-history behavior; this workbook alone does not satisfy that prerequisite. Quantity-history import is deferred until a suitable source is provided.

## Implementation progress — Step 4 completed

Added `api/demand_service.py`. Catalog-backed manual fulfillment lines, reviewed claim conversions and companion additions now record one `REQUESTED` demand event in the same transaction as the new line. A failed order or companion operation rolls back its demand events too.

The stable key `fulfillment-line:<id>:requested` prevents duplicate events on replay. Reservation, release, dispatch and delivery never create extra requested demand. Human approval alone still counts as a part occurrence, not a requested quantity.

Unmapped lines do not generate a SKU event. Mapping such a line later records its quantity using the original order creation time as `occurred_at` and the current ingestion timestamp as `recorded_at`. New companion additions use their actual creation time.

Claim-derived orders from `TRAINING_DATASET` are classified `HISTORICAL`. If the database contains a synthetic-stock generation, new events are conservatively classified `SYNTHETIC`, including otherwise-live orders. This whole-database policy prevents mixed demo data from entering a LIVE series; finer source classification remains future work. Warehouse stays unknown until allocation; reservations do not rewrite the original request event.

Orders referenced by demand history cannot be deleted through the normal API; it returns HTTP 409 rather than a foreign-key error. A cancellation/correction workflow is not implemented in this step. Existing orders are not automatically backfilled, and complete observation coverage is not assumed.

Next: **Step 5 — import and validate dated historical demand quantities, keeping month-only replacement occurrences separate where quantities are unavailable**.

Step 4 validation: **22 tests passed** covering API lifecycle, transactional rollback, replay, historical/synthetic classification, demand-history constraints, operational summaries and demo stock workflow. The backend was restarted against the original claims database to enable capture for subsequent actions.

## Implementation progress — Step 3 completed

Added `demand_events` and `demand_coverage` in `api/schema.sql`. Existing schema initialization in `api/database.py` creates them on startup without changing existing claims, stock or review decisions.

`demand_events` records SKU, optional warehouse/fulfillment-line reference, source category, source reference, unique event key, signed integer quantity, UTC business timestamp and ingestion timestamp. Requests are positive; cancellations are negative; corrections reference an earlier event and require a reason. Update/delete triggers protect the event history. Future capture code must validate that a correction refers to the correct SKU/source and does not over-cancel a request; the table constraints alone do not enforce cumulative business rules.

`demand_coverage` records explicit complete or gap intervals by SKU/source and optional warehouse. Intervals are half-open (`starts_at` inclusive, `ends_at` exclusive) in UTC with seconds precision. Unique coverage keys prevent duplicate ingestion. No coverage is inferred from the presence or absence of events. Overlap resolution, source completeness verification and coverage corrections belong to the future history-ingestion/aggregation service; these tables alone do not declare history sufficient for forecasting.

No historical demand was fabricated or backfilled. No demand events are captured automatically yet. Existing line references are retained by foreign keys; future deletion/cancellation behavior must preserve referenced lines once event capture is enabled.

Validation: **7 tests passed** across demand-history constraints, repeatable startup, demand summary and synthetic-stock schema/generation. Apply to a configured database by restarting the backend or running `py -3.13 -m api.database` in the same database environment.

Next: **Step 4 — record actual requested quantities transactionally when fulfillment lines are created, without counting reservation or dispatch as new demand**.

## Implementation progress — Step 2 completed

Added typed contracts in `src/demand.ts` and `src/DemandForecastDetails.tsx`, integrated into the Demand Forecast view in `src/App.tsx` in place of the earlier generic operational cards. Existing claim-review tabs and stock controls remain available.

The section displays pending claims, approved part occurrences, pending catalog quantities, unreserved demand, on-hand/reserved/available stock, stockouts and low availability. It separately reports unmapped demand and legacy stock. A searchable SKU table compares quantities and explicitly labels pooled shortages and synthetic-stock involvement.

Loading, API failure/timeout with retry, empty catalog and no search matches are distinct states. Data refreshes every 15 seconds, on focus and through Refresh demand. Failed loads do not display fabricated zeroes. Future forecasting is explicitly marked unavailable rather than presenting current balances as predictions.

Validation: TypeScript, production build and the demand-summary API test passed. Browser visual checks remain manual. Next: **Step 3 — demand-event and history-coverage database tables**.

## Implementation progress — Step 1 completed

Added `api/demand.py` and registered **`GET /api/demand-summary`** in `api/main.py`. Backend restart loads the new endpoint.

The endpoint returns pending claim counts, approved part occurrences, catalog-backed pending units, unreserved pending units, unmapped demand, on-hand/reserved/available stock, legacy stock, stockout and low-availability counts, SKU summaries and warehouse/SKU balances. It reads a consistent database snapshot and does not change any records.

Scope is explicitly all warehouses and all data sources in the active database, including historical/synthetic records. Counts are current-state operational statistics; approved occurrences are cumulative saved approvals. No date/source/warehouse filters are implemented in this first step. No future forecast is fabricated: the forecast field reports `NOT_IMPLEMENTED` with null units.

Unreserved demand has no assigned warehouse, so shortage comparison is pooled across warehouses and cannot guarantee fulfillment from a single warehouse. Stockout counts cover existing warehouse/SKU balance records; catalog items with no stock record still appear with zero availability in the SKU summary.

Validation: `py -3.13 -m unittest api.test_demand` passed, covering empty data, mixed mapped/unmapped demand, partial reservation, multiple warehouses, and exclusion of in-transit quantities from pending demand. Separate aggregation avoids multiplying counts when stock and order lines have multiple rows.

Next: **Step 2 — display these operational statistics and the SKU table in Demand Forecast, with loading, empty and error states**. Later sections remain the implementation roadmap.

## 1. Do you need another model?

**You do not need a new machine-learning model to display current demand-related statistics.** SQL queries can show pending claims, approved part occurrences, outstanding fulfillment quantities, stock, reservations and shortages.

**To estimate future quantities, you need a forecasting method and suitable dated history.** The first version can use a simple historical-average baseline implemented in Python. It does not require a new `.joblib` artifact or a Colab training run. A more complex model should be introduced only if evaluation shows an improvement.

Your current damage classifier answers: “Which parts might be damaged for this vehicle and impact zone?” It does not answer: “How many units of this SKU will be requested next month?” Association-rule confidence also does not represent a future demand quantity.

This document proposes implementation steps. It does not change application code or generate forecasts.

## 2. What the existing database can provide

| Existing records | Useful information | Limitation |
| --- | --- | --- |
| `claims` | Vehicle, zone, review status, source and dates | Import time is not the historical accident date. |
| `claim_predictions` | Suggested part labels, scores and human decisions | No requested quantity or unique SKU identity. |
| `fulfillment_orders`, `fulfillment_order_lines` | Requested quantities, SKU links and order status | Legacy lines can be unmapped; destination warehouse is not always assigned before reservation. |
| `catalog_items`, `catalog_fitments` | SKU identity and exact model/year compatibility | Synthetic fitments are demo assumptions. |
| `catalog_inventory` | On-hand stock and reorder thresholds per warehouse/SKU | A current balance is not a time series of demand. |
| `stock_reservations` | Stock allocated to pending fulfillment | Reservations are commitments, not additional demand events. |
| `inventory_movements` | Dated dispatch, receipt and adjustment changes | Only dispatch represents fulfilled consumption; receipts and opening stock do not represent demand. |
| `purchase_orders`, `purchase_order_lines` | Incoming orders and quantities | No reliable expected-arrival date or destination warehouse is currently recorded for planning. |
| `training_import_records` | Original dataset identity and historical labels | Stored replacement labels are separate from actual model suggestions. |

Use these sources to implement a useful operational dashboard immediately. Present approved predictions as **part occurrences**, not units: approving one part suggestion does not establish that two units are needed.

### The imported workbook

The inspected workbook has a `Month` field and historical `Parts_Replaced` labels, but no exact accident date. The importer currently preserves the normalized historical part text, not the month column, and imported `accident_date` values remain unknown.

To use that workbook for historical trends:

1. Re-read the original workbook and validate its Month values.
2. Preserve month separately as a monthly period, such as `2025-02`; do not invent an accident day.
3. Map replacement labels to verified SKUs only where there is an unambiguous mapping.
4. Establish whether quantities exist. A list of replaced parts supports occurrence counts, not necessarily consumed unit counts.
5. Inspect the actual date range, missing periods and whether the dataset represents complete activity or a sampled training set.

Without verified quantities and coverage, show **historical replacement occurrences by month**. Do not describe that chart as a unit-demand forecast.

## 3. Choose what you want to forecast

Recommended first target for this application:

> Weekly requested units per SKU, across all workshops, forecasting the next four weeks.

Start with a global SKU forecast because workshop fulfillment orders may not yet have a destination warehouse. Add warehouse-specific forecasts only when warehouse assignment is reliably captured for each demand event.

Possible alternative: forecast dispatched units from the movement ledger. Label this **fulfilled consumption forecast**. During stockouts, dispatched quantities can understate customer demand.

Do not sum requested units and dispatched units into one series: they are stages of the same requirement and would double count it.

## 4. Additional data to collect

Minimum demand-history record:

| Field | Example | Purpose |
| --- | --- | --- |
| `event_key` | `fulfillment-line:123:created` | Stable identity for duplicate prevention. |
| `catalog_item_id` | `17` | Identifies the actual SKU. |
| `occurred_at` | `2026-09-23T10:00:00Z` | Business event time, separate from import time. |
| `quantity_delta` | `2` | New requested units; later cancellations/corrections may be negative events. |
| `event_type` | `REQUESTED` | Distinguishes requests, cancellations and corrections. |
| `source_line_id` | `123` | Links to fulfillment provenance. |
| `warehouse_id` | nullable | Populate only when known. |
| `data_source` | `LIVE` | Separates real, imported and synthetic history. |
| `recorded_at` | ingestion timestamp | Supports auditing and late-arriving events. |

Also record observation coverage: when reliable collection starts, gaps, SKU activation dates and known stockouts. A missing week is zero demand only when that week was actually observed and recorded completely.

For replenishment planning, also collect supplier lead time, purchase destination warehouse, expected arrival dates and received/cancelled quantities. These are not necessary for basic forecasting but are necessary for credible incoming-stock and order recommendations.

## 5. Statistics to display now

Add an **Operational demand** section in the Demand Forecast tab. No new forecast model is required for these values.

| Card | Definition | Display unit |
| --- | --- | --- |
| Pending claims | Claims with status PENDING | Claims |
| Approved part predictions | Prediction rows with human action APPROVED | Part occurrences |
| Pending fulfillment demand | Sum of catalog-backed quantities in PENDING fulfillment orders | Units |
| Unreserved pending demand | Pending line quantity minus its reservation quantity | Units |
| Catalog on hand | Sum of catalog inventory | Units |
| Reserved | Sum of active reservations | Units |
| Available | On hand minus reserved | Units |
| Stockouts | Warehouse/SKU records with available quantity zero | Stock records |
| Low availability | Records with positive available quantity below a configured positive reorder level | Stock records |
| Recent dispatched units | Sum of negative DISPATCH stock deltas, converted to positive units, in the selected period | Units |

Count unmapped fulfillment separately as **Unmapped demand**. Do not guess a SKU from a part label or subtract it from an arbitrary compatible SKU's balance.

The current reorder threshold is manually configured. Label comparisons as **below configured reorder level**, not as ML-generated alerts.

## 6. Forecast statistics to add after history exists

| Card/field | Meaning |
| --- | --- |
| Forecast units — next 4 weeks | Sum of eligible SKU forecasts for the stated horizon. |
| Forecast coverage | Eligible SKUs / SKUs considered, plus units excluded from unmapped data. |
| History window | Exact complete weeks used. |
| Method | For example, `8-week mean baseline v1`. |
| Generated at / data through | Run timestamp and final included observation period. |
| Backtest MAE | Average absolute error in units for completed evaluation windows. |
| Forecast status | Ready, insufficient history, missing data, stale, or failed. |

Avoid a generic “forecast accuracy 95%” card. Report a named error metric and evaluation period. Show unavailable values as unavailable, not zero.

When only some SKUs qualify, label the total **forecast for eligible SKUs**. An empty set of eligible SKUs must display “Insufficient history,” not “0 expected demand.”

## 7. First forecasting method

Use an eight-complete-week average as an initial, explicitly labeled baseline:

```text
weekly forecast = sum(requested units in 8 complete observed weeks) / 8
next 4 weeks forecast = weekly forecast × 4
```

Example: weekly quantities `2, 0, 4, 2, 3, 1, 2, 2` total 16 units. The baseline predicts 2 units per week, or 8 over the next four weeks.

Eight weeks and four forecast weeks are proposed configuration choices, not universal sufficiency requirements. They do not support a claim of annual seasonality. Use only completed periods, exclude synthetic data from operational forecasts, and keep the floating-point forecast until converting a final procurement recommendation into whole units.

Compare this method with a last-observed-week baseline using rolling time-based evaluation. Each test must use only information available before its forecast origin. Evaluate at the intended horizon; do not randomly mix past and future rows. See [Forecasting: Principles and Practice — Time series cross-validation](https://otexts.com/fpp3/tscv.html).

If evaluated alternatives later perform better, replace or extend the baseline. The API contract and dashboard should remain independent of the particular model implementation.

## 8. Replenishment calculations: avoid double counting

For known pending orders alone:

```text
unreserved pending units = pending order units − reserved pending units
unallocated shortage = max(0, unreserved pending units − available stock)
```

This assumes SKU-compatible inventory is usable for the selected scope. A global sum cannot guarantee fulfillment from one warehouse; the existing application reserves entire orders at a single warehouse. Warehouse-level shortages require warehouse assignment or an explicit allocation policy.

Future forecasts need a separate policy for commitments. A forecast of total demand in a period may already include the demand represented by known orders. Do not blindly add every pending order to that forecast.

An optional later planning rule, only after defining **incremental demand not already booked**, is:

```text
suggested replenishment = ceil(max(0,
    unreserved commitments
    + forecast incremental demand during the planning window
    + configured safety stock
    − available stock
    − eligible incoming units))
```

Incoming units must be for the same warehouse/SKU and expected within the planning window. Until that information exists, show incoming availability as unknown and do not present this formula as a reliable purchasing instruction. Safety stock must be labeled as configured unless it has been estimated and evaluated.

## 9. Database additions

Keep the existing database and add tables through repeatable migrations:

| Proposed table | Purpose |
| --- | --- |
| `demand_events` | Immutable requested/cancelled/corrected quantity events with unique event keys. |
| `demand_coverage` | Data source, SKU/scope and known observation start/end or gaps. |
| `forecast_runs` | Method/version, parameters, training cutoff, horizon, source scope and completion status. |
| `forecast_values` | Run ID, SKU, optional warehouse, forecast period and nonnegative predicted units. |
| `forecast_evaluations` | Forecast origin, horizon, observed value and error; excludes unavailable actuals. |
| Optional `historical_part_occurrences` | Workbook month and historical labels when unit quantities/SKUs are unavailable. |

Do not insert historical replacement labels into the live prediction table or set invented human approvals. Keep existing review and claim-conversion behavior unchanged.

Create demand events atomically when a new fulfillment line is committed, including companion additions. Record later changes as explicit corrections. Backfills must use stable line identities and must not count the same request again when it is reserved, dispatched or delivered. Records deleted before event tracking began cannot be reconstructed without another source.

For monthly workbook history, retain monthly precision. Do not spread monthly totals over fabricated daily timestamps merely to feed a weekly model.

## 10. Proposed API and tab layout

Keep `/api/metrics` for existing all-time operational cards. Add endpoints whose filters and units are explicit:

```text
GET /api/demand-summary?source=LIVE&date_from=...&date_to=...
GET /api/demand-history?sku=...&frequency=week&source=LIVE
GET /api/demand-forecasts?horizon_weeks=4&source=LIVE
POST /api/demand-forecasts/run
```

These endpoints do not exist yet. Restrict forecast-run mutations appropriately when authentication is implemented. Ordinary dashboard reads should retrieve persisted runs rather than train or recalculate a model repeatedly.

Recommended tab organization:

1. **Scope controls:** data source, warehouse when supported, date range and forecast horizon.
2. **Operational cards:** pending claims, approved occurrences, unreserved demand, available stock and stockouts.
3. **Forecast cards:** eligible-SKU forecast, history coverage, method and evaluation error.
4. **History/forecast chart:** observed demand as a solid line, future forecast as a separate dashed line. Draw an uncertainty band only when calculated by a documented method.
5. **SKU table:** SKU, fitment, on hand, reserved, available, pending units, recent demand, forecast, data status and stock status.
6. **Existing review tabs:** Pending Claims, Approved Part Predictions and Rejected Claims.

Use separate columns for **stock status** and **forecast readiness**. A part can be out of stock while also having insufficient history to forecast.

## 11. Required UI states

| Condition | Display |
| --- | --- |
| Request loading | Loading indicator/skeleton. |
| No saved claims or stock | Empty-state explanation for the active database. |
| No usable demand history | “No demand history recorded yet.” |
| Too few complete periods | “Insufficient history — X of 8 complete weeks.” |
| Collection gaps | “Incomplete history”; do not fill unknown periods with zero. |
| Historical labels without quantity | “Occurrence history only — unit forecast unavailable.” |
| Synthetic source selected | Persistent demonstration label; exclude it from live evaluation. |
| Missing warehouse mapping | Show global scope or “Warehouse not assigned.” |
| Valid forecast of zero | Show 0 with method and covered history. |
| Forecast stale | Show last run time and stale badge; offer refresh where authorized. |
| API failure | Show retry action; do not substitute fabricated numbers. |

## 12. Files to implement

| File | Work |
| --- | --- |
| `api/schema.sql`, `api/database.py` | Demand-event, coverage and forecast migrations. |
| `api/demand_service.py` — new | Aggregation, completeness checks and baseline calculation. |
| `api/demand.py` — new | Summary/history/forecast endpoints. |
| `api/main.py` | Register router and capture manually created fulfillment demand. |
| `api/catalog.py` | Capture demand from claim-to-order conversion in its transaction. |
| `api/logistics.py` | Capture companion-line additions without counting reservations/dispatch as new requests. |
| `api/import_demand_history.py` — new | Validated, idempotent history import and monthly occurrence import. |
| `src/demand.ts` — new | Typed statistics, forecast and readiness contracts. |
| `src/DemandForecastDetails.tsx` — new | Cards, history/forecast chart, filters, SKU table and empty/error states. |
| `src/App.tsx` | Integrate the new section into the active Demand Forecast view. |
| `api/test_demand_forecasting.py` — new | Counts, deduplication, period boundaries, missing history and forecast tests. |

This work does not require replacing the existing damage model or altering its fitted features.

## 13. Implementation order

1. Build current operational demand statistics from existing tables.
2. Add the dashboard layout and honest empty/insufficient-history states.
3. Add demand-event and coverage tables and transactional event capture.
4. Import verified dated quantity history, or preserve workbook occurrences as a separate monthly dataset.
5. Aggregate complete weekly observations by SKU and source.
6. Implement and backtest the simple baseline; publish only eligible results.
7. Persist forecast runs and expose the forecast API.
8. Connect charts and SKU forecast columns; keep scope and units visible.
9. Add lead-time/incoming-order data before producing replenishment recommendations.
10. Consider a more complex model only after comparison against the baseline.

## 14. Acceptance tests

- A newly approved part increases the approved-occurrence count but does not create requested units.
- Creating a fulfillment line records its quantity once; reservation and dispatch do not duplicate demand.
- Imported historical and synthetic data do not appear in a LIVE forecast.
- A missing observation period is not silently interpreted as zero.
- No-history and insufficient-history responses contain unavailable forecasts, not invented zeroes.
- The eight-week example produces 2 units/week and 8 units/four weeks.
- Backtests never read events or revisions recorded after their forecast origin.
- Forecast and operational cards use the same declared source/warehouse scope where applicable.
- Repeated import/backfill jobs do not duplicate history.
- API failure, empty database, valid zero forecasts and stale forecasts render distinctly.

## Recommended next step

Implement the **operational demand summary and its UI states first**. Your existing database supports that without another model. Then inspect and collect dated quantity history before adding a future-demand baseline. Combining claims and synthetic balances in one database makes a demo more complete, but does not itself create forecasting history.
