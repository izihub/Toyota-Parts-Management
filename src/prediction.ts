export interface ClaimPart {
  name: string
  confidence_pct: number
  urgency: string
  threshold: number | null
  human_action: 'APPROVED' | 'REJECTED' | null
}

export interface Claim {
  id: string
  date: string
  vehicle: string
  year: number
  damage_zone: string | null
  status: string
  model_version: string | null
  fulfillment_order_id?: number | null
  parts: ClaimPart[]
}

export interface ModelMetadata {
  model_version: string
  vehicle_models: string[]
  damage_zones: string[]
  min_year: number
  max_year: number
}

export interface IntakeResponse {
  accident_id: string
  vehicle: string
  damage_zone: string
  model_version: string
  predicted_parts: Array<{part_name: string; confidence_pct: number; urgency: string; threshold: number}>
}

export function averageScore(claim: Claim): number | null {
  return claim.parts.length ? claim.parts.reduce((sum, part) => sum + part.confidence_pct, 0) / claim.parts.length : null
}

export function scoreLevel(score: number) {
  return score >= 80 ? 'High' : score >= 50 ? 'Medium' : 'Low'
}

export interface PendingIntake {
  body: string
  key: string
}

export function readPendingIntake(storageKey: string): PendingIntake | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null')
    if (!saved || typeof saved.body !== 'string' || typeof saved.key !== 'string') return null
    const body = JSON.parse(saved.body)
    return typeof body.model === 'string' && Number.isInteger(body.make_year) && typeof body.damage_zone === 'string' ? saved : null
  } catch { return null }
}
