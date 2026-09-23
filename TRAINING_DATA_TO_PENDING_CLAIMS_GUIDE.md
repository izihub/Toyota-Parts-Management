# Show training-dataset claims in Pending Claims

## Completed dataset import — 2026-09-23

Imported `imports/accident_data_real.xlsx` using dataset namespace `toyota-history-v1`, after a dry run and a SQLite backup.

- Source records: **1,000**; duplicate accident IDs: **0**.
- Created: **748 claims**, all `PENDING`.
- Generated: **2,568 prediction rows**, all with `human_action = NULL` at verification.
- Skipped as invalid: **252 rows** — 169 unsupported impact zones and 83 unsupported vehicle variants among the remaining rows.
- Every imported claim retains its original accident ID and batch reference. Historical replaced parts remain in source JSON, separate from model predictions.
- No exact accident dates were supplied; historical dates remain null. The workbook's month field was not converted into an invented accident date.
- Foreign-key validation found no violations.

Reports: `imports/claims-dry-run.json` and `imports/claims-import-report.json`. Backup: `api/backups/before-training-import-20260923-130148.db`.

The importer exited with code 1 because invalid records were reported; the 748 valid records were committed successfully. Existing dashboard metrics include these historical imports. Later proposal sections describe planned behavior and may predate this completed import.

## Importer now available

### Database provenance implemented

Fresh databases and startup migrations now support:

- `claims.source_type`: `LIVE` by default, or `TRAINING_DATASET` for imports.
- `claims.dataset_source`: the dataset namespace supplied with `--dataset`.
- `claims.source_claim_id`: the original accident identifier.
- `claims.accident_date`: the supplied historical date, separate from `created_at`.
- `claims.import_batch_id` and `training_import_records.import_batch_id`: foreign keys to `import_batches`.
- `import_batches`: dataset namespace, file hash and creation timestamp. A batch identifies a dataset/file version, not each command invocation; retries reuse it. Skipped claims retain their original batch.

The importer writes these fields atomically with each new claim. Startup backfills older registry-confirmed imports from their saved JSON and file hashes without changing reviews or creation dates. Missing or invalid legacy dates remain unknown. A unique dataset/source-ID index prevents duplicate claim identities. Existing non-imported claims retain `LIVE` provenance.

Run backend startup, or `py -3.13 -m api.database`, to apply migrations to the configured database. Source-specific UI filtering and historical-date display are still separate work.

`api/import_training_claims.py` is implemented. The remaining sections below describe the broader integration proposal; not every proposed UI or metric change has been implemented.

```powershell
py -3.13 -m api.import_training_claims --file data/imports/claims.csv --dataset toyota-history-v1 --dry-run
py -3.13 -m api.import_training_claims --file data/imports/claims.csv --dataset toyota-history-v1 --commit --report import-report.json
py -3.13 -m unittest api.test_import_training_claims
```

Dry run is the default and does not create or migrate the database. It validates records and runs real inference. Commit imports valid records and reports invalid rows; exit code 1 means invalid rows or conflicts were found, so inspect the report even if some records were created. Exit code 2 means a file/configuration failure.

CSV requires no extra reader. Excel `.xlsx` requires `openpyxl` in the Python environment; use `--sheet` to choose a worksheet. `--database` selects a separate test database. Unknown variants are rejected unless `--allow-unknown-model` explicitly permits the existing fallback policy.

Provide exactly one row per source accident with a stable source ID. Repeated IDs within a file are rejected; grouping part-level rows remains a preparation task. Dates must be ISO `YYYY-MM-DD` or Excel date cells. Existing imported records are skipped when unchanged; changed source records are conflicts and never overwrite review decisions.

The importer saves provenance, original dates and historical part labels in `training_import_records.source_json`, separately from actual model predictions. Imported accident IDs start with `HIST-`; claims enter the existing pending views. Existing dashboards currently count all saved claims, including imported claims. Separate source filters, historical-date display and live-only metrics remain future work. Use `--database` with a separate database for demonstration data if it must not affect current totals.

No user dataset has been imported automatically.

## What needs to happen

The app currently shows claims saved in SQLite. Training a model does not automatically copy the training records into that database. The `.joblib` model and association-rule JSON are not a recoverable claim-history export.

To show your dataset records in **Demand Forecast → Pending claims**, import the original claim records, generate model suggestions for each valid claim, and save them with `PENDING` status. Users can then review them in Prediction Queue. Accepted parts appear under **Approved part predictions**.

This document is an implementation proposal. No dataset has been imported and no import script has been added by this documentation task.

## Files you need to provide

