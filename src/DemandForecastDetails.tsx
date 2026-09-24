import { useEffect, useState } from 'react'
import type { DemandSummary } from './demand'
import ForecastRuns from './ForecastRuns'

const cards: Array<[keyof DemandSummary, string, string, 'alert' | 'flow' | 'inventory']> = [
  ['pending_claims', 'Pending claims', 'Claims awaiting completed review', 'alert'],
  ['approved_part_occurrences', 'Approved predictions', 'Part occurrences, not requested units', 'flow'],
  ['pending_catalog_units', 'Pending fulfillment', 'Catalog-backed units awaiting dispatch', 'alert'],
  ['unreserved_pending_units', 'Unreserved demand', 'Pending units not yet reserved', 'alert'],
  ['catalog_on_hand', 'On hand', 'Catalog units across warehouses', 'inventory'],
  ['reserved_units', 'Reserved', 'Units allocated to pending orders', 'inventory'],
  ['available_units', 'Available', 'On hand minus reservations', 'flow'],
  ['stockout_records', 'Stockouts', 'Warehouse/SKU records with zero available', 'alert'],
  ['low_availability_records', 'Low availability', 'Positive stock below configured reorder level', 'alert'],
]

function MetricIcon({ metric, tone }: { metric: keyof DemandSummary; tone: 'alert' | 'flow' | 'inventory' }) {
  const color = tone === 'alert' ? 'text-[#bd0014]' : tone === 'flow' ? 'text-[#059669]' : 'text-[#2563eb]'
  return <span className={`flex size-9 shrink-0 items-center justify-center rounded-[4px] ${tone === 'alert' ? 'bg-[#fff7f5]' : tone === 'flow' ? 'bg-[#ecfdf5]' : 'bg-[#eff6ff]'} ${color}`} aria-hidden="true">
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {metric === 'stockout_records' || metric === 'low_availability_records' ? <><path d="M12 3 22 20H2L12 3Z" /><path d="M12 9v4M12 17h.01" /></> : metric === 'catalog_on_hand' || metric === 'reserved_units' || metric === 'available_units' ? <><path d="m12 3 8 4-8 4-8-4 8-4Z" /><path d="m4 12 8 4 8-4M4 17l8 4 8-4" /></> : metric === 'approved_part_occurrences' ? <><path d="m5 12 4 4L19 6" /><circle cx="12" cy="12" r="9" /></> : <><path d="M4 18V9M10 18V5M16 18v-7M22 18H2" /><path d="m16 7 2-2 2 2" /></>}
    </svg>
  </span>
}

