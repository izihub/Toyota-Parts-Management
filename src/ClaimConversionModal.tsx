import { useEffect, useRef, useState } from 'react'
import type { Claim } from './prediction'
import { catalogRequest, type CatalogItem } from './catalog'
import CatalogManager from './CatalogManager'

export default function ClaimConversionModal({ onClose, onSaved }: { onClose: () => void; onSaved: (message: string) => void }) {
  const [claims, setClaims] = useState<Claim[]>([])
  const [items, setItems] = useState<CatalogItem[]>([])
  const [workshops, setWorkshops] = useState<Array<{name: string}>>([])
  const [claimId, setClaimId] = useState('')
  const [workshop, setWorkshop] = useState('')
  const [lines, setLines] = useState<Record<string, {sku: string; quantity: string; price: string}>>({})
  const [message, setMessage] = useState('Loading reviewed claims and catalog...')
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  const load = async () => {
    try {
      const [claims, catalog, workshops] = await Promise.all([catalogRequest<Claim[]>('/api/claims?status=APPROVED'), catalogRequest<CatalogItem[]>('/api/catalog'), catalogRequest<Array<{name: string}>>('/api/workshops')])
      setClaims(claims); setItems(catalog); setWorkshops(workshops)
      setMessage(claims.length ? '' : 'No approved claims are available. Complete claim review first.')
    } catch (error) { setMessage(String(error)) }
  }
  useEffect(() => { void load() }, [])
  const claim = claims.find(row => row.id === claimId)
  const accepted = claim?.parts.filter(part => part.human_action === 'APPROVED') ?? []
  const inputClass = 'rounded border border-[#e9bcb7] bg-[#f8f4f3] p-2 text-sm'
  async function convert(event: React.FormEvent) {
    event.preventDefault()
    if (lock.current || !claim) return
    if (!accepted.length || accepted.some(part => !lines[part.name]?.sku || !Number.isInteger(Number(lines[part.name]?.quantity)) || Number(lines[part.name]?.quantity) <= 0 || !lines[part.name]?.price.trim() || !Number.isFinite(Number(lines[part.name]?.price)) || Number(lines[part.name]?.price) < 0)) { setMessage('Choose a compatible SKU and enter quantity and unit price for every approved part.'); return }
    lock.current = true; setBusy(true)
    try {
      const result = await catalogRequest<{id: string; replayed: boolean}>(`/api/claims/${encodeURIComponent(claim.id)}/fulfillment-draft`, { workshop_name: workshop, lines: accepted.map(part => ({ part_name: part.name, sku: lines[part.name].sku, quantity: Number(lines[part.name].quantity), unit_price: Number(lines[part.name].price) })) })
      onSaved(`${result.id} ${result.replayed ? 'already exists' : 'created'} for ${claim.id}. Open Inventory & Fulfillment, then Manage stock & companions to reserve and dispatch.`)
      onClose()
    } catch (error) { setMessage(`${String(error)}. Retrying identical details will not duplicate a converted claim.`) }
    finally { lock.current = false; setBusy(false) }
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><section role="dialog" aria-modal="true" aria-labelledby="conversion-title" className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-xl bg-white p-6 text-[#1b1c1c]">
    <h3 id="conversion-title" className="mb-3 text-xl font-bold">Create fulfillment from reviewed claim</h3>
    <p className="mb-4 text-sm text-[#5f5e5e]">All accepted parts are included. Select verified fitments and explicit quantities and prices. One fulfillment order can be created per claim.</p>
    <CatalogManager onUpdated={() => void load()} />
    <form onSubmit={convert} className="space-y-4">
      <label className="flex flex-col gap-1 text-sm">Reviewed claim<select required disabled={busy} value={claimId} onChange={event => {setClaimId(event.target.value); setLines({})}} className={inputClass}><option value="">Choose claim</option>{claims.map(row => <option key={row.id} value={row.id} disabled={!!row.fulfillment_order_id}>{row.id} - {row.vehicle} ({row.year}){row.fulfillment_order_id ? ` - Linked to fulfill-${row.fulfillment_order_id}` : ''}</option>)}</select></label>
      <label className="flex flex-col gap-1 text-sm">Destination workshop<select required disabled={busy} value={workshop} onChange={event => setWorkshop(event.target.value)} className={inputClass}><option value="">Choose workshop</option>{workshops.map(row => <option key={row.name}>{row.name}</option>)}</select></label>
      {!workshops.length && <p className="text-sm">Add a workshop in Inventory &amp; Fulfillment before converting.</p>}
      {accepted.map(part => {
        const options = items.filter(item => item.part_name === part.name && item.fitments.some(f => f.model === claim?.vehicle && f.make_year === claim?.year))
        const line = lines[part.name] || {sku: '', quantity: '', price: ''}
        const update = (field: keyof typeof line, value: string) => setLines(current => ({ ...current, [part.name]: { ...line, [field]: value } }))
        return <div key={part.name} className="grid gap-2 border-t border-[#e9bcb7] pt-3 sm:grid-cols-[2fr_1fr_1fr]">
          <label className="flex flex-col gap-1 text-sm">{part.name}<select required disabled={busy} value={line.sku} onChange={event => update('sku', event.target.value)} className={inputClass}><option value="">{options.length ? 'Choose compatible SKU' : 'No cataloged fitment - add it above'}</option>{options.map(item => <option key={item.sku}>{item.sku}</option>)}</select></label>
          <label className="flex flex-col gap-1 text-sm">Quantity<input required disabled={busy} type="number" min="1" step="1" value={line.quantity} onChange={event => update('quantity', event.target.value)} className={inputClass} /></label>
          <label className="flex flex-col gap-1 text-sm">Unit price (LKR)<input required disabled={busy} type="number" min="0" step="0.01" value={line.price} onChange={event => update('price', event.target.value)} className={inputClass} /></label>
        </div>
      })}
      {message && <p role="status" className="text-sm">{message}</p>}
      <div className="flex justify-end gap-3"><button type="button" disabled={busy} onClick={onClose} className="rounded border px-4 py-2">Close</button><button disabled={busy || !claim || !accepted.length} className="rounded bg-[#bd0014] px-4 py-2 text-white disabled:opacity-50">{busy ? 'Creating...' : 'Create fulfillment order'}</button></div>
    </form>
  </section></div>
}
