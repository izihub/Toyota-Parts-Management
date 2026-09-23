import { useEffect, useState } from 'react'
import { catalogRequest, type CatalogItem } from './catalog'

export default function CatalogManager({ onUpdated }: { onUpdated?: () => void }) {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ sku: '', part_name: '', display_name: '', model: '', year: '', aliases: '' })
  const [stock, setStock] = useState({ sku: '', fitment: '', quantity: '', warehouse: '' })
  const load = () => catalogRequest<CatalogItem[]>('/api/catalog').then(setItems).catch(error => setMessage(String(error)))
  useEffect(() => { void load() }, [])
  const inputClass = 'rounded border border-[#e9bcb7] bg-[#f8f4f3] p-2 text-sm text-[#1b1c1c]'
  async function saveCatalog(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      await catalogRequest('/api/catalog', { sku: form.sku, part_name: form.part_name, display_name: form.display_name, fitments: [{ model: form.model, make_year: Number(form.year) }], aliases: form.aliases.split(',').map(alias => alias.trim()).filter(Boolean) })
      await load()
      onUpdated?.()
      setMessage('Catalog SKU and fitment saved. Repeat the same SKU and description to add another fitment.')
    } catch (error) { setMessage(String(error)) }
    finally { setBusy(false) }
  }
  async function addStock(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    const item = items.find(item => item.sku === stock.sku)
    const fitment = item?.fitments.find(f => `${f.model}|${f.make_year}` === stock.fitment)
    if (!item || !fitment) { setMessage('Select a SKU and a cataloged vehicle fitment.'); return }
    setBusy(true)
    try {
      await catalogRequest('/api/stock', [{ sku: item.sku, part_name: item.part_name, vehicle_model: fitment.model, make_year: fitment.make_year, quantity: Number(stock.quantity), warehouse_name: stock.warehouse }])
      onUpdated?.()
      setStock(current => ({ ...current, quantity: '' }))
      setMessage('Stock saved against the selected SKU and warehouse.')
    } catch (error) { setMessage(String(error)) }
    finally { setBusy(false) }
  }
  return <details className="mb-5 rounded border border-[#e9bcb7] bg-white p-4 text-[#1b1c1c]">
    <summary className="cursor-pointer font-bold">Part catalog and SKU stock</summary>
    <p className="my-3 text-sm text-[#5f5e5e]">Enter verified part numbers and exact vehicle fitments from your parts catalog. Existing stock without a SKU remains unmapped.</p>
    <form onSubmit={saveCatalog} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {([['sku', 'Orderable SKU / part number'], ['part_name', 'ML part label (e.g. FRONT BUMPER)'], ['display_name', 'Catalog description'], ['model', 'Exact vehicle variant'], ['year', 'Compatible make year'], ['aliases', 'Part-label aliases (comma separated, optional)']] as const).map(([key, label]) => <label key={key} className="flex flex-col gap-1 text-xs">{label}<input required={key !== 'aliases'} disabled={busy} type={key === 'year' ? 'number' : 'text'} min={key === 'year' ? 1886 : undefined} max={key === 'year' ? 2100 : undefined} value={form[key]} onChange={event => setForm(current => ({ ...current, [key]: event.target.value }))} className={inputClass} /></label>)}
      <button disabled={busy} className="rounded bg-[#bd0014] p-2 text-sm text-white disabled:opacity-50">Save catalog entry</button>
    </form>
    <form onSubmit={addStock} className="mt-5 grid gap-3 border-t border-[#e9bcb7] pt-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="flex flex-col gap-1 text-xs">Stock SKU<select required disabled={busy} value={stock.sku} onChange={event => setStock(current => ({ ...current, sku: event.target.value, fitment: '' }))} className={inputClass}><option value="">Choose SKU</option>{items.map(item => <option key={item.sku} value={item.sku}>{item.sku} - {item.part_name}</option>)}</select></label>
      <label className="flex flex-col gap-1 text-xs">Fitment<select required disabled={busy} value={stock.fitment} onChange={event => setStock(current => ({ ...current, fitment: event.target.value }))} className={inputClass}><option value="">Choose fitment</option>{items.find(item => item.sku === stock.sku)?.fitments.map(f => <option key={`${f.model}|${f.make_year}`} value={`${f.model}|${f.make_year}`}>{f.model} ({f.make_year})</option>)}</select></label>
      <label className="flex flex-col gap-1 text-xs">Warehouse<input required disabled={busy} value={stock.warehouse} onChange={event => setStock(current => ({ ...current, warehouse: event.target.value }))} className={inputClass} /></label>
      <label className="flex flex-col gap-1 text-xs">Quantity<input required disabled={busy} type="number" min="1" step="1" value={stock.quantity} onChange={event => setStock(current => ({ ...current, quantity: event.target.value }))} className={inputClass} /></label>
      <button disabled={busy} className="rounded bg-[#bd0014] p-2 text-sm text-white disabled:opacity-50">Add SKU stock</button>
    </form>
    {message && <p role="status" className="mt-3 text-sm">{message}</p>}
    <p className="mt-3 text-xs text-[#5f5e5e]">{items.length} cataloged SKUs. Fitment does not imply a supplier price or stock availability.</p>
  </details>
}