export default function DemandForecastDetails() {
  const [data, setData] = useState<DemandSummary | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [revision, setRevision] = useState(0)
  const [search, setSearch] = useState('')
  useEffect(() => {
    let active = true
    let running = false
    let controller: AbortController | undefined
    async function load() {
      if (running) return
      running = true
      controller = new AbortController()
      const timer = window.setTimeout(() => controller?.abort(), 15000)
      try {
        const response = await fetch('/api/demand-summary', { signal: controller.signal })
        if (!response.ok) throw new Error(response.status === 404 ? 'Demand summary is unavailable. Restart the backend to load the new endpoint.' : `Could not load demand summary (${response.status}).`)
        const summary = await response.json() as DemandSummary
        if (active) { setData(summary); setError('') }
      } catch (e) {
        if (active) { setData(null); setError(e instanceof Error && e.name !== 'AbortError' ? e.message : 'Demand summary timed out. Please retry.') }
      } finally {
        window.clearTimeout(timer); running = false
        if (active) setLoading(false)
      }
    }
    setLoading(true)
    void load()
    const timer = window.setInterval(() => void load(), 15000)
    const refresh = () => void load()
    window.addEventListener('focus', refresh)
    return () => { active = false; controller?.abort(); window.clearInterval(timer); window.removeEventListener('focus', refresh) }
  }, [revision])
  const rows = data?.sku_rows.filter(row => `${row.sku} ${row.part_name}`.toLowerCase().includes(search.trim().toLowerCase())) ?? []
  const synthetic = new Set(data?.warehouse_stock.filter(row => row.synthetic).map(row => row.catalog_item_id))
  return <section aria-label="Operational demand summary" className="my-5 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Operational demand</h3><button type="button" disabled={loading} onClick={() => setRevision(v => v + 1)} className="rounded border px-3 py-2 text-sm disabled:opacity-50">Refresh demand</button></div>
    <p className="text-xs text-[#5f5e5e]">All warehouses in the active database, including historical and synthetic data. Current balances and saved review counts; independent of the stock-table filters below.</p>
    {loading ? <p role="status" className="rounded border bg-white p-4">Loading demand statistics…</p> : error ? <div role="alert" className="rounded border border-red-300 bg-white p-4 text-red-700">{error} Use Refresh demand to retry.</div> : data && <>
      <p className="text-xs">Updated {new Date(data.as_of).toLocaleString()}</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([key, label, description, tone]) => <div key={key} className="relative overflow-hidden rounded border border-[#e9bcb7] bg-white p-4 shadow-[0_6px_18px_rgba(27,28,28,0.04)]"><div className={`absolute inset-y-0 left-0 w-1 ${tone === 'alert' ? 'bg-[#bd0014]' : tone === 'flow' ? 'bg-[#10b981]' : 'bg-[#2563eb]'}`} /><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[0.45px] text-[#5f5e5e]">{label}</p><p className="my-2 text-2xl font-black tracking-[-0.4px]">{Number(data[key]).toLocaleString()}</p></div><MetricIcon metric={key} tone={tone} /></div><p className="text-xs text-[#5f5e5e]">{description}</p></div>)}</div>
      <p className="text-sm">Unmapped pending demand: <strong>{data.unmapped_pending_units}</strong> units · Legacy stock: <strong>{data.legacy_stock_units}</strong> units. These are excluded from SKU comparisons until mapped.</p>
      <div className="rounded border bg-white p-4"><h4 className="font-semibold">Four-week demand baseline</h4><p className="text-sm">{data.forecast.status === 'READY' ? `${data.forecast.units?.toLocaleString()} expected units` : data.forecast.status === 'NO_CATALOG' ? 'No catalog SKUs available for forecasting.' : data.forecast.status === 'PARTIAL' ? 'Partial history: a total forecast is unavailable.' : 'Insufficient history: a forecast is unavailable.'}</p><p className="mt-2 text-xs">{data.forecast.ready_skus ?? 0} of {data.forecast.total_skus ?? 0} SKUs ready. Uses the mean of eight complete weeks of live requested quantities. Four-week window starts {data.forecast.origin ? data.forecast.origin.slice(0, 10) : 'after backend restart'} (UTC), including the current week. Monthly replacement occurrences and synthetic demand are excluded. Evaluation is available in saved runs below when sufficient history exists.</p></div>
      <div className="rounded border border-[#e9bcb7] bg-white p-4">
        <div className="mb-3 flex flex-wrap justify-between gap-2"><h4 className="font-semibold">Demand by SKU</h4><input aria-label="Search demand by SKU or part" placeholder="Search SKU or part" value={search} onChange={e => setSearch(e.target.value)} className="rounded border px-3 py-2 text-sm" /></div>
        <p className="mb-3 text-xs">Shortage compares unreserved demand with pooled availability. It does not guarantee fulfillment from a single warehouse. Stockout and low-availability cards count recorded warehouse/SKU balances.</p>
        {!data.sku_rows.length ? <p className="py-3 text-sm">No catalog SKUs in this database. Claims can still appear above. Add compatible catalog SKUs and stock to compare inventory with fulfillment demand.</p> : !rows.length ? <p className="py-3 text-sm">No SKUs match your search.</p> : <div className="max-h-96 overflow-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead><tr>{['SKU / part', 'On hand', 'Reserved', 'Available', 'Pending units', 'Unreserved units', 'Pooled shortage'].map(label => <th className="p-2 text-xs" key={label}>{label}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.catalog_item_id} className="border-t"><td className="p-2"><p className="font-mono">{row.sku}</p><p>{row.part_name}</p>{synthetic.has(row.catalog_item_id) && <p className="text-xs text-amber-800">Includes synthetic stock</p>}</td>{[row.on_hand, row.reserved, row.available, row.pending_units, row.unreserved_pending_units, row.global_unallocated_shortage_units].map((value, index) => <td key={index} className={`p-2 ${index === 5 && value > 0 ? 'font-semibold text-red-700' : ''}`}>{value.toLocaleString()}</td>)}</tr>)}</tbody></table></div>}
        <p className="mt-3 text-xs">Showing {rows.length} of {data.sku_rows.length} SKUs.</p>
      </div>
    </>}
    <ForecastRuns />
  </section>
}
