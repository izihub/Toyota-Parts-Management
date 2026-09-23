# Part catalog and SKU stock explained

## 1. Why the application needs a part catalog

The ML model predicts general part labels such as `FRONT BUMPER`, `BONNET`, or `LH FOG LAMP`. These labels describe the kind of part that may be needed, but they do not identify an exact item that can be purchased, stored, reserved, or dispatched.

A real stock item needs a unique SKU and verified vehicle compatibility. For example, two items may both be front bumpers but fit different Toyota variants or manufacture years.

```text
ML part label: FRONT BUMPER
        ↓ human/catalog mapping
SKU: FB-AQUA-2013
Fitment: AQUA NHP10, 2013
Warehouse stock: 8 units
```

The catalog connects the model's general label to an exact orderable item. Inventory is then tracked against that exact SKU.

## 2. Main terms

| Term | Meaning in this application |
| --- | --- |
| Part | Canonical ML/business label, such as `FRONT BUMPER`. |
| SKU | Unique orderable item or part number, such as `FB-AQUA-2013`. |
| Display name | Human-readable catalog description. |
| Fitment | Exact vehicle variant and manufacture year for which the SKU is verified. |
| Alias | Another label that refers to the same canonical part. |
| Warehouse | Physical or logical location holding the SKU. |
| On hand | Physical quantity currently recorded at the warehouse. |
| Reserved | Quantity allocated to pending fulfillment orders. |
| Available | On-hand quantity minus active reservations. |
| Reorder level | Reference threshold used to identify low stock. It is not predicted demand. |
| Legacy stock | Old name-only stock without a verified SKU identity or fitment. |

## 3. Catalog identity

The catalog stores three connected pieces of information:

1. A canonical part label.
2. A unique SKU and display name.
3. One or more explicitly verified vehicle fitments.

Example:

```text
Canonical part: FRONT BUMPER
SKU: TOY-AQUA-FB-001
Display name: Toyota Aqua Front Bumper Assembly
Fitments:
  - AQUA NHP10, 2013
  - AQUA NHP10, 2014
Aliases:
  - BUMPER FRONT
  - FRONT BUMPER ASSEMBLY
```

One SKU can have several verified fitments. A different SKU can use the same canonical part label if it represents a different physical item. The application keeps those SKUs separate.

Fitment does not mean the item has stock, a supplier, or a price. It only records compatibility.

## 4. Database tables

The catalog and inventory structure is defined in [api/schema.sql](api/schema.sql).

| Table | Purpose |
| --- | --- |
| `parts` | Stores canonical part labels used by predictions and orders. |
| `catalog_items` | Stores each unique SKU and its display name. |
| `vehicles` | Stores exact vehicle model/year combinations. |
| `catalog_fitments` | Links a SKU to its compatible vehicle combinations. |
| `part_aliases` | Maps alternate labels to a canonical part. |
| `catalog_inventory` | Stores on-hand quantity and reorder level for a SKU at a warehouse. |
| `inventory` | Preserves legacy name-only stock separately. |
| `stock_reservations` | Allocates SKU quantities to pending fulfillment lines. |
| `inventory_movements` | Records stock entries, reservations, releases, receipts, dispatches, and adjustments. |

The important identity for catalog stock is:

```text
warehouse_id + catalog_item_id
```

This means the same SKU can have separate balances in different warehouses.

## 5. Creating a catalog entry in the UI

Open **Demand Review & Inventory** or **Purchase Orders**, then expand **Part catalog and SKU stock**.

Enter:

| Field | What to provide |
| --- | --- |
| Orderable SKU / part number | A unique part number used for purchasing and inventory. |
| ML part label | The canonical predicted label, such as `FRONT BUMPER`. |
| Catalog description | Clear human-readable description of the exact item. |
| Exact vehicle variant | A value such as `AQUA NHP10`, matching the vehicle identity used by claims. |
| Compatible make year | The exact compatible year. |
| Aliases | Optional comma-separated alternate part labels. |

Select **Save catalog entry**. To add another fitment to the same SKU, submit the same SKU, canonical part, and display name with another model/year combination.

The backend rejects the request if an existing SKU is submitted with a different canonical part or display name. It also rejects an alias already assigned to another part.

