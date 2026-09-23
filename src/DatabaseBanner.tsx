import { useEffect, useState } from 'react'

export default function DatabaseBanner() {
  const [environment, setEnvironment] = useState<{ database_name: string; contains_synthetic_stock: boolean } | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 10000)
    fetch('/api/environment', { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('Environment unavailable')
      return response.json()
    }).then(setEnvironment).catch(() => {}).finally(() => window.clearTimeout(timer))
    return () => { controller.abort(); window.clearTimeout(timer) }
  }, [])
  if (!environment?.contains_synthetic_stock) return null
  return <div role="status" className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"><strong>Synthetic stock demo</strong> · {environment.database_name}. Quantities and generated fitments are demonstration data. Claims and orders shown belong to this database.</div>
}
