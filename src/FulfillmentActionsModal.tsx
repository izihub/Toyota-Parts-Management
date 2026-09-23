import { useEffect, useState } from 'react'
import { catalogRequest, type CatalogItem } from './catalog'

type Line = { id: number; name: string; sku: string; qty: number; catalog_item_id: number | null; reserved_quantity: number; reserved_warehouse: string | null }
type Order = { id: string; status: string; parts: Line[] }
type Suggestion = { source_line_id: number; part_name: string; vehicle_model: string; make_year: number; suggested_quantity: number; confidence_pct: number; lift: number; rule_version: string }
const field = 'rounded border p-2 text-sm'

export default function FulfillmentActionsModal({ orderId, onClose, onUpdated }: { orderId: string; onClose: () => void; onUpdated: () => void }) {
  const id = orderId.replace('fulfill-', '')
  const [order, setOrder] = useState<Order>()
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [warehouses, setWarehouses] = useState<Array<{ name: string }>>([])
  const [warehouse, setWarehouse] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function load() {
    const [orders, items, places, recommendations] = await Promise.all([
      catalogRequest<Order[]>('/api/fulfillment'), catalogRequest<CatalogItem[]>('/api/catalog'),
      catalogRequest<Array<{ name: string }>>('/api/warehouses'), catalogRequest<Suggestion[]>(`/api/fulfillment/${id}/companions`),
    ])
    setOrder(orders.find(item => item.id === orderId)); setCatalog(items); setWarehouses(places); setSuggestions(recommendations)
    setWarehouse(current => current || places[0]?.name || '')
  }
  useEffect(() => { void load().catch(e => setError(String(e))) }, [orderId])
  async function act(action: () => Promise<unknown>) {
    setBusy(true); setError('')
    try { await action(); await load(); onUpdated() } catch (e) { setError(String(e)) } finally { setBusy(false) }
  }
  async function transition(status: string) {
    const response = await fetch(`/api/fulfillment/${id}?status=${encodeURIComponent(status)}`, { method: 'PATCH' })
    if (!response.ok) throw new Error((await response.json()).detail || 'Status update failed')
  }
  const reserved = order?.parts.some(line => line.reserved_quantity > 0)
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><section role="dialog" aria-modal="true" aria-label="Fulfillment stock and companions" className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded bg-white p-6">
    <div className="flex justify-between"><h2 className="font-bold">Stock & companions · {orderId}</h2><button disabled={busy} onClick={onClose}>Close</button></div>
    {error && <p role="alert" className="my-3 text-red-700">{error}</p>}
    <p className="my-3">{order?.status || 'Loading…'}</p>
    <fieldset disabled={busy} className="space-y-4 disabled:opacity-60">
      {order?.parts.map(line => <div key={line.id} className="rounded border p-3"><p>{line.name} · {line.qty} units · {line.catalog_item_id ? line.sku : 'SKU mapping required'}</p>
        {line.reserved_quantity > 0 && <p>Reserved: {line.reserved_quantity} at {line.reserved_warehouse}</p>}
        {!line.catalog_item_id && order.status === 'PENDING' && <form className="mt-2 flex gap-2" onSubmit={event => {
          event.preventDefault(); const data = new FormData(event.currentTarget); const [sku, vehicle_model, make_year] = JSON.parse(String(data.get('fitment')))
          void act(() => catalogRequest(`/api/fulfillment/${id}/lines/${line.id}/catalog`, { sku, vehicle_model, make_year }))
        }}><select name="fitment" required aria-label={`SKU and fitment for ${line.name}`} className={field} defaultValue=""><option value="">Choose verified SKU / fitment</option>{catalog.flatMap(item => item.fitments.map(fit => <option key={`${item.sku}-${fit.model}-${fit.make_year}`} value={JSON.stringify([item.sku, fit.model, fit.make_year])}>{item.sku} · {item.part_name} · {fit.model} {fit.make_year}</option>))}</select><button className={field}>Map SKU</button></form>}
      </div>)}
      {order?.status === 'PENDING' && <>
        <div className="flex flex-wrap gap-2"><select aria-label="Reservation warehouse" className={field} value={warehouse} onChange={e => setWarehouse(e.target.value)}>{warehouses.map(w => <option key={w.name}>{w.name}</option>)}</select>
          <button className={field} disabled={!warehouse || reserved} onClick={() => void act(() => catalogRequest(`/api/fulfillment/${id}/reserve`, { warehouse_name: warehouse }))}>Reserve all stock</button>
          <button className={field} disabled={!reserved} onClick={() => void act(() => catalogRequest(`/api/fulfillment/${id}/release`, {}))}>Release reservation</button>
          <button className={field} disabled={!reserved} onClick={() => void act(() => transition('IN TRANSIT'))}>Dispatch</button></div>
        <h3 className="font-semibold">Suggested missing companions</h3><p className="text-sm">Review quantities and prices before adding. Release reservations before changing lines.</p>
        {suggestions.length === 0 && <p className="text-sm">No missing companions for the mapped lines.</p>}
        {suggestions.map(s => <Companion key={`${s.source_line_id}-${s.part_name}`} suggestion={s} catalog={catalog} disabled={!!reserved} save={body => act(() => catalogRequest(`/api/fulfillment/${id}/companions`, body))} />)}
      </>}
      {order?.status === 'IN TRANSIT' && <button className={field} onClick={() => void act(() => transition('FULFILLED'))}>Confirm delivery</button>}
    </fieldset>
  </section></div>
}

function Companion({ suggestion: s, catalog, disabled, save }: { suggestion: Suggestion; catalog: CatalogItem[]; disabled: boolean; save: (body: unknown) => Promise<void> }) {
  const [request, setRequest] = useState({ fingerprint: '', key: crypto.randomUUID() })
  const items = catalog.filter(item => item.part_name === s.part_name && item.fitments.some(fit => fit.model === s.vehicle_model && fit.make_year === s.make_year))
  return <form className="space-y-2 rounded border p-3" onSubmit={event => {
    event.preventDefault(); const data = new FormData(event.currentTarget)
    const body = { source_line_id: s.source_line_id, part_name: s.part_name, rule_version: s.rule_version, sku: data.get('sku'), quantity: Number(data.get('quantity')), unit_price: Number(data.get('price')) }
    const fingerprint = JSON.stringify(body); const key = request.fingerprint === fingerprint ? request.key : crypto.randomUUID()
    setRequest({ fingerprint, key }); void save({ ...body, request_key: key })
  }}><p>{s.part_name} · {s.vehicle_model} {s.make_year}</p><p className="text-sm">Association confidence {s.confidence_pct}% · Lift {s.lift.toFixed(2)}</p>
    <fieldset disabled={disabled} className="flex flex-wrap gap-2"><select name="sku" required aria-label="Companion SKU" className={field} defaultValue=""><option value="">Choose compatible SKU</option>{items.map(item => <option key={item.sku}>{item.sku}</option>)}</select><input aria-label="Companion quantity" name="quantity" type="number" min="1" step="1" required defaultValue={s.suggested_quantity} className={`${field} w-24`} /><input aria-label="Companion unit price" placeholder="Unit price" name="price" type="number" min="0" step="0.01" required className={`${field} w-32`} /><button disabled={!items.length} className={field}>Add companion</button></fieldset>
    {!items.length && <p className="text-sm">Create a compatible SKU in Catalog setup first.</p>}
  </form>
}
