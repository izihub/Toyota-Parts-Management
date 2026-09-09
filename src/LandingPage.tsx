import { useEffect, useState } from 'react'
import svgPaths from '../imports/svg-7e3q15howf'
import heroBg from './imports/LandingPageImg/toyo.png'

// ── Icons ────────────────────────────────────────────────────────────────────

function Logo({ size = 36 }: { size?: number }) {
  return (
    <div
      className="bg-[#bd0014] rounded-[4px] flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.5} height={size * 0.52} viewBox="0 0 18.0318 18.5059" fill="none">
        <path d={svgPaths.p1154e780} fill="white" />
      </svg>
    </div>
  )
}

function ShieldIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L4 5v6c0 5 3.6 9.5 8 11 4.4-1.5 8-6 8-11V5l-8-3z" stroke="#bd0014" strokeWidth="1.5" fill="none" />
      <path d="M9 12l2 2 4-4" stroke="#bd0014" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// ── Steps ────────────────────────────────────────────────────────────────────

const steps = [
  {
    num: '01', tag: 'DEMAND FORECAST', title: 'Predict what breaks',
    body: 'Accident frequency data is modeled per vehicle model to forecast which parts will be needed, and where, over the coming weeks.',
  },
  {
    num: '02', tag: 'PREDICTION QUEUE', title: 'Human review, always',
    body: 'Every AI prediction carries a confidence score and waits for a person to approve, reject, or adjust it before it becomes real inventory.',
  },
  {
    num: '03', tag: 'INVENTORY & FULFILLMENT', title: 'Route stock intelligently',
    body: 'Approved demand is matched against live stock across every workshop, with transfers and backorders suggested automatically.',
  },
  {
    num: '04', tag: 'PURCHASE ORDERS', title: 'Send it to suppliers',
    body: 'Confirmed shortfalls become a purchase order draft — priced, dated, and ready to send to your suppliers in one click.',
  },
]

const trustCards = [
  {
    title: 'Secure sign in, every session',
    body: 'Access is credentialed per workshop and warehouse, with session controls so only the right people see the right stock data.',
  },
  {
    title: 'No prediction ships blind',
    body: 'Every AI-generated forecast is scored, queued, and requires explicit human approval before it turns into a purchase order.',
  },
  {
    title: 'One warehouse, full visibility',
    body: 'Orders, fulfillment, and supplier activity are tracked in one place, so nothing gets approved twice or missed entirely.',
  },
]

