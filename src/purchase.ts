export interface DraftLine {
  id: string
  supplier: string
  vehicle: string
  part: string
  qty: number
  unitPrice: number | null
  sku?: string
  vehicle_model?: string
  make_year?: number
  source: { kind: 'manual' | 'bundle'; primary_part?: string; rule_version?: string; mode?: 'online' | 'offline' }
}

export interface SynergyRule {
  antecedent: string
  consequent: string
  confidence: number
  lift: number
}

export interface Companion {
  companionPart: string
  lift: number
  suggestedOrderQty: number
  confidencePct: number
}

export function getCompanionBundle(rules: SynergyRule[], part: string, qty: number): Companion[] {
  if (!Number.isInteger(qty) || qty <= 0) return []
  return rules.filter(rule => rule.antecedent === part.trim().toUpperCase() && rule.consequent !== rule.antecedent)
    .map(rule => ({ companionPart: rule.consequent, lift: rule.lift, suggestedOrderQty: Math.max(1, Math.ceil(qty * rule.confidence)), confidencePct: Math.floor(rule.confidence * 100 + 0.5) }))
    .sort((a, b) => b.lift - a.lift || (a.companionPart < b.companionPart ? -1 : a.companionPart > b.companionPart ? 1 : 0))
}

export function draftError(rows: DraftLine[], shipping: number): string | null {
  if (!rows.length) return 'Add at least one order line.'
  if (!Number.isFinite(shipping) || shipping < 0) return 'Shipping must be a nonnegative amount.'
  if (rows.some(row => !row.part.trim() || !row.supplier.trim() || !row.vehicle.trim() || !Number.isInteger(row.qty) || row.qty <= 0 || row.unitPrice === null || !Number.isFinite(row.unitPrice) || row.unitPrice < 0)) {
    return 'Complete supplier, vehicle compatibility, positive whole quantity and unit price for every line before saving.'
  }
  if (rows.some(row => row.source.kind === 'bundle' && !row.sku)) return 'Choose a catalog SKU and verified vehicle fitment for every bundle line.'
  if (rows.some(row => row.sku && (!row.vehicle_model || !row.make_year))) return 'Select the vehicle fitment for every catalog line.'
  const names = rows.map(row => row.sku ? JSON.stringify([row.sku.trim().toUpperCase(), row.supplier.trim().toUpperCase(), row.vehicle_model, row.make_year]) : row.part.trim().toUpperCase())
  if (new Set(names).size !== names.length) return 'Resolve repeated lines for the same part/SKU, supplier and fitment before saving.'
  return null
}
