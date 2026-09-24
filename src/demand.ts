export interface DemandSku {
  catalog_item_id: number
  sku: string
  part_name: string
  on_hand: number
  reserved: number
  available: number
  pending_units: number
  unreserved_pending_units: number
  global_unallocated_shortage_units: number
}

export type ForecastSource = 'LIVE' | 'HISTORICAL' | 'SYNTHETIC'
export interface ForecastWeek { starts_at: string; ends_at: string; units: number | null; complete?: boolean }
export interface ForecastSku {
  catalog_item_id: number
  sku: string
  status: string
  complete_weeks: number
  units: number | null
  weekly_units: number | null
  history: ForecastWeek[]
  weeks: ForecastWeek[]
}
export interface ForecastRunMetadata { id: number; created_at: string; data_source: ForecastSource; method_version: string }
export interface ForecastRun {
  id: number
  created_at: string
  method_version: string
  forecast: { data_source: ForecastSource; status: string; origin: string; units: number | null; ready_skus: number; total_skus: number; sku_rows: ForecastSku[] }
  evaluation: {
    status: string; mae: number | null; last_week_mae: number | null
    first_origin: string; last_origin: string; sample_count: number
    evaluated_sku_windows: number; eligible_sku_windows: number
    samples: Array<{ catalog_item_id: number; sku: string; origin: string; horizon_week: number; actual_units: number; predicted_units: number; absolute_error: number }>
  }
}

export interface DemandSummary {
  as_of: string
  scope: { warehouses: string; data_sources: string; period: string }
  pending_claims: number
  approved_part_occurrences: number
  pending_catalog_units: number
  unreserved_pending_units: number
  unmapped_pending_units: number
  catalog_on_hand: number
  reserved_units: number
  available_units: number
  legacy_stock_units: number
  stockout_records: number
  low_availability_records: number
  sku_rows: DemandSku[]
  warehouse_stock: Array<{ catalog_item_id: number; synthetic: boolean }>
  forecast: { status: string; units: number | null; origin: string; ready_skus: number; total_skus: number }
  notes: string[]
}
