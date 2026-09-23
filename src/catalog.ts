export interface Fitment { model: string; make_year: number }
export interface CatalogItem { id: number; sku: string; part_name: string; display_name: string; fitments: Fitment[] }

export async function catalogRequest<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, body === undefined ? undefined : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(typeof error?.detail === 'string' ? error.detail : `Request failed (${response.status}). Check the supplied fields.`)
  }
  return response.json()
}
