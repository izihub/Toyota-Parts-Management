import { useEffect, useState } from 'react'
import { catalogRequest } from './catalog'
import { scoreLevel, type Claim } from './prediction'

export default function ApprovedPredictions() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let active = true
    async function load() {
      try {
        const data = await catalogRequest<Claim[]>('/api/claims?status=ALL')
        if (active) { setClaims(data); setError('') }
      } catch { if (active) setError('Could not load claims. Please refresh to retry.') }
      finally { if (active) setLoading(false) }
    }
    setLoading(true)
    void load()
    const timer = window.setInterval(() => void load(), 15000)
    const refresh = () => void load()
    window.addEventListener('focus', refresh)
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', refresh) }
  }, [revision])
  const pending = claims.filter(claim => claim.status === 'PENDING')
  const approved = claims.flatMap(claim => claim.parts.filter(part => part.human_action === 'APPROVED').map(part => ({ claim, part })))
  const rejected = claims.filter(claim => claim.status === 'REJECTED')
  const claimRows = tab === 'pending' ? pending : rejected
  return <section className="my-5 rounded border border-[#e9bcb7] bg-white p-4">
    <div className="flex justify-between gap-3"><h3 className="font-semibold">Claim review status</h3><button className="text-sm underline" onClick={() => setRevision(value => value + 1)}>Refresh claims</button></div>
    <div className="my-3 flex flex-wrap gap-2" aria-label="Claim views">
      {([
        ['pending', 'Pending claims', pending.length],
        ['approved', 'Approved part predictions', approved.length],
        ['rejected', 'Rejected claims', rejected.length],
      ] as const).map(([value, label, count]) => <button key={value} type="button" aria-pressed={tab === value} onClick={() => setTab(value)} className={`rounded border px-3 py-2 text-sm ${tab === value ? 'bg-[#bd0014] text-white' : 'bg-white'}`}>{label}{!loading && !error ? ` (${count})` : ''}</button>)}
    </div>
    <p className="my-2 text-xs">{tab === 'pending' ? 'Claims awaiting human review, including partially reviewed claims and claims with no suggested parts. Complete human actions in Prediction Queue.' : tab === 'approved' ? 'Parts accepted during human review, including approvals on claims still under review. These are predicted part occurrences, not ordered quantities.' : 'Claims whose review was completed with no accepted parts.'}</p>
    {loading ? <p role="status">Loading claims?</p> : error ? <p role="alert">{error}</p> : <div className="max-h-[430px] overflow-x-auto overflow-y-auto"><table className="min-w-[760px] w-full text-left text-sm"><thead className="sticky top-0 z-10 bg-[#efeded]"><tr>{['ACCIDENT ID / DATE', 'VEHICLE TYPE', tab === 'approved' ? 'APPROVED PART / MODEL SCORE' : 'SUGGESTED PARTS / MODEL SCORE', 'SCORE LEVEL', 'HUMAN ACTION'].map(label => <th key={label} className="border-b border-[#e9bcb7] p-2 text-xs">{label}</th>)}</tr></thead><tbody>
      {tab === 'approved' ? approved.map(({ claim, part }) => <tr key={`${claim.id}-${part.name}`} className="border-t"><td className="p-2">{claim.id}<p className="text-xs">{claim.date}</p></td><td className="p-2">{claim.vehicle} ({claim.year})<p className="text-xs">{claim.damage_zone}</p></td><td className="p-2">{part.name} ? {part.confidence_pct}%</td><td className="p-2">{scoreLevel(part.confidence_pct)}</td><td className="p-2 text-green-700">Approved</td></tr>) : claimRows.map(claim => <tr key={claim.id} className="border-t align-top"><td className="p-2">{claim.id}<p className="text-xs">{claim.date}</p></td><td className="p-2">{claim.vehicle} ({claim.year})<p className="text-xs">{claim.damage_zone || 'Not recorded'}</p></td><td className="p-2">{claim.parts.length ? claim.parts.map(part => <p key={part.name}>{part.name} ? {part.confidence_pct}%</p>) : 'No suggested parts ? manual inspection required'}</td><td className="p-2">{claim.parts.length ? claim.parts.map(part => <p key={part.name}>{scoreLevel(part.confidence_pct)}</p>) : 'No model score'}</td><td className="p-2">{claim.parts.length ? claim.parts.map(part => <p key={part.name}>{part.human_action === 'APPROVED' ? 'Approved' : part.human_action === 'REJECTED' ? 'Rejected' : 'Awaiting review'}</p>) : tab === 'pending' ? 'Awaiting review' : 'Rejected'}</td></tr>)}
    </tbody></table>{(tab === 'approved' ? approved.length : claimRows.length) === 0 && <p className="py-3">{tab === 'pending' ? 'No claims awaiting review.' : tab === 'approved' ? 'No approved parts yet.' : 'No rejected claims.'}</p>}</div>}
  </section>
}