The relevant implementation is in [src/CatalogManager.tsx](src/CatalogManager.tsx) and [api/catalog.py](api/catalog.py).

## 6. Adding SKU stock

After a catalog item exists, use the stock form in **Part catalog and SKU stock**:

1. Select the SKU.
2. Select one of that SKU's verified fitments.
3. Enter the warehouse name.
4. Enter a positive whole-number quantity.
5. Select **Add SKU stock**.

The backend validates that the SKU matches both the canonical part and selected fitment. It then adds the quantity to the SKU balance for that warehouse.

This action is additive. If a SKU has 8 units and the user adds 3, the new on-hand quantity is 11. It should not be used to set or replace an existing balance.

For corrections, use **Purchase receipts, adjustments & movement history → Record adjustment**. Adjustments require a signed quantity and a reason.

## 7. Stock quantities

The UI and API distinguish three quantities:

```text
available quantity = on-hand quantity − reserved quantity
```

Example:

| Quantity | Value |
| --- | ---: |
| On hand | 10 |
| Reserved for pending orders | 3 |
| Available for another order | 7 |

Reserving stock does not immediately reduce on hand. It prevents another order from using those units. Dispatch removes the reservation and deducts the physical on-hand quantity.

| Operation | On hand | Reserved | Available |
| --- | ---: | ---: | ---: |
| Add or receive 10 units | 10 | 0 | 10 |
| Reserve 3 units | 10 | 3 | 7 |
| Release reservation | 10 | 0 | 10 |
| Reserve and dispatch 3 | 7 | 0 | 7 |
| Confirm delivery | 7 | 0 | 7 |

Confirming delivery does not deduct stock again.

## 8. How catalog stock connects to claims

The claim model suggests a canonical part label. A reviewer approves or rejects that suggestion. An approved part still needs an exact catalog SKU before it can become an operational fulfillment line.

```text
Saved prediction
    → human approval
    → compatible SKU selection
    → pending fulfillment order
    → optional companion additions
    → warehouse reservation
    → dispatch
    → delivery
```

Claim conversion validates all of the following:

- The claim review is complete.
- At least one predicted part is approved.
- Exactly one fulfillment line is supplied for each approved part.
- Each selected SKU maps to the approved canonical label.
- Each selected SKU is compatible with the claim's vehicle variant and year.
- Quantity is a positive integer and unit price is explicit.

The created fulfillment line keeps references to the catalog item and source prediction. This provides traceability from model result to physical inventory item.

## 9. How catalog stock connects to purchases

A purchase draft can contain a SKU, supplier, fitment, quantity, unit price, shipping cost, and source information.

Saving or submitting a purchase order does not increase inventory. Stock changes only when a submitted, catalog-backed purchase is received into a warehouse.

Receipt behavior:

- Every purchase line must have a catalog SKU.
- The complete order is received into one selected warehouse.
- Quantities are added to `catalog_inventory`.
- Receipt movements are written to the ledger.
- Repeating the same receipt does not add the quantities twice.
- The purchase order status changes to `RECEIVED`.

The current implementation receives the whole purchase order. Partial receipts are not supported.

## 10. Reservations and dispatch

A pending fulfillment order must have a compatible catalog SKU for every line before stock can be reserved.

When **Reserve all stock** is selected:

1. The backend checks every line in one transaction.
2. It calculates available stock at the selected warehouse.
3. It creates reservations only if every line can be fulfilled.
4. If any line is short, the entire reservation fails and no partial reservation remains.

When **Dispatch** is selected:

1. Every line must have a matching reservation.
2. On-hand quantities are deducted.
3. Reservations are removed.
4. Dispatch movements are recorded.
5. The order changes from `PENDING` to `IN TRANSIT`.

Repeated dispatch requests do not deduct stock twice. The lifecycle code is in [api/logistics.py](api/logistics.py).

## 11. Inventory movements

The movement ledger explains how catalog stock changed. It contains quantity changes and reservation changes.

