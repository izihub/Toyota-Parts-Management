import { useEffect, useState } from 'react'
import { catalogRequest } from './catalog'

type Metrics = {
  scope: string; as_of: string; pending_claims: number; unreviewed_predictions: number;
  approved_predictions: number; catalog_on_hand: number; reserved_units: number; available_units: number;
  legacy_units: number; pending_orders: number; in_transit_orders: number; delivered_orders: number;
  total_orders: number; delivery_rate: number | null;
  workshops: Array<{ name: string; total: number; pending: number; in_transit: number; delivered: number }>;
}

function MetricIcon({ kind }: { kind: 'pending' | 'transit' | 'delivered' | 'rate' | 'parts' | 'approved' | 'stock' }) {
  return <span className="flex size-9 shrink-0 items-center justify-center rounded-[4px] bg-[#eff6ff] text-[#2563eb]" aria-hidden="true">
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {kind === 'pending' && <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M8 11h8M8 15h4" /></>}
      {kind === 'transit' && <><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>}
      {kind === 'delivered' && <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>}
      {kind === 'rate' && <><path d="M4 18V9M10 18V5M16 18v-7M22 18H2" /><path d="m16 7 2-2 2 2" /></>}
      {kind === 'parts' && <><path d="m12 3 8 4-8 4-8-4 8-4Z" /><path d="m4 12 8 4 8-4M4 17l8 4 8-4" /></>}
      {kind === 'approved' && <><path d="m5 12 4 4L19 6" /><circle cx="12" cy="12" r="9" /></>}
      {kind === 'stock' && <><path d="M4 20V8l8-4 8 4v12" /><path d="M8 20v-6h8v6M8 9h.01M12 9h.01M16 9h.01" /></>}
    </svg>
  </span>
}

export default function OperationalMetrics({ fulfillment = false }: { fulfillment?: boolean }) {
  const [data, setData] = useState<Metrics | null>(null)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let active = true
    async function load() {
      try { const value = await catalogRequest<Metrics>('/api/metrics'); if (active) { setData(value); setError('') } }
      catch (e) { if (active) { setData(null); setError(String(e)) } }
    }
    void load(); const timer = window.setInterval(() => void load(), 15000)
    const refresh = () => void load()
    window.addEventListener('focus', refresh)
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', refresh) }
  }, [revision])
  const cards: Array<[string, number | string | null | undefined, string, Parameters<typeof MetricIcon>[0]['kind']]> = fulfillment ? [
    ['Pending orders', data?.pending_orders, 'Awaiting dispatch', 'pending'], ['In transit', data?.in_transit_orders, 'Dispatched, awaiting delivery', 'transit'],
    ['Delivered', data?.delivered_orders, 'Confirmed deliveries', 'delivered'], ['Delivery rate', data?.delivery_rate == null ? null : `${data.delivery_rate}%`, 'Delivered / all fulfillment orders', 'rate'],
  ] : [
    ['Unreviewed part predictions', data?.unreviewed_predictions, 'Part occurrences, not forecast units', 'parts'],
    ['Approved part predictions', data?.approved_predictions, 'All-time reviewer approvals', 'approved'],
    ['Available SKU units', data?.available_units, 'Catalog stock minus reservations', 'stock'],
  ]
  return <section className="my-5" aria-label="Operational metrics">
    <div className="mb-3 flex flex-wrap justify-between gap-2 text-xs"><p>{data ? `${data.scope} · Updated ${new Date(data.as_of).toLocaleTimeString()}` : error || 'Loading metrics…'}</p><button className="underline" onClick={() => setRevision(v => v + 1)}>Refresh metrics</button></div>
    {error && <p role="alert" className="mb-2 text-sm text-red-700">Metrics unavailable. Retry using Refresh metrics.</p>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, note, icon]) => <div key={label} className="relative overflow-hidden rounded border border-[#e9bcb7] bg-white p-4 pl-5 shadow-[0_6px_18px_rgba(37,99,235,0.05)]"><div className="absolute inset-y-0 left-0 w-1 bg-[#2563eb]" /><div className="flex items-start justify-between gap-3"><p className="text-[11px] font-bold uppercase tracking-[0.45px] text-[#5f5e5e]">{label}</p><MetricIcon kind={icon} /></div><p className="my-2 text-3xl font-black tracking-[-0.4px]">{value == null ? '—' : typeof value === 'number' ? value.toLocaleString() : value}</p><p className="text-xs text-[#5f5e5e]">{note}</p></div>)}</div>
    {data && <p className="mt-3 text-xs">Catalog on hand: {data.catalog_on_hand} · Reserved: {data.reserved_units} · Available: {data.available_units} · Legacy stock awaiting SKU mapping: {data.legacy_units}</p>}
    {fulfillment && data && <div className="mt-4 overflow-auto"><table className="w-full bg-white text-left text-sm"><caption className="py-2 text-left font-semibold">Orders by workshop</caption><thead><tr>{['Workshop', 'Pending', 'In transit', 'Delivered', 'Total'].map(h => <th className="p-2" key={h}>{h}</th>)}</tr></thead><tbody>{data.workshops.map(w => <tr key={w.name}><td className="p-2">{w.name}</td><td>{w.pending}</td><td>{w.in_transit}</td><td>{w.delivered}</td><td>{w.total}</td></tr>)}</tbody></table>{!data.workshops.length && <p className="p-3 text-sm">No workshops yet.</p>}</div>}
  </section>
}
