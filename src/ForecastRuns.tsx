import { useEffect, useRef, useState } from 'react'
import type { ForecastRun, ForecastRunMetadata, ForecastSku, ForecastSource } from './demand'

const number = (value: number | null) => value === null ? 'Unavailable' : value.toLocaleString(undefined, { maximumFractionDigits: 2 })
const date = (value: string) => value.slice(0, 10)
const button = 'rounded border px-3 py-2 text-sm disabled:opacity-50'
const pendingKey = 'toyota-pending-forecast-run'
type Request = { request_key: string; data_source: ForecastSource }

function pendingRequest(): Request | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(pendingKey) || 'null') as Request | null
    return value && typeof value.request_key === 'string' && ['LIVE', 'HISTORICAL', 'SYNTHETIC'].includes(value.data_source) ? value : null
  } catch { return null }
}

async function request<T>(path: string, signal: AbortSignal, body?: Request): Promise<T> {
  const response = await fetch(`/api/demand-forecast-runs${path}`, {
    signal, ...(body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
  })
  if (!response.ok) throw new Error(response.status === 404 ? 'Forecast endpoint or run not found. Restart the backend if it has not been updated.' : `Forecast request failed (${response.status}).`)
  return response.json() as Promise<T>
}

function ForecastChart({ row }: { row: ForecastSku }) {
  const weeks = [...row.history, ...row.weeks]
  const max = Math.max(1, ...weeks.map(w => w.units ?? 0))
  const min = Math.min(0, ...weeks.map(w => w.units ?? 0))
  const x = (i: number) => 55 + i * 57
  const y = (v: number) => 180 - ((v - min) / (max - min)) * 145
  return <div className="overflow-x-auto">
    <svg viewBox="0 0 750 240" className="w-full min-w-[650px]" role="img" aria-label={`${row.sku}: eight observed weeks and four forecast weeks, in units. Exact values in the table below.`}>
      <rect x="482" y="20" width="230" height="175" fill="#fff4ed" />
      <text x="492" y="32" fontSize="11">Forecast</text>
      {[min, (max + min) / 2, max].map((v, i) => <g key={i}><line x1="45" x2="710" y1={y(v)} y2={y(v)} stroke="#ddd" /><text x="3" y={y(v) + 4} fontSize="11">{number(v)}</text></g>)}
      {weeks.map((week, i) => <g key={week.starts_at}>
        {week.units !== null && <>
          {i > 0 && i !== 8 && weeks[i - 1].units !== null && <line x1={x(i - 1)} y1={y(weeks[i - 1].units!)} x2={x(i)} y2={y(week.units)} stroke={i < 8 ? '#2563eb' : '#b91c1c'} strokeWidth="2" strokeDasharray={i < 8 ? undefined : '6 4'} />}
          <circle cx={x(i)} cy={y(week.units)} r="4" fill={i < 8 ? '#2563eb' : '#b91c1c'}><title>{date(week.starts_at)}: {number(week.units)} units</title></circle>
        </>}
        <text x={x(i)} y="210" fontSize="10" textAnchor="middle">{week.starts_at.slice(5, 10)}</text>
      </g>)}
      <text x="55" y="233" fontSize="11">Week starting (UTC) · Blue solid: observed · Red dashed: forecast · Gaps: unknown</text>
    </svg>
    <details className="text-sm"><summary className="cursor-pointer">Weekly values</summary><table className="mt-2 w-full text-left"><thead><tr><th>Week starting (UTC)</th><th>Type</th><th>Units</th></tr></thead><tbody>{weeks.map((w, i) => <tr key={w.starts_at}><td>{date(w.starts_at)}</td><td>{i < 8 ? 'Observed' : 'Forecast'}</td><td>{number(w.units)}</td></tr>)}</tbody></table></details>
  </div>
}

export default function ForecastRuns() {
  const [runs, setRuns] = useState<ForecastRunMetadata[]>([])
  const [selected, setSelected] = useState('')
  const [run, setRun] = useState<ForecastRun | null>(null)
  const [sku, setSku] = useState('')
  const [source, setSource] = useState<ForecastSource>('LIVE')
  const [pending, setPending] = useState<Request | null>(pendingRequest)
  const [listError, setListError] = useState('')
  const [detailError, setDetailError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [listing, setListing] = useState(true)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [revision, setRevision] = useState(0)
  const saveController = useRef<AbortController | null>(null)
  useEffect(() => () => saveController.current?.abort(), [])

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const timer = window.setTimeout(() => controller.abort(), 30000)
    setListing(true); setListError('')
    request<ForecastRunMetadata[]>('?limit=100', controller.signal).then(values => {
      if (!active) return
      setRuns(values)
      setSelected(previous => values.some(v => String(v.id) === previous) ? previous : String(values[0]?.id ?? ''))
    }).catch(error => { if (active) setListError(error.name === 'AbortError' ? 'Saved runs timed out. Refresh to retry.' : error.message) })
      .finally(() => { window.clearTimeout(timer); if (active) setListing(false) })
    return () => { active = false; controller.abort(); window.clearTimeout(timer) }
  }, [revision])

  useEffect(() => {
    setRun(null); setDetailError('')
    if (!selected) { setLoading(false); return }
    const controller = new AbortController()
    let active = true
    const timer = window.setTimeout(() => controller.abort(), 30000)
    setLoading(true)
    request<ForecastRun>(`/${selected}`, controller.signal).then(value => {
      if (active) { setRun(value); setSku(String(value.forecast.sku_rows[0]?.catalog_item_id ?? '')) }
    }).catch(error => { if (active) setDetailError(error.name === 'AbortError' ? 'Saved forecast timed out. Refresh to retry.' : error.message) })
      .finally(() => { window.clearTimeout(timer); if (active) setLoading(false) })
    return () => { active = false; controller.abort(); window.clearTimeout(timer) }
  }, [selected, revision])

  async function generate() {
    if (saveController.current) return
    const controller = new AbortController()
    saveController.current = controller
    setSaving(true); setSaveError('')
    const body = pending ?? { request_key: crypto.randomUUID(), data_source: source }
    setPending(body)
    try { sessionStorage.setItem(pendingKey, JSON.stringify(body)) } catch { /* In-memory retry remains available. */ }
    const timer = window.setTimeout(() => controller.abort(), 60000)
    try {
      const value = await request<ForecastRun>('', controller.signal, body)
      if (controller.signal.aborted) return
      setPending(null)
      try { sessionStorage.removeItem(pendingKey) } catch { /* Storage may be disabled. */ }
      setSelected(String(value.id)); setRevision(v => v + 1)
    } catch (error) {
      // A timeout can happen after the server commits. Keep the exact key for retry.
      setSaveError(`${error instanceof Error && error.name !== 'AbortError' ? error.message : 'The save could not be confirmed.'} Retry uses the same request to avoid a duplicate run.`)
    } finally {
      window.clearTimeout(timer); saveController.current = null; setSaving(false)
    }
  }

  const row = run?.forecast.sku_rows.find(value => String(value.catalog_item_id) === sku)
  return <section aria-label="Saved demand forecasts" className="space-y-4 rounded border border-[#e9bcb7] bg-white p-4">
    <h3 className="font-semibold">Saved demand forecasts</h3>
    <p className="text-sm">Save a four-week forecast and evaluate the baseline on completed historical windows. Saved results remain fixed when demand changes.</p>
    <div className="flex flex-wrap items-end gap-3">
      <label className="text-sm">Demand source<select aria-label="Forecast demand source" value={pending?.data_source ?? source} disabled={saving || !!pending} onChange={e => setSource(e.target.value as ForecastSource)} className="ml-2 rounded border p-2"><option value="LIVE">Live</option><option value="HISTORICAL">Historical quantities</option><option value="SYNTHETIC">Synthetic demo</option></select></label>
      <button type="button" className={button} disabled={saving || listing} onClick={() => void generate()}>{saving ? 'Saving forecast…' : pending ? 'Retry saved request' : 'Generate and save forecast'}</button>
      <button type="button" className={button} disabled={saving || listing} onClick={() => setRevision(v => v + 1)}>Refresh saved runs</button>
    </div>
    {(pending?.data_source ?? source) === 'SYNTHETIC' && <p className="text-sm text-amber-800">Synthetic demonstration data. These results do not measure live demand.</p>}
    {pending && !saving && <p className="text-sm">An unconfirmed {pending.data_source.toLowerCase()} request is retained for safe retry.</p>}
    {saveError && <p role="alert" className="text-red-700">{saveError}</p>}
    {listing && <p role="status">Loading saved runs…</p>}
    {listError && <p role="alert" className="text-red-700">{listError}</p>}
    {!listing && !listError && !runs.length && <p>No saved forecasts yet. Generate a run to record readiness and any available estimates.</p>}
    {!!runs.length && <label className="block text-sm">Saved run (latest 100)<select aria-label="Saved forecast run" className="ml-2 max-w-full rounded border p-2" value={selected} disabled={saving || listing} onChange={e => setSelected(e.target.value)}>{runs.map(value => <option value={value.id} key={value.id}>#{value.id} · {new Date(value.created_at).toLocaleString()} · {value.data_source}</option>)}</select></label>}
    {loading && <p role="status">Loading forecast details…</p>}
    {detailError && <p role="alert" className="text-red-700">{detailError}</p>}
    {run && !loading && <>
      <p className="text-sm">Run #{run.id} · {run.forecast.data_source} · {run.method_version} · Saved {new Date(run.created_at).toLocaleString()}</p>
      {run.forecast.data_source === 'SYNTHETIC' && <p className="font-semibold text-amber-800">Synthetic demonstration forecast — excluded from live results.</p>}
      <p>{run.forecast.status === 'NO_CATALOG' ? 'No catalog SKUs. Add catalog mappings before forecasting.' : run.forecast.status === 'READY' ? `Four-week expected demand: ${number(run.forecast.units)} units.` : run.forecast.status === 'PARTIAL' ? 'Some SKUs are ready. A complete total is unavailable.' : 'Insufficient usable history. Eight complete weeks of dated SKU quantities are required.'}</p>
      <p className="text-xs">{run.forecast.ready_skus} / {run.forecast.total_skus} SKUs ready. Forecast starts {date(run.forecast.origin)} UTC and includes that week. Monthly replacement occurrences do not supply unit quantities or verified coverage.</p>
      <div className="grid gap-3 sm:grid-cols-2"><div className="rounded border p-3">Eight-week mean MAE<p className="text-xl font-semibold">{number(run.evaluation.mae)}</p></div><div className="rounded border p-3">Last-week baseline MAE<p className="text-xl font-semibold">{number(run.evaluation.last_week_mae)}</p></div></div>
      <p className="text-xs">Mean absolute error in weekly units; lower is better. {run.evaluation.sample_count} scored weekly samples across {run.evaluation.evaluated_sku_windows} / {run.evaluation.eligible_sku_windows} candidate SKU windows. Origins: {date(run.evaluation.first_origin)} to {date(run.evaluation.last_origin)} UTC. Windows overlap; samples are not independent. {run.evaluation.status !== 'AVAILABLE' && 'Evaluation unavailable: no complete training and observed holdout window qualifies.'}</p>
      {!!run.evaluation.samples.length && <details className="text-sm"><summary className="cursor-pointer">Evaluation observations and errors</summary><div className="max-h-80 overflow-auto"><table className="w-full min-w-[600px] text-left"><thead><tr>{['SKU', 'Forecast origin (UTC)', 'Horizon week', 'Observed units', 'Estimated units', 'Absolute error'].map(label => <th className="p-2" key={label}>{label}</th>)}</tr></thead><tbody>{run.evaluation.samples.map(sample => <tr key={`${sample.catalog_item_id}-${sample.origin}-${sample.horizon_week}`} className="border-t"><td className="p-2">{sample.sku}</td><td className="p-2">{date(sample.origin)}</td><td className="p-2">{sample.horizon_week}</td><td className="p-2">{number(sample.actual_units)}</td><td className="p-2">{number(sample.predicted_units)}</td><td className="p-2">{number(sample.absolute_error)}</td></tr>)}</tbody></table></div></details>}
      {!!run.forecast.sku_rows.length && <>
        <label className="block text-sm">Chart SKU<select aria-label="Forecast chart SKU" value={sku} onChange={e => setSku(e.target.value)} className="ml-2 rounded border p-2">{run.forecast.sku_rows.map(value => <option key={value.catalog_item_id} value={value.catalog_item_id}>{value.sku}</option>)}</select></label>
        {row && <><p className="text-sm">{row.sku}: {row.complete_weeks}/8 complete weeks. {row.status === 'INVALID_HISTORY' ? 'Negative net demand requires investigation; no forecast is shown.' : row.status === 'READY' ? 'Baseline available.' : 'Insufficient history; unknown values remain gaps.'}</p><ForecastChart row={row} /></>}
        <div className="max-h-80 overflow-auto"><table className="w-full text-left text-sm"><thead><tr>{['SKU', 'Complete weeks', 'Status', 'Weekly estimate', 'Four-week estimate'].map(label => <th className="p-2" key={label}>{label}</th>)}</tr></thead><tbody>{run.forecast.sku_rows.map(value => <tr key={value.catalog_item_id} className="border-t"><td className="p-2">{value.sku}</td><td className="p-2">{value.complete_weeks}/8</td><td className="p-2">{value.status.replace(/_/g, ' ').toLowerCase()}</td><td className="p-2">{number(value.weekly_units)}</td><td className="p-2">{number(value.units)}</td></tr>)}</tbody></table></div>
      </>}
      <p className="text-xs">Estimates are expected units, not purchase instructions. No uncertainty interval has been calculated.</p>
    </>}
  </section>
}