| File | Required? | Purpose |
| --- | --- | --- |
| Original `accident_data_real.xlsx`, or an equivalent CSV export | Yes | Source claim records. This is the filename used by the Colab training guide. |
| Column description or a small anonymized sample | If the actual columns differ from the guide | Confirms claim identity, dates, vehicle fields, part-list formatting and whether multiple rows belong to one accident. |
| `real_model_option_a_tuned.joblib` | Already used by the app | Generates genuine per-part scores and thresholds. |
| `real_warehouse_synergy_rules.json` | Already used by the app; not required just to import claims | Supports later companion recommendations. |
| Dataset-to-claim export from Colab | Alternative to the original workbook | A clean CSV containing the required fields below. Export source records, not encoded feature matrices. |

The original workbook has not been established as available in the accessible project files. Keep a copy of it outside the application database. You do not need to provide the existing SQLite database or retrain the model just to import records.

Do not include customer names, contact details, registration numbers or insurance identifiers unless they are actually required by the application. They are not needed for this import workflow.

## Required data and column mapping

The Colab guide references `Model`, `Make_Year`, `Parts_Replaced` and an optional damage-zone column. Verify the actual workbook before implementing the mapping; an accident ID and accident date are not guaranteed by the training guide.

| Import field | Example | Handling |
| --- | --- | --- |
| `source_claim_id` | `ACC-0001` | Prefer a stable accident identifier. If absent, assign a stable ID during preparation and preserve that prepared export. |
| `model` | `AQUA NHP10` | Required. Preserve the actual variant; normalize whitespace and case. |
| `make_year` | `2013` | Required integer within the API-supported range. |
| `damage_zone` | `Front` | Required for scored import; current intake accepts `Front`, `Rear` or `Side`. |
| `accident_date` | `2025-02-10` | Optional historical date. Store separately from the import timestamp. |
| `parts_replaced` | `FRONT BUMPER;BONNET` | Optional historical labels for reference. They are not model predictions or user approvals. |

Example **proposed normalized CSV**:

```csv
source_claim_id,model,make_year,damage_zone,accident_date,parts_replaced
ACC-0001,AQUA NHP10,2013,Front,2025-02-10,FRONT BUMPER;BONNET
ACC-0002,RAV4 XA50,2021,Rear,2025-02-11,REAR BUMPER
```

These rows are illustrative, not records recovered from your dataset. Confirm that each vehicle label is supported or explicitly accept the model's documented unknown-category policy.

If the workbook has one row per replaced part, group rows by the real accident identifier before importing. Do not group unrelated accidents merely because the model, year and date match. Conflicting vehicle details within one accident must be reported for correction.

### Missing impact zones

Do not silently assign `Front` to every record. That changes the input and can produce misleading suggestions.

The first implementation should exclude invalid or missing zones from scored import and report them for correction. Supporting pending historical claims without a known zone would require a deliberate schema/API change because `claims.damage_zone` currently permits only Front, Rear and Side.

Do not infer an input damage zone from `Parts_Replaced` when evaluating model quality: that introduces information from the target labels into the inputs.

## Distinguish historical labels from model suggestions

The recommended workflow generates fresh suggestions from the existing model:

```text
Dataset vehicle/year/zone
    → existing preprocessing and model
    → selected parts with real scores and thresholds
    → saved pending claim
    → user review
    → approved part predictions
```

`Parts_Replaced` describes historical outcomes. Copying those labels into `claim_predictions` with invented 100% scores would misrepresent them as model output. Preserve historical parts in a separate reference table if they need to be displayed or compared.

Importing old training records as pending is useful for a demonstration or retrospective review. It does not mean those accidents are new operational requests. Label them as **Training dataset / historical import**, keep them out of live operational metrics by default, and prevent accidental fulfillment conversion until an explicit operational workflow is defined.

Predictions on records used during training are not evidence of generalization accuracy. Use held-out data for evaluation.

## Proposed implementation files

| File | Change |
| --- | --- |
| `data/imports/claims.csv` or workbook | Local source file; exclude real datasets from Git. |
| `api/import_training_claims.py` — new | Command-line importer with validation, dry run, batch transactions and duplicate detection. |
| `api/claim_service.py` — proposed new shared module | Extract intake inference/persistence from the route so live intake and imports share preprocessing, score selection and validation. |
| `api/schema.sql` | Add import provenance, historical date and duplicate-protection tables/fields. |
| `api/database.py` | Add repeatable migrations preserving existing claims and review decisions. |
| `api/main.py` | Use the shared service and expose source/date information and source filters in claim responses. |
| `api/catalog.py` | Enforce the historical-claim conversion policy on the backend. |
| `api/metrics.py` | Add clearly scoped live/imported/all metrics. Preserve current approval definitions. |
| `src/prediction.ts` | Extend claim types with import source and historical date. |
| `src/App.tsx` | Show imported claims in Prediction Queue with source labels and source filtering. |
| `src/ApprovedPredictions.tsx` | Show imported pending claims in Demand Forecast and accepted parts in the approved tab. |
| `src/OperationalMetrics.tsx` | Label and select the metric scope consistently. |
| `api/test_import_training_claims.py` — new | Cover mapping, grouping, retries, invalid rows, review preservation and UI-facing API results. |
| `api/requirements.txt` | Add a verified Excel reader dependency such as `openpyxl` if importing `.xlsx`; CSV avoids this additional reader dependency. |
| `.gitignore` | Exclude source data and import reports that contain real claim records. |

