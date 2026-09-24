import { useEffect, useRef, useState } from 'react'
import { catalogRequest, type CatalogItem } from './catalog'

type Purchase = { id: number; order_number: string; status: string }
type Movement = { id: number; warehouse_name: string; sku: string; kind: string; quantity_delta: number; reservation_delta: number; created_at: string }
export default function InventoryOperations() {
  const [orders, setOrders] = useState<Purchase[]>([])
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [warehouses, setWarehouses] = useState<Array<{ name: string }>>([])
  const [movements, setMovements] = useState<Movement[]>([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const retry = useRef({ body: '', key: '' })
  async function load() {
    const [purchases, items, places, ledger] = await Promise.all([catalogRequest<Purchase[]>('/api/orders'), catalogRequest<CatalogItem[]>('/api/catalog'), catalogRequest<Array<{ name: string }>>('/api/warehouses'), catalogRequest<Movement[]>('/api/inventory/movements')])
    setOrders([...new Map(purchases.filter(p => p.status === 'SUBMITTED').map(p => [p.id, p])).values()]); setCatalog(items); setWarehouses(places); setMovements(ledger)
  }
  useEffect(() => { void load().catch(e => setMessage(String(e))) }, [])
  async function save(url: string, body: unknown) {
    setBusy(true); setMessage('')
    try { await catalogRequest(url, body); await load(); setMessage('Inventory updated.') } catch (e) { setMessage(String(e)) } finally { setBusy(false) }
  }
  const controlClasses = 'rounded border border-[#e9bcb7] bg-[#f8f4f3] p-2 text-[#1b1c1c] outline-none focus:border-[#bd0014]'
  const places = <select name="warehouse_name" required aria-label="Warehouse" className={controlClasses}><option value="">Warehouse</option>{warehouses.map(w => <option key={w.name}>{w.name}</option>)}</select>
  return <details className="m-4 rounded border border-[#e9bcb7] bg-white p-4 text-[#1b1c1c]" onToggle={e => { if (e.currentTarget.open) void load().catch(error => setMessage(String(error))) }}><summary className="cursor-pointer font-semibold">Purchase receipts, adjustments & movement history</summary>
    <p role="status" className="my-2 text-sm">{message}</p><fieldset disabled={busy} className="space-y-4">
      <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); void save(`/api/orders/${data.get('order')}/receive`, { warehouse_name: data.get('warehouse_name') }) }}>
        <select name="order" required aria-label="Submitted purchase order" className={controlClasses}><option value="">Submitted purchase order</option>{orders.map(o => <option key={o.id} value={o.id}>{o.order_number}</option>)}</select>{places}<button className={`${controlClasses} bg-white font-semibold`}>Receive full order</button>
      </form>
      <form className="flex flex-wrap gap-2" onSubmit={e => {
        e.preventDefault(); const data = new FormData(e.currentTarget); const body = { warehouse_name: data.get('warehouse_name'), sku: data.get('sku'), quantity_delta: Number(data.get('quantity')), reason: data.get('reason') }
        const fingerprint = JSON.stringify(body); if (retry.current.body !== fingerprint) retry.current = { body: fingerprint, key: crypto.randomUUID() }
        void save('/api/inventory/adjust', { ...body, request_key: retry.current.key })
      }}><select name="sku" required aria-label="Adjustment SKU" className={controlClasses}><option value="">SKU</option>{catalog.map(c => <option key={c.sku}>{c.sku}</option>)}</select>{places}<input name="quantity" required type="number" step="1" placeholder="Signed quantity" aria-label="Signed adjustment quantity" className={`w-36 ${controlClasses}`} /><input name="reason" required maxLength={500} placeholder="Adjustment reason" aria-label="Adjustment reason" className={controlClasses} /><button className={`${controlClasses} bg-white font-semibold`}>Record adjustment</button></form>
      <button className="text-sm underline" type="button" onClick={() => void load().catch(e => setMessage(String(e)))}>Refresh history</button>
      <div className="max-h-64 overflow-auto"><table className="w-full text-left text-xs"><thead className="bg-[#efeded]"><tr>{['Time', 'Warehouse', 'SKU', 'Event', 'Stock change', 'Reservation change'].map(h => <th key={h} className="border-b border-[#e9bcb7] p-2">{h}</th>)}</tr></thead><tbody>{movements.map(m => <tr key={m.id} className="border-b border-[#e9bcb7]"><td className="p-2">{m.created_at}</td><td>{m.warehouse_name}</td><td>{m.sku}</td><td>{m.kind}</td><td>{m.quantity_delta}</td><td>{m.reservation_delta}</td></tr>)}</tbody></table>{!movements.length && <p className="py-2 text-sm text-[#5f5e5e]">No inventory movements recorded yet.</p>}</div>
    </fieldset></details>
}