const workshops = ['Anods Workshop #012', 'Kali Service #045', 'Toyota City Hub #008', 'Navala Central Warehouse']

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <div className="w-5 h-px bg-[#bd0014]" />
      <span className="text-[#bd0014] text-[11px] font-bold tracking-[1.2px] uppercase">{text}</span>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function LandingPage({ onEnter }: { onEnter: () => void }) {
  // Re-render every 30s to keep "X min ago" timestamps feeling live
  const [, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 30000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif", backgroundColor: '#fbf9f8' }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          minHeight: '92vh',
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#0c0c0c',
        }}
      >
        {/* Left gradient — keeps text readable over the car */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, rgba(10,10,10,0.96) 26%, rgba(10,10,10,0.72) 46%, rgba(10,10,10,0.15) 66%, transparent 82%)',
            zIndex: 1,
          }}
        />
        {/* Bottom fade — merges into next section */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, #0c0c0c 0%, transparent 16%)', zIndex: 1 }}
        />

        {/* Nav */}
        <nav className="relative flex items-center justify-between px-8 py-5 border-b border-white/10" style={{ zIndex: 10 }}>
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <div>
              <p className="text-white font-bold text-[16px] leading-tight">Island Supply Chain</p>
              <p className="text-white/50 font-bold text-[9px] tracking-[1px] uppercase">Precision Logistics</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onEnter}
              className="bg-white text-[#0c0c0c] font-bold text-[12px] tracking-[0.5px] px-5 h-9 rounded-[4px] hover:bg-white/90 transition-colors"
            >
              Sign In
            </button>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative flex items-center px-8 pt-16 pb-0" style={{ minHeight: 'calc(92vh - 72px)', zIndex: 2 }}>
          {/* Left text */}
          <div className="flex-1 max-w-[520px] pb-24">
            <p className="text-[#bd0014] font-bold text-[11px] tracking-[1.2px] uppercase mb-6">
              ISLAND SUPPLY CHAIN — PRECISION LOGISTICS
            </p>
            <h1 className="text-white font-black text-[52px] leading-[1.05] tracking-[-1.5px] mb-6">
              AI-POWERED TOYOTA PARTS INTELLIGENCE
            </h1>
            <p className="text-white/60 text-[15px] leading-[1.7] mb-10 max-w-[440px]">
              Precision logistics engineered for automotive supply networks. Island Supply Chain translates real-world accident and collision analytics into predictive demand forecasts, dynamic multi-warehouse fulfillment, and automated purchase orders—ensuring critical components are queued and stocked before inventory is depleted. Every prediction is human-verified to maintain total decision integrity.
            </p>
            <button
              onClick={onEnter}
              className="inline-flex items-center gap-2 bg-[#bd0014] text-white font-bold text-[12px] tracking-[1px] uppercase h-12 px-8 rounded-[4px] hover:bg-[#a30011] transition-colors"
            >
              Sign In to Dashboard
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M9 1l4 4-4 4M1 5h12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="px-8 py-20" style={{ backgroundColor: '#fbf9f8' }}>
        <div className="max-w-5xl mx-auto">
          <SectionLabel text="HOW IT WORKS" />
          <h2 className="text-[#1b1c1c] font-black text-[36px] leading-[1.1] tracking-[-0.8px] mb-3 max-w-[520px]">
            From collision data to a supplier's inbox, in four steps.
          </h2>
          <p className="text-[#5f5e5e] text-[15px] leading-relaxed mb-12 max-w-[480px]">
            The same pipeline running your dashboard — demand is forecast, reviewed by your team, allocated to workshops, and turned into orders your suppliers can act on.
          </p>

          {/* 4 Step cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
            {steps.map(step => (
              <div key={step.num} className="bg-white border border-[#e9bcb7] rounded-[6px] p-5 flex flex-col gap-3">
                <p className="text-[#bd0014] font-bold text-[10px] tracking-[1px] uppercase">
                  {step.num} · {step.tag}
                </p>
                <p className="text-[#1b1c1c] font-bold text-[15px] leading-snug">{step.title}</p>
                <p className="text-[#5f5e5e] text-[13px] leading-relaxed flex-1">{step.body}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── WORKSHOP TICKER ───────────────────────────────────────────────── */}
      <section className="border-t border-b border-[#e9bcb7] py-5 px-8 bg-white">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-6 md:gap-0 md:flex-nowrap">
          <p className="text-[#5f5e5e] font-bold text-[10px] tracking-[0.8px] uppercase leading-tight flex-shrink-0 md:w-36 md:mr-8">
            LIVE ACROSS THE NAVALA WORKSHOP NETWORK:
          </p>
          <div className="flex flex-wrap gap-x-12 gap-y-2 items-center flex-1">
            {workshops.map((w, i) => (
              <span key={i} className="text-[#1b1c1c] font-semibold text-[13px]">{w}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST & SECURITY ─────────────────────────────────────────────── */}
      <section className="px-8 py-20" style={{ backgroundColor: '#fbf9f8' }}>
        <div className="max-w-5xl mx-auto">
          <SectionLabel text="TRUST & SECURITY" />
          <h2 className="text-[#1b1c1c] font-black text-[36px] leading-[1.1] tracking-[-0.8px] mb-12 max-w-[420px]">
            Built so your team can rely on it.
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {trustCards.map(card => (
              <div key={card.title} className="bg-white border border-[#e9bcb7] rounded-[6px] p-6">
                <div className="mb-4">
                  <ShieldIcon />
                </div>
                <p className="text-[#1b1c1c] font-bold text-[15px] mb-3 leading-snug">{card.title}</p>
                <p className="text-[#5f5e5e] text-[13px] leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DARK CTA ─────────────────────────────────────────────────────── */}
      <section className="px-8 py-24" style={{ backgroundColor: '#050505' }}>
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-white font-black text-[44px] leading-[1.08] tracking-[-1.2px] mb-4 max-w-[520px] mx-auto">
            See your own network's forecast.
          </h2>
          <p className="text-white/50 text-[15px] leading-relaxed mb-10 max-w-[400px] mx-auto">
            Sign in to review today's prediction queue and fulfillment status for your warehouse.
          </p>
          <button
            onClick={onEnter}
            className="inline-flex items-center gap-2 bg-[#bd0014] text-white font-bold text-[12px] tracking-[1px] uppercase h-12 px-8 rounded-[4px] hover:bg-[#a30011] transition-colors"
          >
            Sign In to Dashboard
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M9 1l4 4-4 4M1 5h12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="px-8 pt-14 pb-8 bg-white border-t border-[#e9bcb7]">
        <div className="max-w-5xl mx-auto">
          {/* Top row */}
          <div className="flex flex-col md:flex-row gap-10 mb-10">
            {/* Brand */}
            <div className="flex-1 max-w-[280px]">
              <div className="flex items-center gap-3 mb-4">
                <Logo size={32} />
                <div>
                  <p className="text-[#1b1c1c] font-bold text-[14px] leading-tight">Island Supply Chain</p>
                  <p className="text-[#bd0014] font-bold text-[9px] tracking-[1px] uppercase">Precision Logistics</p>
                </div>
              </div>
              <p className="text-[#5f5e5e] text-[13px] leading-relaxed">
                AI-assisted demand forecasting and fulfillment for Toyota-affiliated workshops and warehouses.
              </p>
            </div>

            {/* Links */}
            <div className="flex gap-16 md:ml-auto">
              <div>
                <p className="text-[#1b1c1c] font-bold text-[11px] tracking-[0.8px] uppercase mb-4">Platform</p>
                <div className="flex flex-col gap-3">
                  {['Demand Forecast', 'Prediction Queue', 'Inventory & Fulfillment', 'Purchase Orders'].map(l => (
                    <button key={l} onClick={onEnter} className="text-[#5f5e5e] text-[13px] hover:text-[#1b1c1c] text-left transition-colors">{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[#1b1c1c] font-bold text-[11px] tracking-[0.8px] uppercase mb-4"></p>
                <div className="flex flex-col gap-3">
                  {/*{['How It Works', 'Trust & Security', 'Support'].map(l => (
                    <span key={l} className="text-[#5f5e5e] text-[13px]">{l}</span>
                  ))}*/}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 pt-6 border-t border-[#f0eeee]">
            <p className="text-[#9ca3af] text-[12px]">
              © 2026 Island Supply Chain — Internal operations platform. Not affiliated with Toyota Motor Corporation.
            </p>
            <p className="text-[#9ca3af] text-[12px] flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="4" width="10" height="7" rx="1" stroke="#9ca3af" strokeWidth="1"/><path d="M4 4V3a2 2 0 014 0v1" stroke="#9ca3af" strokeWidth="1"/></svg>
              Secure Sign In Required
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
