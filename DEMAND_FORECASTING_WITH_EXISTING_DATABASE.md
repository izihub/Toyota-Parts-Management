# Demand forecasting using the existing database

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
