import { useEffect, useState } from 'react'
import { catalogRequest } from './catalog'

type Metrics = {
  scope: string; as_of: string; pending_claims: number; unreviewed_predictions: number;
  approved_predictions: number; catalog_on_hand: number; reserved_units: number; available_units: number;
  legacy_units: number; pending_orders: number; in_transit_orders: number; delivered_orders: number;
  total_orders: number; delivery_rate: number | null;
  workshops: Array<{ name: string; total: number; pending: number; in_transit: number; delivered: number }>;
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
  const cards: Array<[string, number | string | null | undefined, string]> = fulfillment ? [
    ['Pending orders', data?.pending_orders, 'Awaiting dispatch'], ['In transit', data?.in_transit_orders, 'Dispatched, awaiting delivery'],
    ['Delivered', data?.delivered_orders, 'Confirmed deliveries'], ['Delivery rate', data?.delivery_rate == null ? null : `${data.delivery_rate}%`, 'Delivered / all fulfillment orders'],
  ] : [
    ['Unreviewed part predictions', data?.unreviewed_predictions, 'Part occurrences, not forecast units'],
    ['Approved part predictions', data?.approved_predictions, 'All-time reviewer approvals'],
    ['Available SKU units', data?.available_units, 'Catalog stock minus reservations'],
  ]
  return <section className="my-5" aria-label="Operational metrics">
    <div className="mb-3 flex flex-wrap justify-between gap-2 text-xs"><p>{data ? `${data.scope} · Updated ${new Date(data.as_of).toLocaleTimeString()}` : error || 'Loading metrics…'}</p><button className="underline" onClick={() => setRevision(v => v + 1)}>Refresh metrics</button></div>
    {error && <p role="alert" className="mb-2 text-sm text-red-700">Metrics unavailable. Retry using Refresh metrics.</p>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, note]) => <div key={label} className="rounded border border-[#e9bcb7] bg-white p-4"><p className="text-sm">{label}</p><p className="my-2 text-3xl font-bold">{value == null ? '—' : typeof value === 'number' ? value.toLocaleString() : value}</p><p className="text-xs text-[#5f5e5e]">{note}</p></div>)}</div>
    {data && <p className="mt-3 text-xs">Catalog on hand: {data.catalog_on_hand} · Reserved: {data.reserved_units} · Available: {data.available_units} · Legacy stock awaiting SKU mapping: {data.legacy_units}</p>}
    {fulfillment && data && <div className="mt-4 overflow-auto"><table className="w-full bg-white text-left text-sm"><caption className="py-2 text-left font-semibold">Orders by workshop</caption><thead><tr>{['Workshop', 'Pending', 'In transit', 'Delivered', 'Total'].map(h => <th className="p-2" key={h}>{h}</th>)}</tr></thead><tbody>{data.workshops.map(w => <tr key={w.name}><td className="p-2">{w.name}</td><td>{w.pending}</td><td>{w.in_transit}</td><td>{w.delivered}</td><td>{w.total}</td></tr>)}</tbody></table>{!data.workshops.length && <p className="p-3 text-sm">No workshops yet.</p>}</div>}
  </section>
}
