import { useEffect, useRef, useState } from 'react'
import rules from './real_warehouse_synergy_rules.json'
import rulesText from './real_warehouse_synergy_rules.json?raw'
import { getCompanionBundle, type Companion, type DraftLine } from './purchase'

type Choice = Companion & { selected: boolean; quantity: number }
type Bundle = { part: string; qty: number; choices: Choice[]; version: string; mode: 'online' | 'offline' }
const primaryParts = [...new Set(rules.map(rule => rule.antecedent))].sort()

export default function ReorderBundleModal({ onClose, onAddBundle }: { onClose: () => void; onAddBundle: (lines: DraftLine[]) => void }) {
  const [part, setPart] = useState('FRONT BUMPER')
  const [qty, setQty] = useState(20)
  const [includePrimary, setIncludePrimary] = useState(true)
  const [bundle, setBundle] = useState<Bundle | null>(null)
  const [error, setError] = useState('')
  const added = useRef(false)
  const valid = Number.isInteger(qty) && qty > 0
  const current = bundle?.part === part && bundle.qty === qty ? bundle : null

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    setBundle(null)
    setError('')
    if (!valid) return () => controller.abort()
    async function load() {
      let companions: Companion[], version: string, mode: 'online' | 'offline'
      try {
        const response = await fetch(`/api/reorder-bundle?primary_part=${encodeURIComponent(part)}&quantity=${qty}`, { signal: controller.signal })
        if (!response.ok) throw new Error('Bundle unavailable')
        const data = await response.json()
        if (!Array.isArray(data.companions) || typeof data.rule_version !== 'string') throw new Error('Missing rule release')
        companions = data.companions
        version = data.rule_version
        mode = 'online'
      } catch {
        if (!active) return
        companions = getCompanionBundle(rules, part, qty)
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rulesText.replace(/\r\n/g, '\n')))
        version = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
        mode = 'offline'
      }
      if (active) setBundle({ part, qty, version, mode, choices: companions.map(item => ({ ...item, selected: false, quantity: item.suggestedOrderQty })) })
    }
    void load().catch(() => { if (active) setError('Could not load recommendations. Close and reopen the advisor to retry.') })
    return () => { active = false; controller.abort() }
  }, [part, qty, valid])

  const selected = current?.choices.filter(choice => choice.selected) ?? []
  const canAdd = valid && current && (includePrimary || selected.length > 0) && selected.every(choice => Number.isInteger(choice.quantity) && choice.quantity > 0)
  function addBundle() {
    if (!canAdd || !current || added.current) return
    added.current = true
    const entries = [...(includePrimary ? [{ name: part, quantity: qty }] : []), ...selected.map(choice => ({ name: choice.companionPart, quantity: choice.quantity }))]
    onAddBundle(entries.map(entry => ({ id: crypto.randomUUID(), part: entry.name, qty: entry.quantity, supplier: '', vehicle: '', unitPrice: null, source: { kind: 'bundle', primary_part: part, rule_version: current.version, mode: current.mode } })))
    onClose()
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <section role="dialog" aria-modal="true" aria-labelledby="bundle-title" className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl border border-[#e9bcb7] bg-white p-6 text-[#1b1c1c] shadow-2xl">
      <h3 id="bundle-title" className="text-xl font-black">Companion bundle advisor</h3>
      <p className="mt-2 text-sm text-[#5f5e5e]">Select the parts to add and review suggested quantities. Supplier, vehicle compatibility and prices are completed in the purchase draft.</p>
      <div className="my-4 flex flex-wrap gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm">Primary part<select value={part} onChange={event => setPart(event.target.value)} className="rounded border border-[#e9bcb7] bg-[#f8f4f3] p-2">{primaryParts.map(name => <option key={name}>{name}</option>)}</select></label>
        <label className="flex w-28 flex-col gap-1 text-sm">Quantity<input type="number" min="1" step="1" value={qty || ''} onChange={event => setQty(Number(event.target.value))} className="rounded border border-[#e9bcb7] bg-[#f8f4f3] p-2" /></label>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includePrimary} onChange={event => setIncludePrimary(event.target.checked)} />Include primary part ({qty || 0} units)</label>
      {!valid && <p role="alert" className="mt-3 text-sm text-[#bd0014]">Enter a positive whole quantity.</p>}
      {error && <p role="alert" className="mt-3 text-sm text-[#bd0014]">{error}</p>}
      {valid && !current && !error && <p role="status" className="py-4">Loading recommendations...</p>}
      {current && <>
        <p className="mt-4 text-xs text-[#5f5e5e]">{current.mode === 'offline' ? 'Offline recommendations from bundled rules' : 'Recommendations from the service'} · Rule release <span title={current.version}>{current.version.slice(0, 12)}</span></p>
        {!current.choices.length && <p className="py-4 text-sm">No companion rules match this part. You can still add the primary part.</p>}
        <div className="my-3 divide-y divide-[#e9bcb7]">{current.choices.map((choice, index) => <div key={choice.companionPart} className="flex items-center justify-between gap-4 py-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={choice.selected} onChange={event => setBundle(value => value && ({ ...value, choices: value.choices.map((item, i) => i === index ? { ...item, selected: event.target.checked } : item) }))} /><span>{choice.companionPart}<span className="block text-xs text-[#5f5e5e]">{choice.confidencePct}% co-occurrence · {choice.lift}x lift · Suggested {choice.suggestedOrderQty}</span></span></label>
          <input aria-label={`Quantity for ${choice.companionPart}`} type="number" min="1" step="1" value={choice.quantity || ''} onChange={event => setBundle(value => value && ({ ...value, choices: value.choices.map((item, i) => i === index ? { ...item, quantity: Number(event.target.value) } : item) }))} className="w-24 rounded border border-[#e9bcb7] bg-[#f8f4f3] p-2" />
        </div>)}</div>
      </>}
      <div className="mt-5 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded border border-[#e9bcb7] px-4 py-2">Cancel</button><button type="button" disabled={!canAdd} onClick={addBundle} className="rounded bg-[#bd0014] px-4 py-2 text-white disabled:opacity-50">Add selected parts to draft</button></div>
    </section>
  </div>
}