| Movement kind | Stock delta | Reservation delta | Meaning |
| --- | ---: | ---: | --- |
| `STOCK_ENTRY` | Positive | 0 | Manual SKU stock was added. |
| `RECEIPT` | Positive | 0 | A submitted purchase was received. |
| `RESERVE` | 0 | Positive | Stock was allocated to fulfillment. |
| `RELEASE` | 0 | Negative | A pending reservation was released. |
| `DISPATCH` | Negative | Negative | Physical stock left the warehouse. |
| `ADJUSTMENT` | Positive or negative | 0 | Count correction with a reason. |

Negative adjustments cannot reduce available stock below zero or consume units already reserved for an order.

The ledger records new catalog operations. Existing balances created before the ledger was introduced do not receive invented historical movement records.

## 12. Legacy stock compared with SKU stock

Legacy stock is preserved because old records may contain only a part name, vehicle text, and quantity. The application does not automatically convert it to catalog stock.

| Legacy stock | Catalog SKU stock |
| --- | --- |
| Identified mainly by part label | Identified by a unique SKU |
| Compatibility may be incomplete | Exact fitments are recorded |
| Cannot safely support SKU reservation | Supports reservation and dispatch |
| Reported as `LEGACY_UNMAPPED` | Reported as `CATALOGED` |
| Kept in `inventory` | Kept in `catalog_inventory` |

Mapping legacy stock requires verified SKU and fitment information. Matching labels alone is insufficient because two physical items can share the same general part name.

## 13. Common examples

### Add a new SKU with one fitment

```json
POST /api/catalog
{
  "sku": "TOY-AQUA-FB-001",
  "part_name": "FRONT BUMPER",
  "display_name": "Toyota Aqua Front Bumper Assembly",
  "fitments": [
    { "model": "AQUA NHP10", "make_year": 2013 }
  ],
  "aliases": ["BUMPER FRONT"]
}
```

### Add stock for that SKU

```json
POST /api/stock
[
  {
    "sku": "TOY-AQUA-FB-001",
    "part_name": "FRONT BUMPER",
    "vehicle_model": "AQUA NHP10",
    "make_year": 2013,
    "warehouse_name": "Main Warehouse",
    "quantity": 10
  }
]
```

### Read stock

```text
GET /api/stock
```

Catalog stock responses include SKU, warehouse, on-hand quantity, reserved quantity, available quantity, reorder level, and fitments.

## 14. Validation rules and expected errors

| Situation | Result |
| --- | --- |
| Blank SKU, part, description, model, or fitment year | Validation failure. |
| Existing SKU submitted with different part or description | HTTP 409 conflict. |
| Alias belongs to a different canonical part | HTTP 409 conflict. |
| Stock entry uses an incompatible model/year | Request rejected. |
| Claim conversion uses the wrong SKU for a predicted label | Request rejected. |
| Fulfillment contains an unmapped line | Reservation rejected. |
| Warehouse does not have enough available stock | Entire reservation rejected. |
| Dispatch is requested before reservation | Status change rejected. |
| Adjustment would consume reserved stock | Adjustment rejected. |

These validations run on the backend. Changing the frontend controls cannot bypass them.

## 15. Recommended operating sequence

1. Create or verify canonical part labels.
2. Add exact SKUs and compatible vehicle fitments.
3. Add opening SKU stock or submit and receive catalog-backed purchase orders.
4. Review predicted claim parts.
5. Convert approved parts using compatible SKUs.
6. Add and review any companion suggestions.
7. Reserve all fulfillment lines at one warehouse.
8. Dispatch and confirm delivery.
9. Use movement history to reconcile changes.
10. Use adjustments only for justified corrections.

## 16. Current limitations

- Catalog entries cannot currently be edited or deleted through the UI.
- Stock entry is additive; setting an exact balance requires calculating and recording an adjustment.
- The UI does not currently edit reorder levels.
- Reservations and receipts operate on complete orders at one warehouse.
- Partial receipts, partial dispatch, transfers, returns, and cancellation restocking are not implemented.
- Supplier-specific SKU records and lead-time planning are not modeled as first-class catalog data.
- A fitment is only as reliable as the catalog information entered by the user.

For synthetic demonstration stock, use the separate [synthetic stock implementation guide](SYNTHETIC_STOCK_IMPLEMENTATION_GUIDE.md). Synthetic catalog records and balances must be visibly identified and must not be treated as verified real inventory.