These new files and fields are proposed, not currently implemented.

## Proposed database additions

Keep the existing `claims` and `claim_predictions` relationship so current review actions remain reusable.

Suggested additions:

- `claims.source_type`: distinguish live intake from historical dataset imports; migrate existing claims to the live-intake category.
- `claims.source_claim_id`: original stable source identifier.
- `claims.accident_date`: historical date when provided; nullable when unknown.
- `claims.import_batch_id`: reference the batch that created the record.
- `import_batches`: dataset namespace, file hash, import time, model version and row counts.
- `import_records`: dataset namespace plus source claim ID, normalized input hash, resulting claim ID and import result.
- Optional `claim_historical_parts`: historical target labels kept separate from predicted parts.

Use a unique constraint on `(dataset_namespace, source_claim_id)` in the import registry. A file hash alone is insufficient: exporting the same records in a different row order changes the file hash but should not create new claims.

Keep `created_at` as the actual database creation time. Display `accident_date` as the historical accident date, or explicitly show “date not supplied”; do not present import time as the accident date.

## Import algorithm

1. Read the selected CSV or Excel sheet and normalize explicitly mapped column names.
2. Group part-level rows into claims where necessary; reject ambiguous or conflicting groups.
3. Validate claim IDs, model labels, years, zones and date formatting.
4. Produce a dry-run report: valid claims, invalid claims, unchanged duplicates and changed existing records.
5. For each valid new claim, use the existing model preprocessing and serving configuration. Preserve the current single-worker inference configuration.
6. Save the claim as `PENDING`, its model version, predictions, thresholds and import identity atomically. Every new prediction has `human_action = NULL`.
7. Preserve claims with zero selected predictions so they appear as awaiting manual inspection.
8. On retry, skip unchanged imported records. Report changed inputs under an existing source ID as conflicts; never silently overwrite a reviewed claim.
9. Write a report containing created IDs, skipped IDs and actionable row errors. Avoid partially created claims if a transaction fails.

For large datasets, commit bounded batches or individual claims and store progress. Do not make thousands of browser requests or hold one database write transaction open while running inference for the entire workbook.

## What users will see

In Demand Forecast, **Pending claims** should include imported claims whose status is `PENDING`, with a visible source selector such as **All sources / Live intake / Historical dataset**.

Display:

- Accident ID and historical date, with import provenance.
- Vehicle variant and manufacture year.
- Suggested parts and actual model scores.
- Score level.
- Human action for each part: awaiting review, approved or rejected.

Users perform human review in Prediction Queue. Partially reviewed claims remain pending. Accepted parts appear in **Approved part predictions** immediately upon reload or refresh, even while another part in the claim remains unreviewed. Fully rejected claims appear under **Rejected claims**.

Keep pending-table counts and dashboard metric scope explicitly labeled. If the pending list includes historical records while operational cards show live data only, the differing counts must be explained in the UI.

## Proposed commands after implementation

The following commands illustrate the intended interface. They **will not work yet**, because the importer has not been created.

```powershell
# Validate and report without changing the database
py -3.13 -m api.import_training_claims --file data/imports/claims.csv --dataset toyota-history-v1 --dry-run

# Import valid new claims after inspecting the report
py -3.13 -m api.import_training_claims --file data/imports/claims.csv --dataset toyota-history-v1 --commit

# Verify importer behavior
py -3.13 -m unittest api.test_import_training_claims
```

Back up the database before the first bulk import. First validate a small sample in a separate test database, then import the intended dataset into the app database.

## Acceptance checks

| Check | Expected outcome |
| --- | --- |
| Import valid new claims | One pending claim per distinct source accident. |
| Repeat the same import | No duplicate claims or prediction lines. |
| Reorder the source file | Stable IDs still identify the same accidents. |
| Change an already imported record | Report a conflict; preserve existing decisions. |
| Missing zone or invalid year | Row reported for correction; no invented input. |
| No predictions pass thresholds | Pending claim remains visible for manual review. |
| Approve one suggested part | Approved-parts list and matching scoped count update. |
| Finish mixed review | Approved claim with exact per-part decisions preserved. |
| Reject all parts | Claim moves to rejected history. |
| Restart the app | Imported claims and reviews persist. |
| View live operational metrics | Historical imports do not inflate live totals. |
| Attempt historical fulfillment conversion | Backend enforces the explicit historical-data policy. |

## What is needed next

Provide the original workbook or a normalized CSV, plus the sheet name and column meanings if unclear. Confirm whether rows represent accidents or individual replaced parts. With that information, the importer and migrations can be implemented against the actual data rather than guessed column names.
