import React, { useState } from 'react'
import svgPaths from '../imports/svg-7e3q15howf'
import LandingPage from './LandingPage'


type View = 'demand' | 'prediction' | 'inventory' | 'purchase'

// ─── Shared Icons ────────────────────────────────────────────────────────────

function IconTrend() {
  return (
    <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
      <path d={svgPaths.p33125000} fill="currentColor" />
    </svg>
  )
}
function IconGrid() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d={svgPaths.p4c2b800} fill="currentColor" />
    </svg>
  )
}
function IconBox() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d={svgPaths.p643d217} fill="currentColor" />
    </svg>
  )
}
function IconCart() {
  return (
    <svg width="20" height="20" viewBox="0 0 19.9815 20" fill="none">
      <path d={svgPaths.p3f423340} fill="currentColor" />
    </svg>
  )
}
function IconSearch() {
  return (
    <svg width="14" height="14" viewBox="0 0 13.5 13.5" fill="none">
      <path d={svgPaths.p2500af80} fill="currentColor" />
    </svg>
  )
}
function IconBell() {
  return (
    <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
      <path d={svgPaths.p164b49c0} fill="currentColor" />
    </svg>
  )
}
function IconGear() {
  return (
    <svg width="20" height="20" viewBox="0 0 20.1 20" fill="none">
      <path d={svgPaths.p3cdadd00} fill="currentColor" />
    </svg>
  )
}
function IconPin() {
  return (
    <svg width="13" height="17" viewBox="0 0 13.3333 16.6667" fill="none">
      <path d={svgPaths.p2f7922c0} fill="currentColor" />
    </svg>
  )
}
function IconClock() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d={svgPaths.p256e1340} fill="currentColor" />
    </svg>
  )
}
function IconPlus() {
  return (
    <svg width="8" height="8" viewBox="0 0 8.16667 8.16667" fill="none">
      <path d={svgPaths.p10ad69c0} fill="currentColor" />
    </svg>
  )
}
function IconSupport() {
  return (
    <svg width="13" height="13" viewBox="0 0 13.3333 13.3333" fill="none">
      <path d={svgPaths.p1e63bd00} fill="currentColor" />
    </svg>
  )
}
function IconSignOut() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d={svgPaths.p1b102380} fill="currentColor" />
    </svg>
  )
}
function IconStar() {
  return (
    <svg width="13" height="13" viewBox="0 0 12.8333 12.8333" fill="none">
      <path d={svgPaths.p6da9c80} fill="currentColor" />
    </svg>
  )
}
function IconBike() {
  return (
    <svg width="18" height="19" viewBox="0 0 18.0318 18.5059" fill="none">
      <path d={svgPaths.p1154e780} fill="currentColor" />
    </svg>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: View; label: string; icon: () => React.ReactElement }[] = [
  { id: 'demand', label: 'Demand Forecast', icon: IconTrend },
  { id: 'prediction', label: 'Prediction Queue', icon: IconGrid },
  { id: 'inventory', label: 'Inventory & Fulfillment', icon: IconBox },
  { id: 'purchase', label: 'Purchase Orders', icon: IconCart },
]

function Sidebar({
  active,
  onNavigate,
  onSignOut,
  onOpenSupport,
  onOpenNewOrder,
  isNightMode,
}: {
  active: View
  onNavigate: (v: View) => void
  onSignOut: () => void
  onOpenSupport: () => void
  onOpenNewOrder: () => void
  isNightMode: boolean
}) {
  const sidebarClasses = isNightMode ? 'border-[#374151] bg-[#111827]' : 'border-[#e9bcb7] bg-white'
  const mutedText = isNightMode ? 'text-gray-300' : 'text-[#5f5e5e]'
  const activeBg = isNightMode ? '#1f2937' : '#e9e8e7'
  const activeText = '#bd0014'
  return (
    <aside className={`flex w-full flex-col border-b lg:w-[200px] lg:border-b-0 lg:border-r ${sidebarClasses}`}>
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 pb-4 pt-4 lg:pb-10 lg:pt-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[2px] bg-[#bd0014]">
          <span className="text-white" style={{ color: 'white' }}>
            <IconBike />
          </span>
        </div>
        <div>
          <p className="text-[16px] font-bold leading-[24px] tracking-[-0.18px] text-[#bd0014] lg:text-[18px]">Island Supply Chain</p>
          <p className="text-[9px] font-bold uppercase leading-[15px] tracking-[1px] text-[#5f5e5e]">PRECISION LOGISTICS</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="relative flex-1 overflow-x-auto lg:min-h-0">
        <div className="flex gap-1 overflow-x-auto px-2 py-2 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0 lg:py-0">
          {NAV_ITEMS.map((item) => {
            const isActive = item.id === active
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="relative flex h-12 shrink-0 items-center gap-3 px-3 text-left lg:w-full lg:px-4"
                style={{
                  backgroundColor: isActive ? activeBg : 'transparent',
                  marginLeft: isActive ? 4 : 0,
                  marginRight: isActive ? 8 : 0,
                  width: isActive ? 'calc(100% - 12px)' : 'auto',
                  borderRadius: 0,
                  cursor: 'pointer',
                }}
              >
                {isActive && (
                  <div className="absolute inset-y-0 left-0 w-1 bg-[#bd0014]" />
                )}
                <span style={{ color: isActive ? activeText : isNightMode ? '#d1d5db' : '#5f5e5e', paddingLeft: isActive ? 4 : 0 }}>
                  <item.icon />
                </span>
                <span
                  className="whitespace-nowrap text-[11px] font-bold tracking-[0.55px]"
                  style={{ color: isActive ? activeText : isNightMode ? '#d1d5db' : '#5f5e5e' }}
                >
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Bottom */}
      <div className="border-t border-[#e9bcb7]">
        <div className="flex flex-col gap-1 px-3 py-3 lg:pt-[17px]">
          <button type="button" onClick={onOpenNewOrder} className="flex h-10 w-full items-center justify-center gap-2 rounded-[2px] bg-[#bd0014]">
            <span className="text-white"><IconPlus /></span>
            <span className="text-[11px] font-bold tracking-[0.55px] text-white">New Order</span>
          </button>
          <button type="button" onClick={onOpenSupport} className="flex h-[52px] w-full items-center gap-3 px-1 text-left">
            <span className={mutedText}><IconSupport /></span>
            <span className={`text-[13px] ${mutedText}`}>Support</span>
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className="flex h-10 w-full items-center gap-3 px-1 text-left"
          >
            <span className={mutedText}><IconSignOut /></span>
            <span className={`text-[13px] ${mutedText}`}>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  )
}

function SupportModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className="w-full max-w-md rounded-[18px] border border-[#e9bcb7] bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-[#bd0014]">Support</p>
            <h3 className="mt-1 text-[24px] font-black tracking-[-0.5px] text-[#1b1c1c]">Need help?</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[24px] leading-none text-[#5f5e5e]">×</button>
        </div>

        <div className="space-y-3 text-[13px] text-[#5f5e5e]">
          <p>Our logistics support team is available to help with stock issues, fulfillment delays, and workflow questions.</p>
          <div className="rounded-[10px] border border-[#e9bcb7] bg-[#f8f4f3] p-3">
            <p className="font-bold text-[#1b1c1c]">Priority support</p>
            <p className="mt-1">Email: logistics-support@island-supply.local</p>
            <p>Phone: +94 11 765 4321</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-[8px] border border-[#e9bcb7] bg-white px-4 py-2 text-[12px] font-bold uppercase tracking-[0.55px] text-[#1b1c1c]">
            Close
          </button>
          <button type="button" onClick={onSubmit} className="rounded-[8px] bg-[#bd0014] px-4 py-2 text-[12px] font-bold uppercase tracking-[0.55px] text-white">
            Request callback
          </button>
        </div>
      </div>
    </div>
  )
}

type NewOrderDetail = {
  supplier: string
  vehicle: string
  part: string
  quantity: string
  unitPrice: string
}

function NewOrderModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (details: NewOrderDetail[]) => void }) {
  const [details, setDetails] = useState<NewOrderDetail[]>([
    { supplier: 'Toyota Parts Co.', vehicle: '', part: '', quantity: '', unitPrice: '' },
  ])

  const total = details.reduce((sum, detail) => sum + (Number(detail.quantity) || 0) * (Number(detail.unitPrice) || 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className="w-full max-w-6xl rounded-[18px] border border-[#e9bcb7] bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-[#bd0014]">New order</p>
            <h3 className="mt-1 text-[24px] font-black tracking-[-0.5px] text-[#1b1c1c]">Create purchase order</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[24px] leading-none text-[#5f5e5e]">×</button>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-[12px] font-bold uppercase tracking-[0.5px] text-[#5f5e5e]">Order details</label>
            <button type="button" onClick={() => setDetails(current => [...current, { supplier: '', vehicle: '', part: '', quantity: '', unitPrice: '' }])} className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#bd0014]">+ Add row</button>
          </div>
          <div className="overflow-x-auto rounded-[8px] border border-[#e9bcb7]">
            <div className="min-w-[980px]">
              <div className="grid grid-cols-[1.2fr_1.15fr_1.5fr_0.7fr_1fr_auto] gap-3 bg-[#efeded] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.5px] text-[#5f5e5e]">
                <span>Supplier name</span><span>Vehicle model / year</span><span>Part name / No</span><span>Quantity</span><span>Unit price</span><span />
              </div>
              <div className="space-y-2 p-2">
                {details.map((detail, index) => (
                  <div key={index} className="grid grid-cols-[1.2fr_1.15fr_1.5fr_0.7fr_1fr_auto] gap-3">
                    {(['supplier', 'vehicle', 'part', 'quantity', 'unitPrice'] as const).map(field => (
                      <input key={field} type={field === 'quantity' || field === 'unitPrice' ? 'number' : 'text'} min={field === 'quantity' || field === 'unitPrice' ? '0' : undefined} value={detail[field]} onChange={event => setDetails(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: event.target.value } : item))} placeholder={field === 'supplier' ? 'Supplier name' : field === 'vehicle' ? 'Model / year' : field === 'part' ? 'Part name / No' : field === 'quantity' ? 'Qty' : 'Unit price'} className="h-10 min-w-0 rounded-[8px] border border-[#e9bcb7] bg-[#f8f4f3] px-3 text-[13px] text-[#1b1c1c] outline-none focus:border-[#bd0014]" />
                    ))}
                    <button type="button" disabled={details.length === 1} onClick={() => setDetails(current => current.filter((_, itemIndex) => itemIndex !== index))} className="h-10 px-2 text-[20px] leading-none text-[#5f5e5e] disabled:opacity-30">×</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-4 border-t border-[#e9bcb7] pt-4">
            <span className="text-[13px] font-bold uppercase tracking-[0.55px] text-[#5f5e5e]">Total</span>
            <span className="text-[20px] font-black text-[#1b1c1c]">LKR {total.toLocaleString()}</span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-[8px] border border-[#e9bcb7] bg-white px-4 py-2 text-[12px] font-bold uppercase tracking-[0.55px] text-[#1b1c1c]">
            Cancel
          </button>
          <button type="button" onClick={() => onSubmit(details)} className="rounded-[8px] bg-[#bd0014] px-4 py-2 text-[12px] font-bold uppercase tracking-[0.55px] text-white">
            Save order
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Top Nav ─────────────────────────────────────────────────────────────────

function TopNav({
  searchPlaceholder = 'Search components...',
  value = '',
  onChange,
  userName = 'Nuwan Perera',
  userRole = 'Operations Manager',
  warehouseName = 'Navala Central',
  profilePicture,
  onOpenProfile,
  notifications = [],
  unreadCount = 0,
  showNotifications = false,
  onToggleNotifications,
  onMarkNotificationsRead,
  isNightMode = false,
  onToggleNightMode,
}: {
  searchPlaceholder?: string
  value?: string
  onChange?: (value: string) => void
  userName?: string
  userRole?: string
  warehouseName?: string
  profilePicture?: string
  onOpenProfile?: () => void
  notifications?: Array<{ id: number; title: string; detail: string; time: string; read: boolean }>
  unreadCount?: number
  showNotifications?: boolean
  onToggleNotifications?: () => void
  onMarkNotificationsRead?: () => void
  isNightMode?: boolean
  onToggleNightMode?: () => void
}) {
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('') || 'U'

  const headerClasses = isNightMode
    ? 'border-[#2a2d35] bg-[#111827] text-white'
    : 'border-[#e9bcb7] bg-[#fbf9f8] text-[#1b1c1c]'
  const inputClasses = isNightMode
    ? 'border-[#374151] bg-[#1f2937] text-white placeholder:text-gray-400'
    : 'border-[#e9bcb7] bg-[#f5f3f3] text-[#6b7280]'
  const textMutedClasses = isNightMode ? 'text-gray-300' : 'text-[#5f5e5e]'
  const panelClasses = isNightMode
    ? 'border-[#374151] bg-[#111827] text-white'
    : 'border-[#e9bcb7] bg-white text-[#1b1c1c]'

  return (
    <header className={`z-10 flex h-auto flex-shrink-0 flex-col gap-3 border-b px-4 py-3 lg:h-12 lg:flex-row lg:items-center lg:justify-between lg:py-0 ${headerClasses}`}>
      <h1 className="text-[18px] font-black tracking-[-0.48px] text-[#bd0014] sm:text-[20px] lg:text-[24px]">Toyota Parts Management</h1>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
        <div className="relative flex items-center w-full lg:w-auto">
          <span className={`absolute left-3 ${textMutedClasses}`}><IconSearch /></span>
          <input
            className={`h-9 w-full rounded-[2px] border pl-8 pr-3 text-[13px] outline-none lg:w-56 ${inputClasses}`}
            placeholder={searchPlaceholder}
            value={value}
            onChange={event => onChange?.(event.target.value)}
          />
        </div>
        <div className={`flex items-center gap-2 ${textMutedClasses}`}>
          <span><IconPin /></span>
          <span className="text-[10px] font-bold tracking-[0.55px] sm:text-[11px]">Warehouse: {warehouseName}</span>
        </div>
        <div className={`relative flex items-center gap-4 ${textMutedClasses}`}>
          <button type="button" onClick={onToggleNotifications} className="relative p-1">
            <IconBell />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex min-w-[16px] items-center justify-center rounded-full bg-[#bd0014] px-1 text-[9px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className={`absolute right-0 top-12 z-40 w-[320px] rounded-[12px] border p-3 shadow-[0_12px_30px_rgba(0,0,0,0.12)] ${panelClasses}`}>
              <div className="mb-2 flex items-center justify-between">
                <p className={`text-[12px] font-bold uppercase tracking-[0.5px] ${isNightMode ? 'text-white' : 'text-[#1b1c1c]'}`}>Notifications</p>
                <button type="button" onClick={onMarkNotificationsRead} className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#bd0014]">
                  Mark all read
                </button>
              </div>
              <div className="space-y-2">
                {notifications.length === 0 ? (
                  <p className={`rounded-[8px] px-3 py-4 text-[12px] ${isNightMode ? 'bg-[#1f2937] text-gray-300' : 'bg-[#fbf9f8] text-[#5f5e5e]'}`}>No new notifications.</p>
                ) : (
                  notifications.map(note => (
                    <div key={note.id} className={`rounded-[8px] border px-3 py-2 ${note.read ? isNightMode ? 'border-[#374151] bg-[#1f2937]' : 'border-[#f0eeee] bg-[#fbf9f8]' : isNightMode ? 'border-[#4b2e32] bg-[#2f1d23]' : 'border-[#f3d7d3] bg-[#fff7f5]'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`text-[12px] font-bold ${isNightMode ? 'text-white' : 'text-[#1b1c1c]'}`}>{note.title}</p>
                          <p className={`mt-1 text-[11px] leading-5 ${isNightMode ? 'text-gray-300' : 'text-[#5f5e5e]'}`}>{note.detail}</p>
                        </div>
                        {!note.read && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#bd0014]" />}
                      </div>
                      <p className={`mt-2 text-[10px] uppercase tracking-[0.45px] ${isNightMode ? 'text-gray-400' : 'text-[#5f5e5e]'}`}>{note.time}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={onToggleNightMode}
            className={`flex items-center gap-2 rounded-[6px] border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.55px] transition ${isNightMode ? 'border-[#374151] bg-[#1f2937] text-white hover:bg-[#243244]' : 'border-[#e9bcb7] bg-white text-[#1b1c1c] hover:border-[#bd0014]'}`}
          >
            <span aria-hidden="true">{isNightMode ? '☀' : '☾'}</span>
            {isNightMode ? 'Day Mode' : 'Night Mode'}
          </button>
          <button
            type="button"
            onClick={onOpenProfile}
            className={`flex items-center gap-2 rounded-full border px-2 py-1 text-left transition ${isNightMode ? 'border-[#374151] bg-[#1f2937] hover:border-[#bd0014]' : 'border-[#e9bcb7] bg-white hover:border-[#bd0014]'}`}
          >
            {profilePicture ? (
              <img src={profilePicture} alt={userName} className="flex size-8 items-center justify-center overflow-hidden rounded-[12px] object-cover" />
            ) : (
              <div className={`flex size-8 items-center justify-center overflow-hidden rounded-[12px] text-[12px] font-bold ${isNightMode ? 'bg-[#374151] text-white' : 'bg-[#e4e2e2] text-[#5f5e5e]'}`}>
                {initials}
              </div>
            )}
            <div className="hidden sm:block">
              <p className={`text-[11px] font-bold leading-tight ${isNightMode ? 'text-white' : 'text-[#1b1c1c]'}`}>{userName}</p>
              <p className={`text-[9px] uppercase tracking-[0.5px] ${isNightMode ? 'text-gray-300' : 'text-[#5f5e5e]'}`}>{userRole}</p>
            </div>
          </button>
        </div>
      </div>
    </header>
  )
}

// ─── Demand Forecast View ─────────────────────────────────────────────────────

const demandRows = [
  {
    img: '🔦', name: 'LED Headlight Assembly (R)', pn: 'PN-81110-33C10',
    compat: 'CAMRY 2024', vehicleModel: 'Camry', makeYear: 2024, exteriorPart: 'Headlight', monthYear: 'Oct 2024', demand: 842, stock: 210, stockColor: '#bd0014', health: 25, conf: 'HIGH', confColor: '#15803d', confBg: '#f0fdf4',
  },
  {
    img: '💡', name: 'LED Fog lamp (R)', pn: 'PN-43512-42119',
    compat: 'RAV4 2023+', vehicleModel: 'RAV4', makeYear: 2023, exteriorPart: 'Fog Lamp', monthYear: 'Nov 2024', demand: 1240, stock: 1180, stockColor: '#1b1c1c', health: 95, conf: 'HIGH', confColor: '#15803d', confBg: '#f0fdf4',
  },
  {
    img: '🚗', name: 'Front Bumper Reinforcement', pn: 'PN-52131-02830',
    compat: 'COROLLA HB', vehicleModel: 'Corolla', makeYear: 2024, exteriorPart: 'Bumper', monthYear: 'Sep 2024', demand: 450, stock: 320, stockColor: '#1b1c1c', health: 71, conf: 'MED', confColor: '#b45309', confBg: '#fffbeb',
  },
  {
    img: '🪟', name: 'Outer Mirror Glass (Heated)', pn: 'PN-87931-48C60',
    compat: 'HIGHLANDER', vehicleModel: 'Highlander', makeYear: 2024, exteriorPart: 'Mirror Glass', monthYear: 'Dec 2024', demand: 312, stock: 45, stockColor: '#bd0014', health: 14, conf: 'LOW', confColor: '#b91c1c', confBg: '#fef2f2',
  },
]

function HealthBar({ pct }: { pct: number }) {
  const barColor = pct > 70 ? '#22c55e' : pct > 40 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-2">
      <div className="bg-[#e9e8e7] h-[6px] rounded-full overflow-hidden" style={{ width: 80 }}>
        <div style={{ width: `${pct}%`, backgroundColor: barColor, height: '100%', borderRadius: 9999 }} />
      </div>
      <span className="text-[11px] text-[#5f5e5e]">{pct}%</span>
    </div>
  )
}

function DemandForecastView({
  searchTerm,
  onSearchChange,
  onAction,
  onClear,
  userName,
  userRole,
  warehouseName,
  profilePicture,
  onOpenProfile,
  notifications,
  unreadCount,
  showNotifications,
  onToggleNotifications,
  onMarkNotificationsRead,
  isNightMode,
  onToggleNightMode,
}: {
  searchTerm: string
  onSearchChange: (value: string) => void
  onAction: (message: string) => void
  onClear: () => void
  userName: string
  userRole: string
  warehouseName: string
  profilePicture?: string
  onOpenProfile: () => void
  notifications: Array<{ id: number; title: string; detail: string; time: string; read: boolean }>
  unreadCount: number
  showNotifications: boolean
  onToggleNotifications: () => void
  onMarkNotificationsRead: () => void
  isNightMode?: boolean
  onToggleNightMode?: () => void
}) {
  const [vehicleFilter, setVehicleFilter] = useState('All Models')
  const [makeYearFilter, setMakeYearFilter] = useState('All Years')
  const [exteriorPartFilter, setExteriorPartFilter] = useState('All Exterior Parts')
  const [monthYearFilter, setMonthYearFilter] = useState('All Months')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [showCurrentStock, setShowCurrentStock] = useState(false)
  const [currentStockForm, setCurrentStockForm] = useState([{ vehicleModel: '', makeYear: '', partNameNo: '', quantity: '' }])

  const vehicleOptions = ['All Models', 'Camry', 'RAV4', 'Corolla', 'Highlander']
  const makeYearOptions = ['All Years', '2023', '2024', '2025']
  const exteriorPartOptions = ['All Exterior Parts', 'Headlight', 'Fog Lamp', 'Bumper', 'Mirror Glass']
  const monthOptions = ['All Months', 'Sep 2024', 'Oct 2024', 'Nov 2024', 'Dec 2024']

  const filteredRows = demandRows.filter(row => {
    const matchesSearch = [row.name, row.pn, row.compat].join(' ').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesVehicle = vehicleFilter === 'All Models' || row.vehicleModel === vehicleFilter
    const matchesYear = makeYearFilter === 'All Years' || String(row.makeYear) === makeYearFilter
    const matchesPart = exteriorPartFilter === 'All Exterior Parts' || row.exteriorPart === exteriorPartFilter
    const matchesMonth = monthYearFilter === 'All Months' || row.monthYear === monthYearFilter
    return matchesSearch && matchesVehicle && matchesYear && matchesPart && matchesMonth
  })

  const handleClearAll = () => {
    setVehicleFilter('All Models')
    setMakeYearFilter('All Years')
    setExteriorPartFilter('All Exterior Parts')
    setMonthYearFilter('All Months')
    onClear()
  }

  const handleAddCurrentStock = () => {
    const validStockRows = currentStockForm.filter(row => row.vehicleModel.trim() && row.makeYear.trim() && row.partNameNo.trim() && Number(row.quantity) > 0)

    if (validStockRows.length !== currentStockForm.length) {
      onAction('Complete all current stock rows before saving.')
      return
    }

    const totalQuantity = validStockRows.reduce((total, row) => total + Number(row.quantity), 0)
    setCurrentStockForm([{ vehicleModel: '', makeYear: '', partNameNo: '', quantity: '' }])
    setShowCurrentStock(false)
    onAction(`${totalQuantity} stock units added to ${warehouseName}.`)
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopNav
        searchPlaceholder="Search components..."
        value={searchTerm}
        onChange={onSearchChange}
        userName={userName}
        userRole={userRole}
        warehouseName={warehouseName}
        profilePicture={profilePicture}
        onOpenProfile={onOpenProfile}
        notifications={notifications}
        unreadCount={unreadCount}
        showNotifications={showNotifications}
        onToggleNotifications={onToggleNotifications}
        onMarkNotificationsRead={onMarkNotificationsRead}
        isNightMode={isNightMode}
        onToggleNightMode={onToggleNightMode}
      />
      <div className="flex-1 overflow-auto bg-[#fbf9f8] p-4 sm:p-6 lg:p-8">
        {/* Page header */}
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-[18px] font-semibold tracking-[-0.18px] text-[#1b1c1c]">Demand &amp; Inventory Forecast</h2>
            <p className="mt-0.5 text-[13px] text-[#5f5e5e]">Analyzing accident frequency data to optimize parts distribution.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setShowCurrentStock(true)} className="flex h-9 items-center gap-2 rounded-[4px] border border-[#e9bcb7] bg-white px-4 text-[11px] font-bold tracking-[0.55px] text-[#1b1c1c]">
              + Add New Stock
            </button>
            <button type="button" onClick={() => onAction('Reorder list generated for high-risk parts.')} className="flex h-9 items-center gap-2 rounded-[4px] bg-[#bd0014] px-4 text-[11px] font-bold tracking-[0.55px] text-white">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M5 1v4H1l5 6 5-6H7V1H5z" fill="white"/></svg>
              Generate Reorder List
            </button>
          </div>
        </div>

        {showCurrentStock && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
            <div className="w-full max-w-5xl rounded-[18px] border border-[#e9bcb7] bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-[#bd0014]">{warehouseName}</p>
                  <h3 className="mt-1 text-[24px] font-black tracking-[-0.5px] text-[#1b1c1c]">Add new stock</h3>
                </div>
                <button type="button" onClick={() => setShowCurrentStock(false)} className="text-[24px] leading-none text-[#5f5e5e]">×</button>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-[12px] font-bold uppercase tracking-[0.5px] text-[#5f5e5e]">New stock details</label>
                  <button type="button" onClick={() => setCurrentStockForm(current => [...current, { vehicleModel: '', makeYear: '', partNameNo: '', quantity: '' }])} className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#bd0014]">+ Add row</button>
                </div>
                <div className="overflow-x-auto rounded-[8px] border border-[#e9bcb7]">
                  <div className="min-w-[760px]">
                    <div className="grid grid-cols-[1.3fr_0.8fr_1.5fr_0.7fr_auto] gap-3 bg-[#efeded] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.5px] text-[#5f5e5e]">
                      <span>Vehicle model</span><span>Make year</span><span>Part name / No</span><span>Quantity</span><span />
                    </div>
                    <div className="space-y-2 p-2">
                      {currentStockForm.map((row, index) => (
                        <div key={index} className="grid grid-cols-[1.3fr_0.8fr_1.5fr_0.7fr_auto] gap-3">
                          <input value={row.vehicleModel} onChange={event => setCurrentStockForm(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, vehicleModel: event.target.value } : item))} placeholder="Vehicle model" className="h-10 min-w-0 rounded-[8px] border border-[#e9bcb7] bg-[#f8f4f3] px-3 text-[13px] text-[#1b1c1c] outline-none focus:border-[#bd0014]" />
                          <input type="number" value={row.makeYear} onChange={event => setCurrentStockForm(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, makeYear: event.target.value } : item))} placeholder="Year" className="h-10 min-w-0 rounded-[8px] border border-[#e9bcb7] bg-[#f8f4f3] px-3 text-[13px] text-[#1b1c1c] outline-none focus:border-[#bd0014]" />
                          <input value={row.partNameNo} onChange={event => setCurrentStockForm(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, partNameNo: event.target.value } : item))} placeholder="Part name / No" className="h-10 min-w-0 rounded-[8px] border border-[#e9bcb7] bg-[#f8f4f3] px-3 text-[13px] text-[#1b1c1c] outline-none focus:border-[#bd0014]" />
                          <input type="number" min="1" value={row.quantity} onChange={event => setCurrentStockForm(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: event.target.value } : item))} placeholder="Qty" className="h-10 min-w-0 rounded-[8px] border border-[#e9bcb7] bg-[#f8f4f3] px-3 text-[13px] text-[#1b1c1c] outline-none focus:border-[#bd0014]" />
                          <button type="button" disabled={currentStockForm.length === 1} onClick={() => setCurrentStockForm(current => current.filter((_, itemIndex) => itemIndex !== index))} className="h-10 px-2 text-[20px] leading-none text-[#5f5e5e] disabled:opacity-30">×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setShowCurrentStock(false)} className="rounded-[8px] border border-[#e9bcb7] bg-white px-4 py-2 text-[12px] font-bold uppercase tracking-[0.55px] text-[#1b1c1c]">Cancel</button>
                <button type="button" onClick={handleAddCurrentStock} className="rounded-[8px] bg-[#bd0014] px-4 py-2 text-[12px] font-bold uppercase tracking-[0.55px] text-white">Add stock</button>
              </div>
            </div>
          </div>
        )}

        {/* Stat cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Total Predicted Demand */}
          <div className="relative overflow-hidden rounded-[4px] border border-[#e9bcb7] bg-white p-4">
            <div className="mb-3 flex items-start justify-between">
              <span className="text-[13px] font-medium text-[#5f5e5e]">Total Predicted Demand</span>
              <div className="text-[#bd0014]">
                <svg width="18" height="18" viewBox="0 0 20 12" fill="none"><path d={svgPaths.p33125000} fill="#bd0014"/></svg>
              </div>
            </div>
            <p className="text-[28px] font-black leading-none text-[#1b1c1c] sm:text-[32px]">12,482</p>
            <p className="mt-1 text-[11px] text-[#5f5e5e]">units</p>
            <p className="mt-2 text-[11px] font-bold text-[#15803d]">↑ +14.2% vs prev 30d</p>
          </div>

          {/* Low Stock Alerts */}
          <div className="rounded-[4px] border border-[#e9bcb7] bg-white p-4">
            <div className="mb-3 flex items-start justify-between">
              <span className="text-[13px] font-medium text-[#5f5e5e]">Low Stock Alerts</span>
              <svg width="18" height="16" viewBox="0 0 12.8333 11.0833" fill="none"><path d={svgPaths.p2e0ed180} fill="#f59e0b"/></svg>
            </div>
            <p className="text-[28px] font-black leading-none text-[#1b1c1c] sm:text-[32px]">42</p>
            <p className="mt-1 text-[11px] text-[#5f5e5e]">SKUs</p>

            <p className="text-[#bd0014] font-bold text-[11px] mt-2">⚠ 8 CRITICAL STOCKOUTS</p>
          </div>

          {/* Pending AI Predictions */}
          <div className="bg-white border border-[#e9bcb7] rounded-[4px] p-4">
            <div className="flex items-start justify-between mb-3">
              <span className="text-[#5f5e5e] text-[13px] font-medium">Pending AI Predictions</span>
              <span className="text-[#5f5e5e]"><IconStar /></span>
            </div>
            <p className="text-[#1b1c1c] font-black text-[32px] leading-none">1,894</p>
            <p className="text-[#5f5e5e] text-[11px] mt-3">Awaiting human verification</p>
          </div>

          {/* Fulfillment Rate */}
          <div className="bg-white border border-[#e9bcb7] rounded-[4px] p-4">
            <div className="flex items-start justify-between mb-3">
              <span className="text-[#5f5e5e] text-[13px] font-medium">Fulfillment Rate</span>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" stroke="#22c55e" strokeWidth="2" fill="none"/>
                <path d="M6 10l3 3 5-5" stroke="#22c55e" strokeWidth="1.5" fill="none"/>
              </svg>
            </div>
            <p className="text-[#1b1c1c] font-black text-[32px] leading-none">94.8%</p>
            <div className="mt-3 bg-[#e9e8e7] h-[6px] rounded-full overflow-hidden">
              <div className="bg-[#22c55e] h-full rounded-full" style={{ width: '94.8%' }} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[4px] border border-[#e9bcb7] bg-white p-3">
          <span className="flex items-center gap-1 text-[11px] font-bold tracking-[0.55px] text-[#5f5e5e]">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M0 2h14v1.5L9 8v6L5 12V8L0 3.5V2z" fill="#5f5e5e"/></svg>
            Filters:
          </span>

          {/* Vehicle Model Dropdown */}
          <div className="relative">
            <button type="button" onClick={() => setOpenDropdown(openDropdown === 'vehicle' ? null : 'vehicle')} className="flex h-8 items-center gap-1 rounded-[4px] border border-[#e9bcb7] bg-white px-3 text-[13px] text-[#1b1c1c]">
              Vehicle Model: {vehicleFilter} <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#5f5e5e" strokeWidth="1.5"/></svg>
            </button>
            {openDropdown === 'vehicle' && (
              <div className="absolute top-10 left-0 z-20 min-w-[140px] rounded-[4px] border border-[#e9bcb7] bg-white shadow-lg">
                {vehicleOptions.map(opt => (
                  <button key={opt} type="button" onClick={() => { setVehicleFilter(opt); setOpenDropdown(null); }} className={`block w-full px-3 py-2 text-left text-[13px] hover:bg-[#f5f3f3] ${opt === vehicleFilter ? 'bg-[#efeded] font-bold text-[#bd0014]' : 'text-[#1b1c1c]'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Make Year Dropdown */}
          <div className="relative">
            <button type="button" onClick={() => setOpenDropdown(openDropdown === 'year' ? null : 'year')} className="flex h-8 items-center gap-1 rounded-[4px] border border-[#e9bcb7] bg-white px-3 text-[13px] text-[#1b1c1c]">
              Make Year: {makeYearFilter} <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#5f5e5e" strokeWidth="1.5"/></svg>
            </button>
            {openDropdown === 'year' && (
              <div className="absolute top-10 left-0 z-20 min-w-[140px] rounded-[4px] border border-[#e9bcb7] bg-white shadow-lg">
                {makeYearOptions.map(opt => (
                  <button key={opt} type="button" onClick={() => { setMakeYearFilter(opt); setOpenDropdown(null); }} className={`block w-full px-3 py-2 text-left text-[13px] hover:bg-[#f5f3f3] ${opt === makeYearFilter ? 'bg-[#efeded] font-bold text-[#bd0014]' : 'text-[#1b1c1c]'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Exterior Part Dropdown */}
          <div className="relative">
            <button type="button" onClick={() => setOpenDropdown(openDropdown === 'part' ? null : 'part')} className="flex h-8 items-center gap-1 rounded-[4px] border border-[#e9bcb7] bg-white px-3 text-[13px] text-[#1b1c1c]">
              Exterior Part: {exteriorPartFilter} <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#5f5e5e" strokeWidth="1.5"/></svg>
            </button>
            {openDropdown === 'part' && (
              <div className="absolute top-10 left-0 z-20 min-w-[170px] rounded-[4px] border border-[#e9bcb7] bg-white shadow-lg">
                {exteriorPartOptions.map(opt => (
                  <button key={opt} type="button" onClick={() => { setExteriorPartFilter(opt); setOpenDropdown(null); }} className={`block w-full px-3 py-2 text-left text-[13px] hover:bg-[#f5f3f3] ${opt === exteriorPartFilter ? 'bg-[#efeded] font-bold text-[#bd0014]' : 'text-[#1b1c1c]'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button type="button" onClick={() => setOpenDropdown(openDropdown === 'month' ? null : 'month')} className="flex h-8 items-center gap-1 rounded-[4px] border border-[#e9bcb7] bg-white px-3 text-[13px] text-[#1b1c1c]">
              Month & Year: {monthYearFilter} <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#5f5e5e" strokeWidth="1.5"/></svg>
            </button>
            {openDropdown === 'month' && (
              <div className="absolute top-10 left-0 z-20 min-w-[160px] rounded-[4px] border border-[#e9bcb7] bg-white shadow-lg">
                {monthOptions.map(opt => (
                  <button key={opt} type="button" onClick={() => { setMonthYearFilter(opt); setOpenDropdown(null); }} className={`block w-full px-3 py-2 text-left text-[13px] hover:bg-[#f5f3f3] ${opt === monthYearFilter ? 'bg-[#efeded] font-bold text-[#bd0014]' : 'text-[#1b1c1c]'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button type="button" onClick={handleClearAll} className="ml-auto text-[13px] font-bold text-[#bd0014]">Clear All</button>
        </div>

        {/* Main layout: table + stock dist */}
        <div className="flex flex-col gap-4 xl:flex-row">
          {/* Table */}
          <div className="flex-1 overflow-hidden rounded-[4px] border border-[#e9bcb7] bg-white">
            <div className="max-h-[430px] overflow-x-auto overflow-y-auto">
              <table className="min-w-[800px] w-full">
                <thead className="sticky top-0 z-10 bg-[#efeded]">
                  <tr>
                    {['SPARE PART DETAILS', 'COMPATIBILITY', 'PREDICTED DEMAND', 'CURRENT STOCK', 'STOCK HEALTH', 'DEMAND'].map(h => (
                      <th key={h} className="border-b border-[#e9bcb7] px-4 py-3 text-left text-[11px] font-bold tracking-[0.55px] text-[#5f5e5e]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, i) => (
                    <tr key={i} className="border-b border-[#e9bcb7]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-[2px] bg-[#efeded] text-lg">{row.img}</div>
                          <div>
                            <p className="text-[13px] font-medium text-[#1b1c1c]">{row.name}</p>
                            <p className="font-mono text-[11px] text-[#5f5e5e]">{row.pn}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-[2px] bg-[#efeded] px-2 py-1 text-[11px] font-bold tracking-[0.55px] text-[#5f5e5e]">{row.compat}</span>
                      </td>
                      <td className="px-4 py-3 text-[13px] font-medium text-[#1b1c1c]">{row.demand.toLocaleString()}</td>
                      <td className="px-4 py-3 text-[13px] font-medium" style={{ color: isNightMode && row.stockColor === '#1b1c1c' ? '#ffffff' : row.stockColor }}>{row.stock.toLocaleString()}</td>
                      <td className="px-4 py-3"><HealthBar pct={row.health} /></td>
                      <td className="px-4 py-3">
                        <span className="rounded-[2px] px-2 py-1 text-[10px] font-bold uppercase" style={{ color: row.confColor, backgroundColor: row.confBg }}>
                          {row.conf}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-2 border-t border-[#e9bcb7] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-[13px] text-[#5f5e5e]">Showing 1 – 25 of 1,482 parts</span>
              <div className="flex items-center gap-1">
                {['‹', '1', '2', '3', '...', '›'].map((p, i) => (
                  <button key={i} className={`flex size-8 items-center justify-center rounded-[2px] text-[13px] ${p === '1' ? 'bg-[#bd0014] text-white' : 'text-[#5f5e5e] hover:bg-[#efeded]'}`}>{p}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Stock Distribution */}
          <div className="w-full rounded-[4px] border border-[#e9bcb7] bg-white p-5 xl:w-[260px] xl:flex-shrink-0">
            <p className="mb-4 text-[13px] font-bold text-[#1b1c1c]">Stock Distribution</p>
            <div className="mb-5 flex items-center justify-center">
              <div className="relative flex h-[120px] w-[120px] items-center justify-center">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="48" fill="none" stroke="#e9e8e7" strokeWidth="12"/>
                  <circle cx="60" cy="60" r="48" fill="none" stroke="#22c55e" strokeWidth="12"
                    strokeDasharray={`${0.78 * 2 * Math.PI * 48} ${2 * Math.PI * 48}`}
                    strokeDashoffset={2 * Math.PI * 48 * 0.25}
                    strokeLinecap="round"/>
                  <circle cx="60" cy="60" r="48" fill="none" stroke="#f59e0b" strokeWidth="12"
                    strokeDasharray={`${0.16 * 2 * Math.PI * 48} ${2 * Math.PI * 48}`}
                    strokeDashoffset={2 * Math.PI * 48 * 0.25 - 0.78 * 2 * Math.PI * 48}
                    strokeLinecap="round"/>
                  <circle cx="60" cy="60" r="48" fill="none" stroke="#ef4444" strokeWidth="12"
                    strokeDasharray={`${0.06 * 2 * Math.PI * 48} ${2 * Math.PI * 48}`}
                    strokeDashoffset={2 * Math.PI * 48 * 0.25 - 0.94 * 2 * Math.PI * 48}
                    strokeLinecap="round"/>
                </svg>
                <div className="absolute text-center">
                  <p className="text-[20px] font-black text-[#1b1c1c]">78%</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.55px] text-[#5f5e5e]">OPTIMAL</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { color: '#22c55e', label: 'Optimal', value: '6,420' },
                { color: '#f59e0b', label: 'Reorder Warning', value: '1,240' },
                { color: '#ef4444', label: 'Out of Stock', value: '142' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[13px] text-[#5f5e5e]">{item.label}</span>
                  </div>
                  <span className="text-[13px] font-medium text-[#1b1c1c]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Prediction Queue View ────────────────────────────────────────────────────

const predRows = [
  {
    id: 'ACC-9482-TX', date: '24 Oct 2024, 08:12', vehicle: 'Camry Hybrid', year: 2024,
    parts: [{ name: 'FRONT BUMPER', level: 'High', levelColor: '#15803d' }, { name: 'GRILLE ASSY', level: 'High', levelColor: '#15803d' }, { name: 'L-HEADLIGHT', level: 'Med', levelColor: '#b45309' }], conf: 94, level: 'High', levelColor: '#15803d', dot: '#22c55e',
  },
  {
    id: 'ACC-8110-CA', date: '23 Oct 2024, 14:45', vehicle: 'RAV4 Prime', year: 2023,
    parts: [{ name: 'REAR TAILGATE', level: 'Med', levelColor: '#b45309' }, { name: 'BUMPER COVER', level: 'Low', levelColor: '#b91c1c' }], conf: 72, level: 'Med', levelColor: '#b45309', dot: '#f59e0b',
  },
  {
    id: 'ACC-7231-NY', date: '22 Oct 2024, 09:30', vehicle: 'Tacoma', year: 2024,
    parts: [{ name: 'RADIATOR CORE', level: 'Low', levelColor: '#b91c1c' }, { name: 'HOOD PANEL', level: 'Low', levelColor: '#b91c1c' }, { name: '+2 MORE', level: 'Low', levelColor: '#b91c1c' }], conf: 45, level: 'Low', levelColor: '#b91c1c', dot: '#ef4444',
  },
  {
    id: 'ACC-5529-IL', date: '21 Oct 2024, 11:10', vehicle: 'Corolla Cross', year: 2023,
    parts: [{ name: 'WHEEL ARCH', level: 'High', levelColor: '#15803d' }, { name: 'R-FENDER', level: 'High', levelColor: '#15803d' }], conf: 89, level: 'High', levelColor: '#15803d', dot: '#22c55e',
  },
]

function PredictionQueueView({
  searchTerm,
  onSearchChange,
  onAction,
  userName,
  userRole,
  warehouseName,
  profilePicture,
  onOpenProfile,
  notifications,
  unreadCount,
  showNotifications,
  onToggleNotifications,
  onMarkNotificationsRead,
  isNightMode,
  onToggleNightMode,
}: {
  searchTerm: string
  onSearchChange: (value: string) => void
  onAction: (message: string) => void
  userName: string
  userRole: string
  warehouseName: string
  profilePicture?: string
  onOpenProfile: () => void
  notifications: Array<{ id: number; title: string; detail: string; time: string; read: boolean }>
  unreadCount: number
  showNotifications: boolean
  onToggleNotifications: () => void
  onMarkNotificationsRead: () => void
  isNightMode?: boolean
  onToggleNightMode?: () => void
}) {
  const [queueRows, setQueueRows] = useState(predRows)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedActions, setSelectedActions] = useState<string[]>([])
  const [confidenceFilter, setConfidenceFilter] = useState('All Scores')
  const [yearFilter, setYearFilter] = useState('All Years')
  const [vehicleFilter, setVehicleFilter] = useState('All Models')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const confidenceOptions = ['All Scores', 'High (80+%)', 'Medium (50-79%)', 'Low (<50%)']
  const yearOptions = ['All Years', '2023', '2024', '2025']
  const vehicleOptions = ['All Models', ...Array.from(new Set(queueRows.map(row => row.vehicle)))]

  const filteredRows = queueRows.filter(row => {
    const matchesSearch = [row.id, row.vehicle, row.parts.map(part => part.name).join(' '), row.date].join(' ').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesConfidence = confidenceFilter === 'All Scores' || 
      (confidenceFilter === 'High (80+%)' && row.conf >= 80) ||
      (confidenceFilter === 'Medium (50-79%)' && row.conf >= 50 && row.conf < 80) ||
      (confidenceFilter === 'Low (<50%)' && row.conf < 50)
    const matchesYear = yearFilter === 'All Years' || row.year.toString() === yearFilter
    const matchesVehicle = vehicleFilter === 'All Models' || row.vehicle === vehicleFilter
    return matchesSearch && matchesConfidence && matchesYear && matchesVehicle
  })

  const toggleSelected = (id: string) => {
    setSelectedIds(current =>
      current.includes(id) ? current.filter(item => item !== id) : [...current, id],
    )
  }

  const approveRow = (id: string) => {
    setQueueRows(current => current.filter(row => row.id !== id))
    setSelectedIds(current => current.filter(item => item !== id))
    onAction(`Prediction ${id} approved.`)
  }

  const rejectRow = (id: string) => {
    setQueueRows(current => current.filter(row => row.id !== id))
    setSelectedIds(current => current.filter(item => item !== id))
    onAction(`Prediction ${id} rejected.`)
  }

  const handleSelectedAction = (action: 'approved' | 'rejected') => {
    if (selectedIds.length === 0 && selectedActions.length === 0) {
      onAction(`Select predictions or human actions to ${action}.`)
      return
    }

    setQueueRows(current => current.flatMap(row => {
      if (selectedIds.includes(row.id)) return []
      const remainingParts = row.parts.filter(part => !selectedActions.includes(`${row.id}-${part.name}`))
      return remainingParts.length > 0 ? [{ ...row, parts: remainingParts }] : []
    }))
    setSelectedIds([])
    setSelectedActions([])
    onAction(`Selected ${action}.`)
  }

  const handleApproveSelected = () => {
    handleSelectedAction('approved')
  }

  const handleRejectSelected = () => {
    handleSelectedAction('rejected')
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopNav
        searchPlaceholder="Search orders or parts..."
        value={searchTerm}
        onChange={onSearchChange}
        userName={userName}
        userRole={userRole}
        warehouseName={warehouseName}
        profilePicture={profilePicture}
        onOpenProfile={onOpenProfile}
        notifications={notifications}
        unreadCount={unreadCount}
        showNotifications={showNotifications}
        onToggleNotifications={onToggleNotifications}
        onMarkNotificationsRead={onMarkNotificationsRead}
        isNightMode={isNightMode}
        onToggleNightMode={onToggleNightMode}
      />
      <div className="flex-1 overflow-auto bg-[#fbf9f8] p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-[18px] font-semibold tracking-[-0.18px] text-[#1b1c1c]">AI Prediction Review Queue</h2>
            <p className="mt-0.5 text-[13px] text-[#5f5e5e]">Reviewing cluster-based demand spikes for collision patterns.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={handleApproveSelected} className="flex h-9 items-center gap-2 rounded-[4px] bg-[#bd0014] px-4 text-[11px] font-bold tracking-[0.55px] text-white">
              ✓ Approve Selected
            </button>
            <button type="button" onClick={handleRejectSelected} className="flex h-9 items-center gap-2 rounded-[4px] border border-[#e9bcb7] bg-white px-4 text-[11px] font-bold tracking-[0.55px] text-[#1b1c1c]">
              ✕ Reject Selected
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-[4px] border border-[#e9bcb7] bg-white p-3">
          {/* Confidence Score Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[#5f5e5e]">Demand Level</span>
            <div className="relative">
              <button type="button" onClick={() => setOpenDropdown(openDropdown === 'confidence' ? null : 'confidence')} className="flex h-8 min-w-[120px] items-center gap-1 rounded-[4px] border border-[#e9bcb7] bg-[#f5f3f3] px-3 text-[13px] text-[#1b1c1c]">
                {confidenceFilter} <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#5f5e5e" strokeWidth="1.5"/></svg>
              </button>
              {openDropdown === 'confidence' && (
                <div className="absolute top-10 left-0 z-20 min-w-[140px] rounded-[4px] border border-[#e9bcb7] bg-white shadow-lg">
                  {confidenceOptions.map(opt => (
                    <button key={opt} type="button" onClick={() => { setConfidenceFilter(opt); setOpenDropdown(null); }} className={`block w-full px-3 py-2 text-left text-[13px] hover:bg-[#f5f3f3] ${opt === confidenceFilter ? 'bg-[#efeded] font-bold text-[#bd0014]' : 'text-[#1b1c1c]'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Model Year Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[#5f5e5e]">Model Year</span>
            <div className="relative">
              <button type="button" onClick={() => setOpenDropdown(openDropdown === 'year' ? null : 'year')} className="flex h-8 min-w-[100px] items-center gap-1 rounded-[4px] border border-[#e9bcb7] bg-[#f5f3f3] px-3 text-[13px] text-[#1b1c1c]">
                {yearFilter} <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#5f5e5e" strokeWidth="1.5"/></svg>
              </button>
              {openDropdown === 'year' && (
                <div className="absolute top-10 left-0 z-20 min-w-[100px] rounded-[4px] border border-[#e9bcb7] bg-white shadow-lg">
                  {yearOptions.map(opt => (
                    <button key={opt} type="button" onClick={() => { setYearFilter(opt); setOpenDropdown(null); }} className={`block w-full px-3 py-2 text-left text-[13px] hover:bg-[#f5f3f3] ${opt === yearFilter ? 'bg-[#efeded] font-bold text-[#bd0014]' : 'text-[#1b1c1c]'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Model Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[#5f5e5e]">Vehicle Model</span>
            <div className="relative">
              <button type="button" onClick={() => setOpenDropdown(openDropdown === 'vehicle' ? null : 'vehicle')} className="flex h-8 min-w-[130px] items-center gap-1 rounded-[4px] border border-[#e9bcb7] bg-[#f5f3f3] px-3 text-[13px] text-[#1b1c1c]">
                {vehicleFilter} <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#5f5e5e" strokeWidth="1.5"/></svg>
              </button>
              {openDropdown === 'vehicle' && (
                <div className="absolute top-10 left-0 z-20 min-w-[140px] rounded-[4px] border border-[#e9bcb7] bg-white shadow-lg">
                  {vehicleOptions.map(opt => (
                    <button key={opt} type="button" onClick={() => { setVehicleFilter(opt); setOpenDropdown(null); }} className={`block w-full px-3 py-2 text-left text-[13px] hover:bg-[#f5f3f3] ${opt === vehicleFilter ? 'bg-[#efeded] font-bold text-[#bd0014]' : 'text-[#1b1c1c]'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button type="button" onClick={() => { setConfidenceFilter('All Scores'); setYearFilter('All Years'); setVehicleFilter('All Models'); onSearchChange(''); }} className="ml-auto text-[13px] font-bold text-[#bd0014]">Clear All Filters</button>
        </div>

        {/* Table */}
        <div className="mb-6 overflow-hidden rounded-[4px] border border-[#e9bcb7] bg-white">
          <div className="max-h-[430px] overflow-x-auto overflow-y-auto">
            <table className="min-w-[820px] w-full">
              <thead className="sticky top-0 z-10 bg-[#efeded]">
                <tr>
                  <th className="w-8 px-4 py-3"><input type="checkbox" checked={selectedIds.length > 0 && selectedIds.length === filteredRows.length} onChange={() => {
                    if (selectedIds.length === filteredRows.length) {
                      setSelectedIds([])
                    } else {
                      setSelectedIds(filteredRows.map(row => row.id))
                    }
                  }} className="size-4" /></th>
                  {['ACCIDENT ID / DATE', 'VEHICLE TYPE', 'PREDICTED PARTS NEEDED', 'DEMAND', 'HUMAN ACTION'].map(h => (
                    <th key={h} className="border-b border-[#e9bcb7] px-4 py-3 text-left text-[11px] font-bold tracking-[0.55px] text-[#5f5e5e]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, i) => (
                  <tr key={i} className="border-b border-[#e9bcb7]">
                    <td className="px-4 py-4"><input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleSelected(row.id)} className="size-4" /></td>
                    <td className="px-4 py-4">
                      <p className="text-[13px] font-semibold text-[#1b1c1c]">{row.id}</p>
                      <p className="mt-0.5 text-[11px] text-[#5f5e5e]">{row.date}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-[13px] font-medium text-[#1b1c1c]">{row.vehicle}</p>
                      <p className="text-[11px] text-[#5f5e5e]">Model Year: {row.year}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {row.parts.map(part => (
                          <span key={part.name} className="rounded-[2px] bg-[#efeded] px-2 py-1 text-[11px] font-bold tracking-[0.5px] text-[#5f5e5e]">{part.name}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        {row.parts.map(part => <span key={part.name} className="text-[11px] font-bold" style={{ color: part.levelColor }}>{part.level}</span>)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        {row.parts.map(part => {
                          const actionId = `${row.id}-${part.name}`
                          return <label key={actionId} className="flex h-[22px] items-center"><input aria-label={`Human action for ${part.name}`} type="checkbox" checked={selectedActions.includes(actionId)} onChange={() => setSelectedActions(current => current.includes(actionId) ? current.filter(id => id !== actionId) : [...current, actionId])} className="size-4 accent-[#bd0014]" /></label>
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-2 border-t border-[#e9bcb7] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[13px] text-[#5f5e5e]">Showing 4 of 128 predictions</span>
            <div className="flex items-center gap-1">
              {['‹', '1', '2', '3', '›'].map((p, i) => (
                <button key={i} className={`flex size-8 items-center justify-center rounded-[2px] text-[13px] ${p === '1' ? 'bg-[#bd0014] text-white' : 'text-[#5f5e5e] hover:bg-[#efeded]'}`}>{p}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total Queue', value: '128', sub: '↓ -12% vs last week', subColor: '#22c55e', border: '#e9bcb7' },
            { label: 'Avg. Confidence', value: '78.4%', sub: 'Stable accuracy margin', subColor: '#5f5e5e', border: '#e9bcb7' },
            { label: 'Approval Rate', value: '91%', sub: '⭐ High AI performance', subColor: '#15803d', border: '#e9bcb7' },
            { label: 'Pending Manual Action', value: '14', sub: 'Requires immediate review', subColor: '#bd0014', border: '#bd0014' },
          ].map(s => (
            <div key={s.label} className="rounded-[4px] bg-white p-4" style={{ border: `1px solid ${s.border}` }}>
              <p className="mb-1 text-[13px] text-[#5f5e5e]">{s.label}</p>
              <p className="text-[28px] font-black leading-none text-[#1b1c1c]">{s.value}</p>
              <p className="mt-2 text-[11px] font-medium" style={{ color: s.subColor }}>{s.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Inventory & Fulfillment View ─────────────────────────────────────────────

const workshops = [
  { org: 'Anods Workshop', name: 'Workshop #012', addedDate: '2026-01-12', pending: 24, urgent: '8 CRITICAL', urgentColor: '#bd0014', urgentBg: '#fef2f2', transit: '4 SKUS' },
  { org: 'Kali Service', name: 'Workshop #045', addedDate: '2026-02-03', pending: 11, urgent: '0 ALERT', urgentColor: '#b45309', urgentBg: '#fffbeb', transit: '12 SKUS' },
  { org: 'Toyota City Hub', name: 'Workshop #008', addedDate: '2026-02-18', pending: 56, urgent: '15 CRITICAL', urgentColor: '#bd0014', urgentBg: '#fef2f2', transit: '2 SKUS' },
]

const fulfillRows = [
  { id: 'fulfill-1', workshop: 'Workshop #012 – Anods', parts: [{ name: 'Bumper (Front)', sku: 'TOY-7782-BRK', qty: 2, unitPrice: 18500 }, { name: 'Front Grille', sku: 'TOY-7782-GRL', qty: 2, unitPrice: 9500 }], status: 'PENDING' },
  { id: 'fulfill-2', workshop: 'Workshop #008 – Toyota City Hub', parts: [{ name: 'R Fender', sku: 'PRI-4401-CLT', qty: 1, unitPrice: 32000 }], status: 'IN TRANSIT' },
  { id: 'fulfill-3', workshop: 'Workshop #045 – Kali', parts: [{ name: 'LED Headlamp Unit (L)', sku: 'LEX-9003-LIT', qty: 2, unitPrice: 28500 }], status: 'IN TRANSIT' },
  { id: 'fulfill-4', workshop: 'Workshop #012 – Anods', parts: [{ name: 'L Side Mirror', sku: 'TOY-2211-SUS', qty: 12, unitPrice: 8500 }], status: 'PENDING' },
]

const chartBars = [
  { day: 'Mon', val: 72 }, { day: 'Tue', val: 80 }, { day: 'Wed', val: 96 }, { day: 'Thu', val: 65 }, { day: 'Fri', val: 58 }, { day: 'Sat', val: 70 },
]

function InventoryFulfillmentView({
  searchTerm,
  onSearchChange,
  onAction,
  userName,
  userRole,
  warehouseName,
  profilePicture,
  onOpenProfile,
  notifications,
  unreadCount,
  showNotifications,
  onToggleNotifications,
  onMarkNotificationsRead,
  isNightMode,
  onToggleNightMode,
}: {
  searchTerm: string
  onSearchChange: (value: string) => void
  onAction: (message: string) => void
  userName: string
  userRole: string
  warehouseName: string
  profilePicture?: string
  onOpenProfile: () => void
  notifications: Array<{ id: number; title: string; detail: string; time: string; read: boolean }>
  unreadCount: number
  showNotifications: boolean
  onToggleNotifications: () => void
  onMarkNotificationsRead: () => void
  isNightMode?: boolean
  onToggleNightMode?: () => void
}) {
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [workshopFilter, setWorkshopFilter] = useState('All Workshops')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [showAddWorkshop, setShowAddWorkshop] = useState(false)
  const [showWorkshopDetails, setShowWorkshopDetails] = useState(false)
  const [workshopCards, setWorkshopCards] = useState(workshops)
  const [workshopForm, setWorkshopForm] = useState({ org: '', name: '', addedDate: new Date().toISOString().slice(0, 10) })
  const [orderForm, setOrderForm] = useState({
    workshopName: '',
    parts: [{ partNameNo: '', vehicleModel: '', makeYear: '', quantity: '', unitPrice: '' }],
  })
  const [fulfillmentRows, setFulfillmentRows] = useState(fulfillRows)
  const [selectedFulfillmentIds, setSelectedFulfillmentIds] = useState<string[]>([])

  const handleAddWorkshop = () => {
    const organizationName = workshopForm.org.trim()
    const workshopName = workshopForm.name.trim()
    if (!organizationName || !workshopName) {
      onAction('Enter an organization name and workshop name.')
      return
    }

    setWorkshopCards(current => [
      {
        org: organizationName,
        name: workshopName,
        addedDate: workshopForm.addedDate,
        pending: 0,
        urgent: '0 ALERT',
        urgentColor: '#b45309',
        urgentBg: '#fffbeb',
        transit: '0 SKUS',
      },
      ...current,
    ])
    setWorkshopForm({ org: '', name: '', addedDate: new Date().toISOString().slice(0, 10) })
    setShowWorkshopDetails(false)
    onAction(`${workshopName} added successfully.`)
  }

  const handleCreateOrder = () => {
    const workshopName = orderForm.workshopName.trim()
    const parts = orderForm.parts
      .filter(part => part.vehicleModel.trim() && part.makeYear.trim())
      .map((part, index) => ({
        name: part.partNameNo.trim() || part.vehicleModel.trim(),
        sku: part.partNameNo.trim() || `MAKE YEAR: ${part.makeYear.trim()}`,
        makeYear: part.makeYear.trim(),
        qty: Number(part.quantity) || 0,
        unitPrice: Number(part.unitPrice) || 0,
      }))

    if (!workshopName || parts.length === 0) {
      onAction('Enter a workshop name and at least one part.')
      return
    }

    setFulfillmentRows(rows => [
      {
        id: `fulfill-${Date.now()}`,
        workshop: workshopName,
        parts,
        status: 'PENDING',
      },
      ...rows,
    ])
    setOrderForm({ workshopName: '', parts: [{ partNameNo: '', vehicleModel: '', makeYear: '', quantity: '', unitPrice: '' }] })
    setShowAddWorkshop(false)
    onAction(`New order for ${workshopName} added successfully.`)
  }

  const statusOptions = ['All Status', 'PENDING', 'IN TRANSIT']
  const workshopOptions = ['All Workshops', ...workshopCards.map(workshop => workshop.name)]

  const filteredRows = fulfillmentRows.filter(row => {
    const matchesSearch = [row.workshop, row.status, ...row.parts.flatMap(part => [part.name, part.sku])].join(' ').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All Status' || row.status === statusFilter
    const matchesWorkshop = workshopFilter === 'All Workshops' || row.workshop.includes(workshopFilter)
    return matchesSearch && matchesStatus && matchesWorkshop
  })

  const fulfillSelectedOrders = () => {
    if (selectedFulfillmentIds.length === 0) return
    setFulfillmentRows(rows => rows.filter(row => !selectedFulfillmentIds.includes(row.id)))
    setSelectedFulfillmentIds([])
    onAction('Selected fulfillment orders cleared.')
  }

  const updateFulfillmentStatus = (rowId: string, status: 'PENDING' | 'IN TRANSIT') => {
    setFulfillmentRows(rows => rows.map(row => row.id === rowId ? { ...row, status } : row))
  }

  const clearFulfillmentRow = (rowId: string) => {
    setFulfillmentRows(rows => rows.filter(row => row.id !== rowId))
    setSelectedFulfillmentIds(current => current.filter(id => id !== rowId))
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopNav
        searchPlaceholder="Search inventory..."
        value={searchTerm}
        onChange={onSearchChange}
        userName={userName}
        userRole={userRole}
        warehouseName={warehouseName}
        profilePicture={profilePicture}
        onOpenProfile={onOpenProfile}
        notifications={notifications}
        unreadCount={unreadCount}
        showNotifications={showNotifications}
        onToggleNotifications={onToggleNotifications}
        onMarkNotificationsRead={onMarkNotificationsRead}
        isNightMode={isNightMode}
        onToggleNightMode={onToggleNightMode}
      />
      <div className="flex-1 overflow-auto bg-[#fbf9f8] p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-[18px] font-semibold tracking-[-0.18px] text-[#1b1c1c]">Multi-Workshop Fulfillment</h2>
            <p className="mt-0.5 text-[13px] text-[#5f5e5e]">Monitoring real-time stock allocation across workshops.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Dropdown */}
            <div className="relative">
              <button type="button" onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')} className="flex h-9 items-center gap-2 rounded-[4px] border border-[#e9bcb7] bg-white px-4 text-[11px] font-bold tracking-[0.55px] text-[#1b1c1c]">
                Status: {statusFilter} <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#5f5e5e" strokeWidth="1.5"/></svg>
              </button>
              {openDropdown === 'status' && (
                <div className="absolute top-11 left-0 z-20 min-w-[140px] rounded-[4px] border border-[#e9bcb7] bg-white shadow-lg">
                  {statusOptions.map(opt => (
                    <button key={opt} type="button" onClick={() => { setStatusFilter(opt); setOpenDropdown(null); }} className={`block w-full px-3 py-2 text-left text-[13px] hover:bg-[#f5f3f3] ${opt === statusFilter ? 'bg-[#efeded] font-bold text-[#bd0014]' : 'text-[#1b1c1c]'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Workshop Dropdown */}
            <div className="relative">
              <button type="button" onClick={() => setOpenDropdown(openDropdown === 'workshop' ? null : 'workshop')} className="flex h-9 items-center gap-2 rounded-[4px] border border-[#e9bcb7] bg-white px-4 text-[11px] font-bold tracking-[0.55px] text-[#1b1c1c]">
                Workshop: {workshopFilter} <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#5f5e5e" strokeWidth="1.5"/></svg>
              </button>
              {openDropdown === 'workshop' && (
                <div className="absolute top-11 left-0 z-20 min-w-[150px] rounded-[4px] border border-[#e9bcb7] bg-white shadow-lg">
                  {workshopOptions.map(opt => (
                    <button key={opt} type="button" onClick={() => { setWorkshopFilter(opt); setOpenDropdown(null); }} className={`block w-full px-3 py-2 text-left text-[13px] hover:bg-[#f5f3f3] ${opt === workshopFilter ? 'bg-[#efeded] font-bold text-[#bd0014]' : 'text-[#1b1c1c]'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button type="button" onClick={() => setShowWorkshopDetails(true)} className="flex h-9 items-center gap-2 rounded-[4px] border border-[#e9bcb7] bg-white px-4 text-[11px] font-bold tracking-[0.55px] text-[#1b1c1c]">
              + Add Workshop
            </button>

            <button type="button" onClick={() => setShowAddWorkshop(true)} className="flex h-9 items-center gap-2 rounded-[4px] bg-[#bd0014] px-4 text-[11px] font-bold tracking-[0.55px] text-white">
              + New Orders for Workshop
            </button>
          </div>
        </div>

        {showWorkshopDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
            <div className="w-full max-w-xl rounded-[18px] border border-[#e9bcb7] bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-[#bd0014]">Workshop directory</p>
                  <h3 className="mt-1 text-[24px] font-black tracking-[-0.5px] text-[#1b1c1c]">Add workshop details</h3>
                </div>
                <button type="button" onClick={() => setShowWorkshopDetails(false)} className="text-[24px] leading-none text-[#5f5e5e]">×</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.5px] text-[#5f5e5e]">Organization name</label>
                  <input value={workshopForm.org} onChange={event => setWorkshopForm(current => ({ ...current, org: event.target.value }))} placeholder="Enter organization name" className="h-11 w-full rounded-[10px] border border-[#e9bcb7] bg-[#f8f4f3] px-3 text-[14px] text-[#1b1c1c] outline-none focus:border-[#bd0014]" />
                </div>
                <div>
                  <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.5px] text-[#5f5e5e]">Workshop name</label>
                  <input value={workshopForm.name} onChange={event => setWorkshopForm(current => ({ ...current, name: event.target.value }))} placeholder="Enter workshop name" className="h-11 w-full rounded-[10px] border border-[#e9bcb7] bg-[#f8f4f3] px-3 text-[14px] text-[#1b1c1c] outline-none focus:border-[#bd0014]" />
                </div>
                <div>
                  <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.5px] text-[#5f5e5e]">Added date</label>
                  <input value={workshopForm.addedDate} readOnly className="h-11 w-full cursor-not-allowed rounded-[10px] border border-[#e9bcb7] bg-[#efeded] px-3 text-[14px] text-[#5f5e5e] outline-none" />
                </div>
              </div>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setShowWorkshopDetails(false)} className="rounded-[8px] border border-[#e9bcb7] bg-white px-4 py-2 text-[12px] font-bold uppercase tracking-[0.55px] text-[#1b1c1c]">Cancel</button>
                <button type="button" onClick={handleAddWorkshop} className="rounded-[8px] bg-[#bd0014] px-4 py-2 text-[12px] font-bold uppercase tracking-[0.55px] text-white">Add workshop</button>
              </div>
            </div>
          </div>
        )}

        {showAddWorkshop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
            <div className="w-full max-w-5xl rounded-[18px] border border-[#e9bcb7] bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-[#bd0014]">Fulfillment order</p>
                  <h3 className="mt-1 text-[24px] font-black tracking-[-0.5px] text-[#1b1c1c]">New orders for workshop</h3>
                </div>
                <button type="button" onClick={() => setShowAddWorkshop(false)} className="text-[24px] leading-none text-[#5f5e5e]">×</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.5px] text-[#5f5e5e]">Workshop name</label>
                  <input value={orderForm.workshopName} onChange={event => setOrderForm(current => ({ ...current, workshopName: event.target.value }))} placeholder="Enter workshop name" className="h-11 w-full rounded-[10px] border border-[#e9bcb7] bg-[#f8f4f3] px-3 text-[14px] text-[#1b1c1c] outline-none focus:border-[#bd0014]" />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-[12px] font-bold uppercase tracking-[0.5px] text-[#5f5e5e]">Part details</label>
                    <button type="button" onClick={() => setOrderForm(current => ({ ...current, parts: [...current.parts, { partNameNo: '', vehicleModel: '', makeYear: '', quantity: '', unitPrice: '' }] }))} className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#bd0014]">+ Add part</button>
                  </div>
                  <div className="space-y-3">
                    {orderForm.parts.map((part, index) => (
                      <div key={index} className="grid gap-3 rounded-[8px] border border-[#e9bcb7] bg-[#fbf9f8] p-3 sm:grid-cols-[minmax(150px,1.4fr)_minmax(140px,1.1fr)_minmax(110px,0.8fr)_minmax(100px,0.7fr)_minmax(150px,1fr)_auto]">
                        <input value={part.partNameNo} onChange={event => setOrderForm(current => ({ ...current, parts: current.parts.map((item, itemIndex) => itemIndex === index ? { ...item, partNameNo: event.target.value } : item) }))} placeholder="Part name / No" className="h-10 rounded-[8px] border border-[#e9bcb7] bg-white px-3 text-[13px] text-[#1b1c1c] outline-none focus:border-[#bd0014]" />
                        <input value={part.vehicleModel} onChange={event => setOrderForm(current => ({ ...current, parts: current.parts.map((item, itemIndex) => itemIndex === index ? { ...item, vehicleModel: event.target.value } : item) }))} placeholder="Vehicle model" className="h-10 rounded-[8px] border border-[#e9bcb7] bg-white px-3 text-[13px] text-[#1b1c1c] outline-none focus:border-[#bd0014]" />
                        <input value={part.makeYear} onChange={event => setOrderForm(current => ({ ...current, parts: current.parts.map((item, itemIndex) => itemIndex === index ? { ...item, makeYear: event.target.value } : item) }))} placeholder="Make year" className="h-10 rounded-[8px] border border-[#e9bcb7] bg-white px-3 text-[13px] text-[#1b1c1c] outline-none focus:border-[#bd0014]" />
                        <input type="number" min="0" value={part.quantity} onChange={event => setOrderForm(current => ({ ...current, parts: current.parts.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: event.target.value } : item) }))} placeholder="Quantity" className="h-10 rounded-[8px] border border-[#e9bcb7] bg-white px-3 text-[13px] text-[#1b1c1c] outline-none focus:border-[#bd0014]" />
                        <input type="number" min="0" value={part.unitPrice} onChange={event => setOrderForm(current => ({ ...current, parts: current.parts.map((item, itemIndex) => itemIndex === index ? { ...item, unitPrice: event.target.value } : item) }))} placeholder="Unit price" className="h-10 rounded-[8px] border border-[#e9bcb7] bg-white px-3 text-[13px] text-[#1b1c1c] outline-none focus:border-[#bd0014]" />
                        <button type="button" disabled={orderForm.parts.length === 1} onClick={() => setOrderForm(current => ({ ...current, parts: current.parts.filter((_, itemIndex) => itemIndex !== index) }))} className="h-10 px-2 text-[20px] leading-none text-[#5f5e5e] disabled:opacity-30">×</button>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-right text-[13px] font-bold text-[#1b1c1c]">Total: LKR {orderForm.parts.reduce((total, part) => total + (Number(part.quantity) || 0) * (Number(part.unitPrice) || 0), 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setShowAddWorkshop(false)} className="rounded-[8px] border border-[#e9bcb7] bg-white px-4 py-2 text-[12px] font-bold uppercase tracking-[0.55px] text-[#1b1c1c]">
                  Cancel
                </button>
                <button type="button" onClick={handleCreateOrder} className="rounded-[8px] bg-[#bd0014] px-4 py-2 text-[12px] font-bold uppercase tracking-[0.55px] text-white">
                  Create order
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Workshop cards */}
        <div className="mb-6 flex gap-4 overflow-x-auto pb-2">
          {workshopCards.map(w => (
            <div key={w.name} className="min-w-[280px] flex-1 rounded-[4px] border border-[#e9bcb7] bg-white p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.55px] text-[#5f5e5e]">{w.org}</p>
              <p className="mt-1 text-[18px] font-black tracking-[-0.18px] text-[#1b1c1c]">{w.name}</p>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-[#5f5e5e]">Pending Requests</p>
                  <p className="text-[24px] font-black text-[#1b1c1c]">{w.pending}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><path d="M0 2h10v8H0V2zM10 4l6 3-6 3V4z" fill="#3b82f6"/></svg>
                <span className="text-[11px] font-bold tracking-[0.55px] text-[#3b82f6]">IN TRANSIT: {w.transit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Active Fulfillment Queue */}
        <div className="mb-6 overflow-hidden rounded-[4px] border border-[#e9bcb7] bg-white">
          <div className="flex flex-col gap-2 border-b border-[#e9bcb7] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[13px] font-bold text-[#1b1c1c]">Active Fulfillment Queue</span>
          </div>
          <div className="max-h-[430px] overflow-x-auto overflow-y-auto">
            <table className="min-w-[1120px] w-full">
              <thead className="sticky top-0 z-10 bg-[#efeded]">
                <tr>
                  {['REQUESTING WORKSHOP', 'PART DETAILS', 'QUANTITY', 'UNIT PRICE', 'TOTAL', 'STATUS', 'FULFILL STATUS', ''].map(h => (
                    <th key={h} className="border-b border-[#e9bcb7] px-4 py-3 text-left text-[11px] font-bold tracking-[0.55px] text-[#5f5e5e]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map(row => (
                  <tr key={row.id} className="border-b border-[#e9bcb7]">
                    <td className="px-4 py-4 text-[13px] text-[#5f5e5e]">{row.workshop}</td>
                    <td className="px-4 py-4">
                      {row.parts.map(part => (
                        <div key={part.sku} className="mb-1 last:mb-0">
                          <p className="text-[13px] font-semibold text-[#1b1c1c]">{part.name}</p>
                          <p className="font-mono text-[11px] text-[#5f5e5e]">SKU: {part.sku}</p>
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-4 text-[13px] font-bold text-[#1b1c1c]">
                      {row.parts.map(part => <div key={part.sku} className="mb-1 last:mb-0">{String(part.qty).padStart(2, '0')}</div>)}
                    </td>
                    <td className="px-4 py-4 text-[13px] text-[#5f5e5e]">
                      {row.parts.map(part => <div key={part.sku} className="mb-1 last:mb-0">LKR {part.unitPrice.toLocaleString()}</div>)}
                    </td>
                    <td className="px-4 py-4 text-[13px] font-bold text-[#1b1c1c]">LKR {row.parts.reduce((total, part) => total + part.qty * part.unitPrice, 0).toLocaleString()}</td>
                    <td className="px-4 py-4">
                      <select
                        aria-label={`Update status for ${row.parts.map(part => part.name).join(', ')}`}
                        value={row.status}
                        onChange={event => updateFulfillmentStatus(row.id, event.target.value as 'PENDING' | 'IN TRANSIT')}
                        className={`rounded-[2px] border-0 px-2 py-1 text-[11px] font-bold outline-none ${row.status === 'IN TRANSIT' ? 'bg-[#f0fdf4] text-[#15803d]' : 'bg-[#fffbeb] text-[#b45309]'}`}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="IN TRANSIT">IN TRANSIT</option>
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <input
                        aria-label={`Fulfill ${row.parts.map(part => part.name).join(', ')}`}
                        type="checkbox"
                        checked={selectedFulfillmentIds.includes(row.id)}
                        onChange={() => setSelectedFulfillmentIds(current => current.includes(row.id) ? current.filter(id => id !== row.id) : [...current, row.id])}
                        className="size-4 accent-[#bd0014]"
                      />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button type="button" aria-label={`Clear ${row.parts.map(part => part.name).join(', ')}`} onClick={() => clearFulfillmentRow(row.id)} className="flex size-7 items-center justify-center rounded-[2px] text-[18px] leading-none text-[#5f5e5e] hover:bg-[#fef2f2] hover:text-[#bd0014]">×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-2 border-t border-[#e9bcb7] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[13px] text-[#5f5e5e]">Showing {filteredRows.length} of 128 open fulfillment requests</span>
            <div className="flex items-center gap-3">
              <button type="button" aria-label="Previous page" className="flex size-8 items-center justify-center rounded-[2px] text-[13px] text-[#5f5e5e] hover:bg-[#efeded]">‹</button>
              {['1', '2', '3'].map((p, i) => (
                <button key={i} className={`flex size-8 items-center justify-center rounded-[2px] text-[13px] ${p === '1' ? 'bg-[#bd0014] text-white' : 'text-[#5f5e5e] hover:bg-[#efeded]'}`}>{p}</button>
              ))}
              <button type="button" aria-label="Next page" className="flex size-8 items-center justify-center rounded-[2px] text-[13px] text-[#5f5e5e] hover:bg-[#efeded]">›</button>
              <button type="button" onClick={fulfillSelectedOrders} disabled={selectedFulfillmentIds.length === 0} className="rounded-[2px] bg-[#bd0014] px-3 py-2 text-[11px] font-bold tracking-[0.55px] text-white disabled:cursor-not-allowed disabled:opacity-40">
                FULFILL ORDERS
              </button>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col gap-4 xl:flex-row">
          {/* Chart */}
          <div className="flex-1 rounded-[4px] border border-[#e9bcb7] bg-white p-5">
            <p className="mb-6 text-[13px] font-bold text-[#1b1c1c]">Logistics Optimization History</p>
            <div className="flex h-32 items-end gap-4">
              {chartBars.map(b => (
                <div key={b.day} className="flex flex-1 flex-col items-center gap-1">
                  {b.val === 96 && <span className="text-[11px] text-[#5f5e5e]">96%</span>}
                  <div
                    className="w-full rounded-t-[2px]"
                    style={{ height: `${b.val}%`, backgroundColor: b.val === 96 ? '#bd0014' : '#e9e8e7' }}
                  />
                  <span className="text-[11px] text-[#5f5e5e]">{b.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Regional Fulfillment Rate */}
          <div className="flex w-full flex-col rounded-[4px] bg-[#bd0014] p-6 xl:w-[280px] xl:flex-shrink-0">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.55px] text-white">Regional Fulfillment Rate</p>
            <p className="mb-4 text-[48px] font-black leading-none tracking-[-1px] text-white">94.2%</p>
            <div className="mt-auto flex flex-col gap-2">
              {[['Avg. Response Time', '14.2m'], ['Inventory Accuracy', '99.8%']].map(([l, v]) => (
                <div key={l} className="flex items-center justify-between">
                  <span className="text-[13px] text-white opacity-80">{l}</span>
                  <span className="text-[13px] font-bold text-white">{v}</span>
                </div>
              ))}
            </div>
            <button className="mt-4 h-9 w-full rounded-[2px] bg-white text-[11px] font-bold tracking-[0.55px] text-[#bd0014]">
              Download Performance Report
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Purchase Orders View ─────────────────────────────────────────────────────

const poRows = [
  { supplier: 'Adison Co.', vehicle: 'Camry (2024)', part: 'Bumper / 88460-47150', qty: 450, unitPrice: 12400, demand: 'HIGH' },
  { supplier: 'Denso Corp.', vehicle: 'Corolla (2023)', part: 'Bonnet / 16400-0T040', qty: 120, unitPrice: 28150, demand: 'HIGH' },
  { supplier: 'Sumitomo Electric', vehicle: 'RAV4 (2024)', part: 'R Fender / 82121-02E00', qty: 85, unitPrice: 45000, demand: 'MEDIUM' },
  { supplier: 'Tokai Rika', vehicle: 'Tacoma (2023)', part: 'L Door Rear / 84820-02190', qty: 120, unitPrice: 4200, demand: 'HIGH' },
  { supplier: 'Toyota Parts Co.', vehicle: 'Highlander (2024)', part: 'Headlamp / 81110-0E120', qty: 64, unitPrice: 38500, demand: 'HIGH' },
  { supplier: 'Aisin Seiki', vehicle: 'Camry (2023)', part: 'Brake Pad / 04465-33480', qty: 210, unitPrice: 7800, demand: 'MEDIUM' },
  { supplier: 'Koito Manufacturing', vehicle: 'RAV4 (2023)', part: 'Fog Lamp / 81210-0R040', qty: 96, unitPrice: 11200, demand: 'LOW' },
  { supplier: 'Denso Corp.', vehicle: 'Corolla Cross (2024)', part: 'Radiator / 16400-0V240', qty: 48, unitPrice: 26500, demand: 'MEDIUM' },
]

function PurchaseOrdersView({
  searchTerm,
  onSearchChange,
  onAction,
  addedRows,
  userName,
  userRole,
  warehouseName,
  profilePicture,
  onOpenProfile,
  notifications,
  unreadCount,
  showNotifications,
  onToggleNotifications,
  onMarkNotificationsRead,
  isNightMode,
  onToggleNightMode,
}: {
  searchTerm: string
  onSearchChange: (value: string) => void
  onAction: (message: string) => void
  addedRows: typeof poRows
  userName: string
  userRole: string
  warehouseName: string
  profilePicture?: string
  onOpenProfile: () => void
  notifications: Array<{ id: number; title: string; detail: string; time: string; read: boolean }>
  unreadCount: number
  showNotifications: boolean
  onToggleNotifications: () => void
  onMarkNotificationsRead: () => void
  isNightMode?: boolean
  onToggleNightMode?: () => void
}) {
  const [rows, setRows] = useState([...poRows, ...addedRows])
  const [shippingCost, setShippingCost] = useState('145000')

  React.useEffect(() => {
    setRows(current => {
      const existingKeys = new Set(current.map(row => `${row.supplier}-${row.part}`))
      const newRows = addedRows.filter(row => !existingKeys.has(`${row.supplier}-${row.part}`))
      return newRows.length > 0 ? [...current, ...newRows] : current
    })
  }, [addedRows])

  const filteredRows = rows.filter(row =>
    [row.supplier, row.vehicle, row.part, row.demand].join(' ').toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalOrderValue = filteredRows.reduce((total, row) => total + row.qty * row.unitPrice, 0)
  const totalQuantity = filteredRows.reduce((total, row) => total + row.qty, 0)
  const totalWithShipping = totalOrderValue + (Number(shippingCost) || 0)
  const budgetProgress = Math.min(100, Math.round((totalWithShipping / 23000000) * 100))

  const finalizeOrder = () => {
    setRows([])
    setShippingCost('0')
    onAction('Purchase order finalized. Table and summary cleared.')
  }

  const updateQty = (index: number, nextValue: string) => {
    const numeric = nextValue === '' ? 0 : Number(nextValue)
    setRows(current => current.map((row, rowIndex) =>
      rowIndex === index ? { ...row, qty: Number.isFinite(numeric) ? numeric : 0 } : row,
    ))
  }

  const clearRow = (rowToClear: typeof poRows[number]) => {
    setRows(current => current.filter(row => row !== rowToClear))
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopNav
        searchPlaceholder="Search POs, SKU, Suppliers..."
        value={searchTerm}
        onChange={onSearchChange}
        userName={userName}
        userRole={userRole}
        warehouseName={warehouseName}
        profilePicture={profilePicture}
        onOpenProfile={onOpenProfile}
        notifications={notifications}
        unreadCount={unreadCount}
        showNotifications={showNotifications}
        onToggleNotifications={onToggleNotifications}
        onMarkNotificationsRead={onMarkNotificationsRead}
        isNightMode={isNightMode}
        onToggleNightMode={onToggleNightMode}
      />
      <div className="flex-1 overflow-auto bg-[#fbf9f8] p-4 sm:p-6 lg:p-8">
        <div className="flex min-h-full flex-col gap-8">
          {/* Left: table */}
          <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-[18px] font-semibold tracking-[-0.18px] text-[#1b1c1c]">Purchase Order Draft</h2>
                <p className="mt-0.5 text-[13px] text-[#5f5e5e]">PO-2024-0892 • Created from AI Prediction Queue</p>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-[2px] border border-[#e9bcb7] bg-white">
              <div className="max-h-[430px] overflow-x-auto overflow-y-auto">
                <table className="min-w-[1120px] w-full">
                  <thead className="sticky top-0 z-10 bg-[#efeded]">
                    <tr>
                      {['SUPPLIER NAME', 'VEHICLE MODEL / YEAR', 'PART NAME / NO', 'QUANTITY', 'UNIT PRICE', 'TOTAL PRICE', 'DEMAND LEVEL', ''].map(h => (
                        <th key={h} className="border-b border-[#e9bcb7] px-4 py-3 text-left text-[11px] font-bold tracking-[0.55px] text-[#5f5e5e]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, i) => (
                      <tr key={`${row.supplier}-${row.part}`} className="border-b border-[#e9bcb7]">
                        <td className="px-4 py-4 text-[13px] font-medium text-[#1b1c1c]">{row.supplier}</td>
                        <td className="px-4 py-4 text-[13px] text-[#1b1c1c]">{row.vehicle}</td>
                        <td className="px-4 py-4 font-mono text-[12px] text-[#1b1c1c]">{row.part}</td>
                        <td className="px-4 py-4 text-[13px] font-medium text-[#1b1c1c]">{row.qty.toLocaleString()}</td>
                        <td className="px-4 py-4 text-[13px] text-[#1b1c1c]">LKR {row.unitPrice.toLocaleString()}</td>
                        <td className="px-4 py-4 text-[13px] font-bold text-[#1b1c1c]">LKR {(row.qty * row.unitPrice).toLocaleString()}</td>
                        <td className="px-4 py-4">
                          <span className={`rounded-[2px] px-2 py-1 text-[10px] font-bold uppercase ${row.demand === 'HIGH' ? 'bg-[#f0fdf4] text-[#15803d]' : row.demand === 'MEDIUM' ? 'bg-[#fffbeb] text-[#b45309]' : 'bg-[#fef2f2] text-[#b91c1c]'}`}>{row.demand}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button type="button" aria-label={`Clear ${row.part}`} onClick={() => clearRow(row)} className="flex size-7 items-center justify-center rounded-[2px] text-[18px] leading-none text-[#5f5e5e] hover:bg-[#fef2f2] hover:text-[#bd0014]">×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-end border-t border-[#e9bcb7] px-6 py-4">
                <span className="mr-4 text-[13px] font-bold uppercase tracking-[0.55px] text-[#5f5e5e]">Total of all parts</span>
                <span className="text-[20px] font-black text-[#1b1c1c]">LKR {totalOrderValue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="overflow-hidden rounded-[4px] border border-[#e9bcb7] bg-white">
            <div className="border-b border-[#e9bcb7] px-6 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.55px] text-[#5f5e5e]">ORDER SUMMARY</p>
            </div>
            <div className="grid gap-5 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
              <div><p className="text-[13px] text-[#5f5e5e]">Total spare parts</p><p className="mt-1 text-[22px] font-black text-[#1b1c1c]">{filteredRows.length}</p></div>
              <div><p className="text-[13px] text-[#5f5e5e]">Total quantity</p><p className="mt-1 text-[22px] font-black text-[#1b1c1c]">{totalQuantity.toLocaleString()} units</p></div>
              <label><span className="text-[13px] text-[#5f5e5e]">Shipping cost</span><div className="mt-1 flex h-10 items-center rounded-[4px] border border-[#e9bcb7] bg-[#f8f4f3] px-3"><span className="text-[13px] text-[#5f5e5e]">LKR</span><input type="number" min="0" value={shippingCost} onChange={event => setShippingCost(event.target.value)} className="min-w-0 flex-1 bg-transparent px-2 text-[15px] font-bold text-[#1b1c1c] outline-none" /></div></label>
              <div><p className="text-[13px] text-[#5f5e5e]">Total order value</p><p className="mt-1 text-[22px] font-black text-[#bd0014]">LKR {totalWithShipping.toLocaleString()}</p></div>
            </div>
            <div className="border-t border-[#e9bcb7] px-6 py-5">
              <div className="mb-2 flex items-center justify-between"><span className="text-[11px] font-bold uppercase tracking-[0.55px] text-[#5f5e5e]">MONTHLY BUDGET PROGRESS</span><span className="text-[11px] font-bold text-[#1b1c1c]">{budgetProgress}%</span></div>
              <div className="h-[6px] overflow-hidden rounded-full bg-[#e9e8e7]"><div className="h-full rounded-full bg-[#f59e0b]" style={{ width: `${budgetProgress}%` }} /></div>
            </div>
            <div className="flex flex-col gap-2 border-t border-[#e9bcb7] px-6 py-5 sm:flex-row sm:justify-end">
              <button type="button" onClick={finalizeOrder} className="flex h-11 items-center justify-center rounded-[4px] bg-[#bd0014] px-6 text-[11px] font-bold uppercase tracking-[0.55px] text-white">Finalize the order</button>
              <button type="button" onClick={() => onAction('Purchase order saved as draft.')} className="flex h-11 items-center justify-center rounded-[4px] border border-[#e9bcb7] px-6 text-[11px] font-bold uppercase tracking-[0.55px] text-[#1b1c1c]">Save as draft</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginPage({
  email,
  password,
  showPassword,
  error,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
  isRegistering,
  onToggleMode,
  fullName,
  onFullNameChange,
  confirmPassword,
  onConfirmPasswordChange,
  showConfirmPassword,
  onToggleConfirmPassword,
}: {
  email: string
  password: string
  showPassword: boolean
  error: string
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onTogglePassword: () => void
  onSubmit: () => void
  isRegistering: boolean
  onToggleMode: () => void
  fullName: string
  onFullNameChange: (value: string) => void
  confirmPassword: string
  onConfirmPasswordChange: (value: string) => void
  showConfirmPassword: boolean
  onToggleConfirmPassword: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f1f1] px-4 py-8" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[18px] border border-[#e9bcb7] bg-white shadow-[0_30px_80px_rgba(189,0,20,0.08)] lg:grid-cols-[1.1fr_1fr]">
        <div className="relative overflow-hidden bg-[#bd0014] p-8 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.15),_transparent_44%)]" />
          <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-white/12">
                <span className="text-[26px]"><IconBike /></span>
              </div>
              <div>
                <p className="text-[22px] font-black tracking-[-0.3px]">Island Supply Chain</p>
                <p className="text-[10px] font-bold uppercase tracking-[1.4px] text-white/80">Precision Logistics</p>
              </div>
            </div>

            <div className="max-w-xs">
              <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-white/80">Operations portal</p>
              <h1 className="mt-4 text-[36px] font-black leading-[1.1] tracking-[-0.9px]">Control the flow of every part.</h1>
              <p className="mt-4 text-[15px] leading-6 text-white/80">
                Monitor demand, stock risk, fulfillment priorities, and supplier planning in one secure platform.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center px-6 py-8 sm:px-10">
          <div className="w-full max-w-md">
            <div className="mb-6">
              <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#bd0014]">
                {isRegistering ? 'Create account' : 'Secure sign in'}
              </p>
              <h2 className="mt-3 text-[32px] font-black tracking-[-0.8px] text-[#1b1c1c]">
                {isRegistering ? 'Join the platform' : 'Welcome back'}
              </h2>
            </div>

            <form
              className="space-y-4"
              onSubmit={event => {
                event.preventDefault()
                onSubmit()
              }}
            >
              {isRegistering && (
                <div>
                  <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.5px] text-[#5f5e5e]">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={event => onFullNameChange(event.target.value)}
                    placeholder="John Doe"
                    className="h-12 w-full rounded-[10px] border border-[#e9bcb7] bg-[#f8f4f3] px-3 text-[14px] text-[#1b1c1c] outline-none transition focus:border-[#bd0014]"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.5px] text-[#5f5e5e]">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={event => onEmailChange(event.target.value)}
                  placeholder="name@toyota.com"
                  className="h-12 w-full rounded-[10px] border border-[#e9bcb7] bg-[#f8f4f3] px-3 text-[14px] text-[#1b1c1c] outline-none transition focus:border-[#bd0014]"
                />
              </div>

              <div>
                <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.5px] text-[#5f5e5e]">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={event => onPasswordChange(event.target.value)}
                    placeholder={isRegistering ? 'At least 8 characters' : 'Enter your password'}
                    className="h-12 w-full rounded-[10px] border border-[#e9bcb7] bg-[#f8f4f3] px-3 pr-11 text-[14px] text-[#1b1c1c] outline-none transition focus:border-[#bd0014]"
                  />
                  <button
                    type="button"
                    onClick={onTogglePassword}
                    className="absolute inset-y-0 right-3 flex items-center text-[12px] font-bold uppercase tracking-[0.5px] text-[#5f5e5e]"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {isRegistering && (
                <div>
                  <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.5px] text-[#5f5e5e]">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={event => onConfirmPasswordChange(event.target.value)}
                      placeholder="Confirm password"
                      className="h-12 w-full rounded-[10px] border border-[#e9bcb7] bg-[#f8f4f3] px-3 pr-11 text-[14px] text-[#1b1c1c] outline-none transition focus:border-[#bd0014]"
                    />
                    <button
                      type="button"
                      onClick={onToggleConfirmPassword}
                      className="absolute inset-y-0 right-3 flex items-center text-[12px] font-bold uppercase tracking-[0.5px] text-[#5f5e5e]"
                    >
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              )}

              {!isRegistering && (
                <div className="flex items-center justify-between gap-2 text-[12px] text-[#5f5e5e]">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4 accent-[#bd0014]" defaultChecked />
                    Remember me
                  </label>
                  <button type="button" className="font-semibold text-[#bd0014]">Forgot password?</button>
                </div>
              )}

              {error && (
                <div className="rounded-[10px] border border-[#f3d7d3] bg-[#fff7f5] px-3 py-2 text-[12px] font-medium text-[#bd0014]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center rounded-[10px] bg-[#bd0014] text-[13px] font-bold uppercase tracking-[0.6px] text-white transition hover:bg-[#9d0011]"
              >
                {isRegistering ? 'Create Account' : 'Sign in to dashboard'}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-3 text-[12px] text-[#5f5e5e]">
              <div className="h-px flex-1 bg-[#e9bcb7]" />
              <span>{isRegistering ? 'Or' : 'Demo'} access</span>
              <div className="h-px flex-1 bg-[#e9bcb7]" />
            </div>

            {isRegistering ? (
              <div className="mt-4 text-center text-[12px] text-[#5f5e5e]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onToggleMode}
                  className="font-semibold text-[#bd0014] hover:underline"
                >
                  Sign in here
                </button>
              </div>
            ) : (
              <div className="mt-4 rounded-[10px] border border-[#f3d7d3] bg-[#fff7f5] px-3 py-2 text-[12px] text-[#5f5e5e]">
                <p className="mb-2">Demo login: use "password" as password, or create an account.</p>
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={onToggleMode}
                    className="font-semibold text-[#bd0014] hover:underline"
                  >
                    Create one here
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

interface UserAccount {
  fullName: string
  email: string
  password: string
  isActive: boolean
}

interface UserProfile {
  fullName: string
  role: string
  warehouse: string
  phone: string
  bio: string
  accent: string
  profilePicture: string
  isAccountActive: boolean
}

interface NotificationItem {
  id: number
  title: string
  detail: string
  time: string
  read: boolean
}

function buildDefaultProfile(fullName: string, email: string): UserProfile {
  return {
    fullName: fullName || 'User',
    role: 'Operations Manager',
    warehouse: 'Navala Central',
    phone: '+94 77 123 4567',
    bio: `Warehouse operations lead for ${email || 'Toyota logistics'}.`,
    accent: '#bd0014',
    profilePicture: '',
    isAccountActive: true,
  }
}

function UserProfileEditor({
  profile,
  onChange,
  onClose,
  onSave,
  onPhotoUpload,
  onDeleteAccount,
  showDeleteConfirm,
  onConfirmDelete,
  onCancelDelete,
}: {
  profile: UserProfile
  onChange: (field: keyof UserProfile, value: string | boolean) => void
  onClose: () => void
  onSave: () => void
  onPhotoUpload: (value: string) => void
  onDeleteAccount: () => void
  showDeleteConfirm: boolean
  onConfirmDelete: () => void
  onCancelDelete: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-[16px] border border-[#e9bcb7] bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
            <p className="text-[11px] font-bold uppercase tracking-[1px] text-[#bd0014]">Delete account</p>
            <h4 className="mt-2 text-[24px] font-black tracking-[-0.5px] text-[#1b1c1c]">Delete your data?</h4>
            <p className="mt-3 text-[14px] leading-relaxed text-[#5f5e5e]">
              Your user data will be deleted permanently. This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={onCancelDelete} className="rounded-[8px] border border-[#e9bcb7] bg-white px-4 py-2 text-[12px] font-bold uppercase tracking-[0.55px] text-[#1b1c1c]">
                No
              </button>
              <button type="button" onClick={onConfirmDelete} className="rounded-[8px] bg-[#bd0014] px-4 py-2 text-[12px] font-bold uppercase tracking-[0.55px] text-white">
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl rounded-[18px] border border-[#e9bcb7] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
        <div className="flex items-center justify-between border-b border-[#e9bcb7] px-6 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-[#bd0014]">Profile settings</p>
            <h3 className="mt-1 text-[24px] font-black tracking-[-0.5px] text-[#1b1c1c]">Customize your profile</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[24px] leading-none text-[#5f5e5e]">×</button>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-[180px_1fr]">
          <div className="flex flex-col items-center gap-3 rounded-[12px] border border-[#e9bcb7] bg-[#fbf9f8] p-5">
            {profile.profilePicture ? (
              <img src={profile.profilePicture} alt={profile.fullName} className="flex size-20 items-center justify-center overflow-hidden rounded-[18px] object-cover" />
            ) : (
              <div
                className="flex size-20 items-center justify-center rounded-[18px] text-[28px] font-black text-white"
                style={{ backgroundColor: profile.accent }}
              >
                {profile.fullName.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('') || 'U'}
              </div>
            )}
            <label className="w-full cursor-pointer rounded-[8px] border border-[#e9bcb7] bg-white px-3 py-2 text-center text-[11px] font-bold uppercase tracking-[0.55px] text-[#1b1c1c]">
              Upload Photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={event => {
                  const file = event.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = () => {
                    if (typeof reader.result === 'string') {
                      onPhotoUpload(reader.result)
                    }
                  }
                  reader.readAsDataURL(file)
                }}
              />
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.5px] text-[#5f5e5e]">Full name</label>
              <input
                value={profile.fullName}
                onChange={event => onChange('fullName', event.target.value)}
                className="h-11 w-full rounded-[10px] border border-[#e9bcb7] bg-[#f8f4f3] px-3 text-[14px] text-[#1b1c1c] outline-none focus:border-[#bd0014]"
              />
            </div>

            <div>
              <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.5px] text-[#5f5e5e]">Role</label>
              <input
                value={profile.role}
                onChange={event => onChange('role', event.target.value)}
                className="h-11 w-full rounded-[10px] border border-[#e9bcb7] bg-[#f8f4f3] px-3 text-[14px] text-[#1b1c1c] outline-none focus:border-[#bd0014]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.5px] text-[#5f5e5e]">Warehouse</label>
                <input
                  value={profile.warehouse}
                  onChange={event => onChange('warehouse', event.target.value)}
                  className="h-11 w-full rounded-[10px] border border-[#e9bcb7] bg-[#f8f4f3] px-3 text-[14px] text-[#1b1c1c] outline-none focus:border-[#bd0014]"
                />
              </div>

              <div>
                <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.5px] text-[#5f5e5e]">Phone</label>
                <input
                  value={profile.phone}
                  onChange={event => onChange('phone', event.target.value)}
                  className="h-11 w-full rounded-[10px] border border-[#e9bcb7] bg-[#f8f4f3] px-3 text-[14px] text-[#1b1c1c] outline-none focus:border-[#bd0014]"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.5px] text-[#5f5e5e]">Bio</label>
              <textarea
                value={profile.bio}
                onChange={event => onChange('bio', event.target.value)}
                rows={4}
                className="w-full rounded-[10px] border border-[#e9bcb7] bg-[#f8f4f3] px-3 py-3 text-[14px] text-[#1b1c1c] outline-none focus:border-[#bd0014]"
              />
            </div>

            <div className="rounded-[10px] border border-[#e9bcb7] bg-[#f8f4f3] p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.5px] text-[#5f5e5e]">Account actions</p>
                  <p className="mt-1 text-[13px] text-[#1b1c1c]">Remove your account and all saved data.</p>
                </div>
                <button
                  type="button"
                  onClick={onDeleteAccount}
                  className="rounded-[8px] border border-[#bd0014] bg-[#fff5f5] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.55px] text-[#bd0014]"
                >
                  Delete account
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#e9bcb7] bg-[#fbf9f8] px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-[8px] border border-[#e9bcb7] bg-white px-4 py-2 text-[12px] font-bold uppercase tracking-[0.55px] text-[#1b1c1c]">
            Cancel
          </button>
          <button type="button" onClick={onSave} className="rounded-[8px] bg-[#bd0014] px-4 py-2 text-[12px] font-bold uppercase tracking-[0.55px] text-white">
            Save profile
          </button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [showLanding, setShowLanding] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isSupportOpen, setIsSupportOpen] = useState(false)
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false)
  const [addedPurchaseRows, setAddedPurchaseRows] = useState<typeof poRows>([])
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [view, setView] = useState<View>('demand')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusMessage, setStatusMessage] = useState('System ready')
  const [registeredAccounts, setRegisteredAccounts] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('toyota-accounts')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [profilesByEmail, setProfilesByEmail] = useState<Record<string, UserProfile>>(() => {
    try {
      const saved = localStorage.getItem('toyota-profiles')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })
  const [activeUserEmail, setActiveUserEmail] = useState<string>(() => {
    try {
      return localStorage.getItem('toyota-active-user-email') || ''
    } catch {
      return ''
    }
  })
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: 1, title: 'Low stock alert', detail: 'Outer Mirror Glass is below safety threshold in Navala Central.', time: '2 min ago', read: false },
    { id: 2, title: 'Transfer approved', detail: 'Workshop #008 transfer was approved for L Side Mirror.', time: '18 min ago', read: false },
    { id: 3, title: 'Forecast update', detail: 'New demand spike detected for Corolla Cross wheel arch parts.', time: '1 hour ago', read: true },
  ])
  const [showNotifications, setShowNotifications] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isNightMode, setIsNightMode] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    if (activeUserEmail && profilesByEmail[activeUserEmail]) {
      return profilesByEmail[activeUserEmail]
    }
    return buildDefaultProfile('Nuwan Perera', 'nuwan@toyota.com')
  })

  React.useEffect(() => {
    localStorage.setItem('toyota-accounts', JSON.stringify(registeredAccounts))
  }, [registeredAccounts])

  React.useEffect(() => {
    localStorage.setItem('toyota-profiles', JSON.stringify(profilesByEmail))
  }, [profilesByEmail])

  React.useEffect(() => {
    if (activeUserEmail) {
      localStorage.setItem('toyota-active-user-email', activeUserEmail)
    }
  }, [activeUserEmail])

  const markNotificationsRead = () => {
    setNotifications(current => current.map(item => ({ ...item, read: true })))
  }

  const handleProfileChange = (field: keyof UserProfile, value: string | boolean) => {
    setUserProfile(current => ({ ...current, [field]: value }))
  }

  const handleSaveProfile = () => {
    if (!activeUserEmail) {
      setStatusMessage('No active user profile to save.')
      setIsProfileOpen(false)
      return
    }

    const nextProfile = { ...userProfile, fullName: userProfile.fullName.trim() || 'User' }
    setProfilesByEmail(current => ({ ...current, [activeUserEmail]: nextProfile }))
    setUserProfile(nextProfile)
    setStatusMessage(`Profile updated for ${nextProfile.fullName}.`)
    setIsProfileOpen(false)

    setNotifications(current => [
      {
        id: Date.now(),
        title: 'Profile saved',
        detail: `${nextProfile.fullName}'s details were updated successfully.`,
        time: 'Just now',
        read: false,
      },
      ...current,
    ].slice(0, 5))
  }

  const handleDeleteAccount = () => {
    if (!activeUserEmail) return
    setShowDeleteConfirm(true)
  }

  const handleConfirmDeleteAccount = () => {
    if (!activeUserEmail) {
      setShowDeleteConfirm(false)
      return
    }

    const emailToDelete = activeUserEmail.toLowerCase()

    setRegisteredAccounts(current => current.filter(account => account.email.toLowerCase() !== emailToDelete))
    setProfilesByEmail(current => {
      const next = { ...current }
      delete next[emailToDelete]
      return next
    })
    setActiveUserEmail('')
    setUserProfile(buildDefaultProfile('Nuwan Perera', 'nuwan@toyota.com'))
    setShowDeleteConfirm(false)
    setIsProfileOpen(false)
    setIsLoggedIn(false)
    setShowLanding(true)
    setStatusMessage('Account deleted permanently.')
    setError('')
  }

  const handleNavigate = (nextView: View) => {
    setView(nextView)
    setStatusMessage(`Viewing ${nextView}.`)
    setShowNotifications(false)
  }

  const handleLogin = () => {
    if (isRegistering) {
      if (!fullName.trim()) {
        setError('Please enter your full name.')
        return
      }
      if (!email.trim()) {
        setError('Please enter a valid email address.')
        return
      }
      if (!password.trim() || password.length < 8) {
        setError('Password must be at least 8 characters.')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }

      if (registeredAccounts.some(acc => acc.email.toLowerCase() === email.toLowerCase())) {
        setError('This email is already registered to one profile.')
        return
      }

      const normalizedEmail = email.toLowerCase()
      const newAccount: UserAccount = { fullName: fullName.trim(), email: normalizedEmail, password, isActive: true }
      const newProfile = buildDefaultProfile(fullName.trim(), normalizedEmail)

      setRegisteredAccounts(current => [...current, newAccount])
      setProfilesByEmail(current => ({ ...current, [normalizedEmail]: newProfile }))
      setActiveUserEmail(normalizedEmail)
      setUserProfile(newProfile)
      setError('')
      setIsLoggedIn(true)
      setStatusMessage(`Welcome, ${fullName.trim()}. Dashboard ready.`)
      setNotifications(current => [
        { id: Date.now(), title: 'Welcome', detail: `Account created for ${fullName.trim()}.`, time: 'Just now', read: false },
        ...current,
      ].slice(0, 5))
      return
    }

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.')
      return
    }

    const normalizedEmail = email.toLowerCase()
    const account = registeredAccounts.find(
      acc => acc.email.toLowerCase() === normalizedEmail && acc.password === password
    )

    if (!account && password !== 'password') {
      setError('Invalid email or password. Try "password" as the demo password.')
      return
    }

    const activeAccount = account ?? registeredAccounts.find(acc => acc.email.toLowerCase() === normalizedEmail)
    if (activeAccount && !activeAccount.isActive) {
      setError('This account has been deactivated. Please contact your administrator.')
      return
    }

    setError('')
    setIsLoggedIn(true)
    setActiveUserEmail(normalizedEmail)
    const savedProfile = profilesByEmail[normalizedEmail]
    const displayName = activeAccount ? activeAccount.fullName : 'User'
    const profile = savedProfile ? { ...savedProfile, fullName: savedProfile.fullName || displayName } : buildDefaultProfile(displayName, normalizedEmail)

    setUserProfile(profile)
    setStatusMessage(`Welcome back, ${displayName}. Dashboard ready.`)
    setNotifications(current => [
      { id: Date.now(), title: 'Signed in', detail: `${displayName} has entered the dashboard.`, time: 'Just now', read: false },
      ...current,
    ].slice(0, 5))
  }

  const handleToggleMode = () => {
    setIsRegistering(!isRegistering)
    setError('')
    setFullName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const handleSignOut = () => {
    setIsLoggedIn(false)
    setShowLanding(true)
    setIsRegistering(false)
    setFullName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowConfirmPassword(false)
    setError('')
    setStatusMessage('System ready')
    setView('demand')
    setShowNotifications(false)
    setUserProfile(buildDefaultProfile('Nuwan Perera', 'nuwan@toyota.com'))
    setActiveUserEmail('')
  }

  const handleSupportRequest = () => {
    setStatusMessage('Support request submitted. A team member will contact you shortly.')
    setIsSupportOpen(false)
  }

  const handleNewOrderSave = (details: NewOrderDetail[]) => {
    const completedDetails = details.filter(detail => detail.supplier.trim() && detail.vehicle.trim() && detail.part.trim() && Number(detail.quantity) > 0 && Number(detail.unitPrice) >= 0)
    if (completedDetails.length !== details.length) {
      setStatusMessage('Complete every new order detail row before saving.')
      return
    }

    const total = completedDetails.reduce((sum, detail) => sum + Number(detail.quantity) * Number(detail.unitPrice), 0)
    setAddedPurchaseRows(current => [
      ...current,
      ...completedDetails.map(detail => ({
        supplier: detail.supplier.trim(),
        vehicle: detail.vehicle.trim(),
        part: detail.part.trim(),
        qty: Number(detail.quantity),
        unitPrice: Number(detail.unitPrice),
        demand: 'MEDIUM',
      })),
    ])
    setStatusMessage(`${completedDetails.length} purchase order detail${completedDetails.length > 1 ? 's' : ''} created. Total: LKR ${total.toLocaleString()}.`)
    setIsNewOrderOpen(false)
    setView('purchase')
  }

  if (showLanding && !isLoggedIn) {
    return <LandingPage onEnter={() => setShowLanding(false)} />
  }

  if (!isLoggedIn) {
    return (
      <LoginPage
        email={email}
        password={password}
        showPassword={showPassword}
        error={error}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onTogglePassword={() => setShowPassword(value => !value)}
        onSubmit={handleLogin}
        isRegistering={isRegistering}
        onToggleMode={handleToggleMode}
        fullName={fullName}
        onFullNameChange={setFullName}
        confirmPassword={confirmPassword}
        onConfirmPasswordChange={setConfirmPassword}
        showConfirmPassword={showConfirmPassword}
        onToggleConfirmPassword={() => setShowConfirmPassword(value => !value)}
      />
    )
  }

  return (
    <div
      className={`dashboard-shell flex min-h-screen w-full flex-col overflow-x-hidden lg:h-screen lg:flex-row ${isNightMode ? 'night-mode bg-[#0b1220]' : 'bg-[#fbf9f8]'}`}
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <Sidebar active={view} onNavigate={handleNavigate} onSignOut={handleSignOut} onOpenSupport={() => setIsSupportOpen(true)} onOpenNewOrder={() => setIsNewOrderOpen(true)} isNightMode={isNightMode} />
      {isSupportOpen && <SupportModal onClose={() => setIsSupportOpen(false)} onSubmit={handleSupportRequest} />}
      {isNewOrderOpen && <NewOrderModal onClose={() => setIsNewOrderOpen(false)} onSubmit={handleNewOrderSave} />}
      <div className={`min-w-0 flex-1 overflow-y-auto ${isNightMode ? 'bg-[#0b1220]' : 'bg-[#fbf9f8]'}`}>
        {statusMessage && (
          <div className={`border-b px-4 py-2 text-[12px] font-medium ${isNightMode ? 'border-[#374151] bg-[#111827] text-[#fca5a5]' : 'border-[#e9bcb7] bg-[#fff7f5] text-[#bd0014]'}`}>
            {statusMessage}
          </div>
        )}
        {view === 'demand' && (
          <DemandForecastView
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onAction={setStatusMessage}
            onClear={() => setSearchTerm('')}
            userName={userProfile.fullName}
            userRole={userProfile.role}
            warehouseName={userProfile.warehouse}
            profilePicture={userProfile.profilePicture}
            onOpenProfile={() => setIsProfileOpen(true)}
            notifications={notifications}
            unreadCount={notifications.filter(item => !item.read).length}
            showNotifications={showNotifications}
            isNightMode={isNightMode}
            onToggleNightMode={() => setIsNightMode(value => !value)}
            onToggleNotifications={() => {
              setShowNotifications(value => !value)
              if (!showNotifications) markNotificationsRead()
            }}
            onMarkNotificationsRead={markNotificationsRead}
          />
        )}
        {view === 'prediction' && (
          <PredictionQueueView
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onAction={setStatusMessage}
            userName={userProfile.fullName}
            userRole={userProfile.role}
            warehouseName={userProfile.warehouse}
            profilePicture={userProfile.profilePicture}
            onOpenProfile={() => setIsProfileOpen(true)}
            notifications={notifications}
            unreadCount={notifications.filter(item => !item.read).length}
            showNotifications={showNotifications}
            isNightMode={isNightMode}
            onToggleNightMode={() => setIsNightMode(value => !value)}
            onToggleNotifications={() => {
              setShowNotifications(value => !value)
              if (!showNotifications) markNotificationsRead()
            }}
            onMarkNotificationsRead={markNotificationsRead}
          />
        )}
        {view === 'inventory' && (
          <InventoryFulfillmentView
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onAction={setStatusMessage}
            userName={userProfile.fullName}
            userRole={userProfile.role}
            warehouseName={userProfile.warehouse}
            profilePicture={userProfile.profilePicture}
            onOpenProfile={() => setIsProfileOpen(true)}
            notifications={notifications}
            unreadCount={notifications.filter(item => !item.read).length}
            showNotifications={showNotifications}
            isNightMode={isNightMode}
            onToggleNightMode={() => setIsNightMode(value => !value)}
            onToggleNotifications={() => {
              setShowNotifications(value => !value)
              if (!showNotifications) markNotificationsRead()
            }}
            onMarkNotificationsRead={markNotificationsRead}
          />
        )}
        {view === 'purchase' && (
          <PurchaseOrdersView
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onAction={setStatusMessage}
            addedRows={addedPurchaseRows}
            userName={userProfile.fullName}
            userRole={userProfile.role}
            warehouseName={userProfile.warehouse}
            profilePicture={userProfile.profilePicture}
            onOpenProfile={() => setIsProfileOpen(true)}
            notifications={notifications}
            unreadCount={notifications.filter(item => !item.read).length}
            showNotifications={showNotifications}
            isNightMode={isNightMode}
            onToggleNightMode={() => setIsNightMode(value => !value)}
            onToggleNotifications={() => {
              setShowNotifications(value => !value)
              if (!showNotifications) markNotificationsRead()
            }}
            onMarkNotificationsRead={markNotificationsRead}
          />
        )}
      </div>

      {isProfileOpen && (
        <UserProfileEditor
          profile={userProfile}
          onChange={handleProfileChange}
          onClose={() => {
            setIsProfileOpen(false)
            setShowDeleteConfirm(false)
          }}
          onSave={handleSaveProfile}
          onPhotoUpload={value => setUserProfile(current => ({ ...current, profilePicture: value }))}
          onDeleteAccount={handleDeleteAccount}
          showDeleteConfirm={showDeleteConfirm}
          onConfirmDelete={handleConfirmDeleteAccount}
          onCancelDelete={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
}
