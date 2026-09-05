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
}: {
  active: View
  onNavigate: (v: View) => void
  onSignOut: () => void
  onOpenSupport: () => void
  onOpenNewOrder: () => void
}) {
  return (
    <aside className="flex w-full flex-col border-b border-[#e9bcb7] bg-white lg:w-[200px] lg:border-b-0 lg:border-r">
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
                  backgroundColor: isActive ? '#e9e8e7' : 'transparent',
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
                <span style={{ color: isActive ? '#bd0014' : '#5f5e5e', paddingLeft: isActive ? 4 : 0 }}>
                  <item.icon />
                </span>
                <span
                  className="whitespace-nowrap text-[11px] font-bold tracking-[0.55px]"
                  style={{ color: isActive ? '#bd0014' : '#5f5e5e' }}
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
            <span className="text-[#5f5e5e]"><IconSupport /></span>
            <span className="text-[13px] text-[#5f5e5e]">Support</span>
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className="flex h-10 w-full items-center gap-3 px-1 text-left"
          >
            <span className="text-[#5f5e5e]"><IconSignOut /></span>
            <span className="text-[13px] text-[#5f5e5e]">Sign Out</span>
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

function NewOrderModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (partName: string, supplier: string, quantity: string) => void }) {
  const [partName, setPartName] = useState('Headlamp Assembly')
  const [supplier, setSupplier] = useState('Toyota Parts Co.')
  const [quantity, setQuantity] = useState('120')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className="w-full max-w-lg rounded-[18px] border border-[#e9bcb7] bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-[#bd0014]">New order</p>
            <h3 className="mt-1 text-[24px] font-black tracking-[-0.5px] text-[#1b1c1c]">Create purchase order</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[24px] leading-none text-[#5f5e5e]">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.5px] text-[#5f5e5e]">Part name</label>
            <input value={partName} onChange={event => setPartName(event.target.value)} className="h-11 w-full rounded-[10px] border border-[#e9bcb7] bg-[#f8f4f3] px-3 text-[14px] text-[#1b1c1c] outline-none focus:border-[#bd0014]" />
          </div>

          <div>
            <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.5px] text-[#5f5e5e]">Supplier</label>
            <input value={supplier} onChange={event => setSupplier(event.target.value)} className="h-11 w-full rounded-[10px] border border-[#e9bcb7] bg-[#f8f4f3] px-3 text-[14px] text-[#1b1c1c] outline-none focus:border-[#bd0014]" />
          </div>

          <div>
            <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.5px] text-[#5f5e5e]">Quantity</label>
            <input value={quantity} onChange={event => setQuantity(event.target.value)} className="h-11 w-full rounded-[10px] border border-[#e9bcb7] bg-[#f8f4f3] px-3 text-[14px] text-[#1b1c1c] outline-none focus:border-[#bd0014]" />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-[8px] border border-[#e9bcb7] bg-white px-4 py-2 text-[12px] font-bold uppercase tracking-[0.55px] text-[#1b1c1c]">
            Cancel
          </button>
          <button type="button" onClick={() => onSubmit(partName, supplier, quantity)} className="rounded-[8px] bg-[#bd0014] px-4 py-2 text-[12px] font-bold uppercase tracking-[0.55px] text-white">
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
}) {
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('') || 'U'

  return (
    <header className="z-10 flex h-auto flex-shrink-0 flex-col gap-3 border-b border-[#e9bcb7] bg-[#fbf9f8] px-4 py-3 lg:h-12 lg:flex-row lg:items-center lg:justify-between lg:py-0">
      <h1 className="text-[18px] font-black tracking-[-0.48px] text-[#bd0014] sm:text-[20px] lg:text-[24px]">Toyota Parts Management</h1>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
        <div className="relative flex items-center w-full lg:w-auto">
          <span className="absolute left-3 text-[#5f5e5e]"><IconSearch /></span>
          <input
            className="h-9 w-full rounded-[2px] border border-[#e9bcb7] bg-[#f5f3f3] pl-8 pr-3 text-[13px] text-[#6b7280] outline-none lg:w-56"
            placeholder={searchPlaceholder}
            value={value}
            onChange={event => onChange?.(event.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-[#5f5e5e]">
          <span><IconPin /></span>
          <span className="text-[10px] font-bold tracking-[0.55px] sm:text-[11px]">Warehouse: {warehouseName}</span>
        </div>
        <div className="relative flex items-center gap-4 text-[#5f5e5e]">
          <button type="button" onClick={onToggleNotifications} className="relative p-1">
            <IconBell />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex min-w-[16px] items-center justify-center rounded-full bg-[#bd0014] px-1 text-[9px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 top-12 z-40 w-[320px] rounded-[12px] border border-[#e9bcb7] bg-white p-3 shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[12px] font-bold uppercase tracking-[0.5px] text-[#1b1c1c]">Notifications</p>
                <button type="button" onClick={onMarkNotificationsRead} className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#bd0014]">
                  Mark all read
                </button>
              </div>
              <div className="space-y-2">
                {notifications.length === 0 ? (
                  <p className="rounded-[8px] bg-[#fbf9f8] px-3 py-4 text-[12px] text-[#5f5e5e]">No new notifications.</p>
                ) : (
                  notifications.map(note => (
                    <div key={note.id} className={`rounded-[8px] border px-3 py-2 ${note.read ? 'border-[#f0eeee] bg-[#fbf9f8]' : 'border-[#f3d7d3] bg-[#fff7f5]'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[12px] font-bold text-[#1b1c1c]">{note.title}</p>
                          <p className="mt-1 text-[11px] leading-5 text-[#5f5e5e]">{note.detail}</p>
                        </div>
                        {!note.read && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#bd0014]" />}
                      </div>
                      <p className="mt-2 text-[10px] uppercase tracking-[0.45px] text-[#5f5e5e]">{note.time}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          <button type="button" onClick={onOpenProfile}><IconGear /></button>
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex items-center gap-2 rounded-full border border-[#e9bcb7] bg-white px-2 py-1 text-left transition hover:border-[#bd0014]"
          >
            {profilePicture ? (
              <img src={profilePicture} alt={userName} className="flex size-8 items-center justify-center overflow-hidden rounded-[12px] object-cover" />
            ) : (
              <div className="flex size-8 items-center justify-center overflow-hidden rounded-[12px] bg-[#e4e2e2] text-[12px] font-bold text-[#5f5e5e]">
                {initials}
              </div>
            )}
            <div className="hidden sm:block">
              <p className="text-[11px] font-bold text-[#1b1c1c] leading-tight">{userName}</p>
              <p className="text-[9px] uppercase tracking-[0.5px] text-[#5f5e5e]">{userRole}</p>
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
}) {
  const [vehicleFilter, setVehicleFilter] = useState('All Models')
  const [makeYearFilter, setMakeYearFilter] = useState('All Years')
  const [exteriorPartFilter, setExteriorPartFilter] = useState('All Exterior Parts')
  const [monthYearFilter, setMonthYearFilter] = useState('All Months')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

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
      />
      <div className="flex-1 overflow-auto bg-[#fbf9f8] p-4 sm:p-6 lg:p-8">
        {/* Page header */}
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-[18px] font-semibold tracking-[-0.18px] text-[#1b1c1c]">Demand &amp; Inventory Forecast</h2>
            <p className="mt-0.5 text-[13px] text-[#5f5e5e]">Analyzing accident frequency data to optimize parts distribution.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => onAction('Demand export started.')} className="flex h-9 items-center gap-2 rounded-[4px] border border-[#e9bcb7] bg-white px-4 text-[11px] font-bold tracking-[0.55px] text-[#1b1c1c]">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 9h10v1.5H1V9zm4.25-2.55L3.5 4.75l-1.25 1.25L6 9.75l3.75-3.75L8.5 4.75 6.75 6.45V.75h-1.5v5.7z" fill="currentColor"/></svg>
              Export Data
            </button>
            <button type="button" onClick={() => onAction('Reorder list generated for high-risk parts.')} className="flex h-9 items-center gap-2 rounded-[4px] bg-[#bd0014] px-4 text-[11px] font-bold tracking-[0.55px] text-white">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M5 1v4H1l5 6 5-6H7V1H5z" fill="white"/></svg>
              Generate Reorder List
            </button>
          </div>
        </div>

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
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full">
                <thead className="bg-[#efeded]">
                  <tr>
                    {['SPARE PART DETAILS', 'COMPATIBILITY', 'PREDICTED DEMAND', 'CURRENT STOCK', 'STOCK HEALTH', 'DEMAND', 'ACTION'].map(h => (
                      <th key={h} className="border-b border-[#e9bcb7] px-4 py-3 text-left text-[11px] font-bold tracking-[0.55px] text-[#5f5e5e]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {demandRows.map((row, i) => (
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
                      <td className="px-4 py-3 text-[13px] font-medium" style={{ color: row.stockColor }}>{row.stock.toLocaleString()}</td>
                      <td className="px-4 py-3"><HealthBar pct={row.health} /></td>
                      <td className="px-4 py-3">
                        <span className="rounded-[2px] px-2 py-1 text-[10px] font-bold uppercase" style={{ color: row.confColor, backgroundColor: row.confBg }}>
                          {row.conf}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => onAction(`Opened action menu for ${row.name}.`)} className="text-[#5f5e5e] hover:text-[#1b1c1c]">⋮</button>
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
    parts: ['FRONT BUMPER', 'GRILLE ASSY', 'L-HEADLIGHT'], conf: 94, level: 'High', levelColor: '#15803d', dot: '#22c55e',
  },
  {
    id: 'ACC-8110-CA', date: '23 Oct 2024, 14:45', vehicle: 'RAV4 Prime', year: 2023,
    parts: ['REAR TAILGATE', 'BUMPER COVER'], conf: 72, level: 'Med', levelColor: '#b45309', dot: '#f59e0b',
  },
  {
    id: 'ACC-7231-NY', date: '22 Oct 2024, 09:30', vehicle: 'Tacoma', year: 2024,
    parts: ['RADIATOR CORE', 'HOOD PANEL', '+2 MORE'], conf: 45, level: 'Low', levelColor: '#b91c1c', dot: '#ef4444',
  },
  {
    id: 'ACC-5529-IL', date: '21 Oct 2024, 11:10', vehicle: 'Corolla Cross', year: 2023,
    parts: ['WHEEL ARCH', 'R-FENDER'], conf: 89, level: 'High', levelColor: '#15803d', dot: '#22c55e',
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
}) {
  const [queueRows, setQueueRows] = useState(predRows)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [confidenceFilter, setConfidenceFilter] = useState('All Scores')
  const [yearFilter, setYearFilter] = useState('All Years')
  const [regionFilter, setRegionFilter] = useState('Global')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const confidenceOptions = ['All Scores', 'High (80+%)', 'Medium (50-79%)', 'Low (<50%)']
  const yearOptions = ['All Years', '2023', '2024', '2025']
  const regionOptions = ['Global', 'North America', 'Europe', 'Asia Pacific', 'Middle East']

  const filteredRows = queueRows.filter(row => {
    const matchesSearch = [row.id, row.vehicle, row.parts.join(' '), row.date].join(' ').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesConfidence = confidenceFilter === 'All Scores' || 
      (confidenceFilter === 'High (80+%)' && row.conf >= 80) ||
      (confidenceFilter === 'Medium (50-79%)' && row.conf >= 50 && row.conf < 80) ||
      (confidenceFilter === 'Low (<50%)' && row.conf < 50)
    const matchesYear = yearFilter === 'All Years' || row.year.toString() === yearFilter
    return matchesSearch && matchesConfidence && matchesYear
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

  const handleApproveSelected = () => {
    if (selectedIds.length === 0) {
      onAction('Select predictions to approve.')
      return
    }
    setQueueRows(current => current.filter(row => !selectedIds.includes(row.id)))
    const approved = selectedIds.length
    setSelectedIds([])
    onAction(`${approved} prediction${approved > 1 ? 's' : ''} approved.`)
  }

  const handleRejectSelected = () => {
    if (selectedIds.length === 0) {
      onAction('Select predictions to reject.')
      return
    }
    setQueueRows(current => current.filter(row => !selectedIds.includes(row.id)))
    const rejected = selectedIds.length
    setSelectedIds([])
    onAction(`${rejected} prediction${rejected > 1 ? 's' : ''} rejected.`)
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
      />
      <div className="flex-1 overflow-auto bg-[#fbf9f8] p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-[18px] font-semibold tracking-[-0.18px] text-[#1b1c1c]">AI Prediction Review Queue</h2>
            <p className="mt-0.5 text-[13px] text-[#5f5e5e]">Reviewing cluster-based demand spikes for 2024 collision patterns.</p>
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

          {/* Region Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[#5f5e5e]">Region</span>
            <div className="relative">
              <button type="button" onClick={() => setOpenDropdown(openDropdown === 'region' ? null : 'region')} className="flex h-8 min-w-[110px] items-center gap-1 rounded-[4px] border border-[#e9bcb7] bg-[#f5f3f3] px-3 text-[13px] text-[#1b1c1c]">
                {regionFilter} <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#5f5e5e" strokeWidth="1.5"/></svg>
              </button>
              {openDropdown === 'region' && (
                <div className="absolute top-10 left-0 z-20 min-w-[140px] rounded-[4px] border border-[#e9bcb7] bg-white shadow-lg">
                  {regionOptions.map(opt => (
                    <button key={opt} type="button" onClick={() => { setRegionFilter(opt); setOpenDropdown(null); }} className={`block w-full px-3 py-2 text-left text-[13px] hover:bg-[#f5f3f3] ${opt === regionFilter ? 'bg-[#efeded] font-bold text-[#bd0014]' : 'text-[#1b1c1c]'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button type="button" onClick={() => { setConfidenceFilter('All Scores'); setYearFilter('All Years'); setRegionFilter('Global'); onSearchChange(''); }} className="ml-auto text-[13px] font-bold text-[#bd0014]">Clear All Filters</button>
        </div>

        {/* Table */}
        <div className="mb-6 overflow-hidden rounded-[4px] border border-[#e9bcb7] bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-[820px] w-full">
              <thead className="bg-[#efeded]">
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
                        {row.parts.map(p => (
                          <span key={p} className="rounded-[2px] bg-[#efeded] px-2 py-1 text-[11px] font-bold tracking-[0.5px] text-[#5f5e5e]">{p}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full" style={{ backgroundColor: row.dot }} />
                        <span className="text-[13px] font-bold" style={{ color: row.levelColor }}>{row.conf}% {row.level}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <button className="text-lg font-bold text-[#22c55e] hover:opacity-70">✓</button>
                        <button className="text-lg font-bold text-[#bd0014] hover:opacity-70">✕</button>
                        <button className="text-base text-[#5f5e5e] hover:opacity-70">✎</button>
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
  { org: 'Anods Workshop', name: 'Workshop #012', pending: 24, urgent: '8 CRITICAL', urgentColor: '#bd0014', urgentBg: '#fef2f2', transit: '4 SKUS' },
  { org: 'Kali Service', name: 'Workshop #045', pending: 11, urgent: '0 ALERT', urgentColor: '#b45309', urgentBg: '#fffbeb', transit: '12 SKUS' },
  { org: 'Toyota City Hub', name: 'Workshop #008', pending: 56, urgent: '15 CRITICAL', urgentColor: '#bd0014', urgentBg: '#fef2f2', transit: '2 SKUS' },
]

const fulfillRows = [
  { name: 'Bumper (Front)', sku: 'TOY-7782-BRK', workshop: 'Workshop #012 – Anods', qty: '04', status: 'BACKORDERED', statusColor: '#b45309', statusBg: '#fffbeb', source: 'Colombo South (92)', action: 'FULFILL NOW', actionStyle: 'red' },
  { name: 'R Fender', sku: 'PRI-4401-CLT', workshop: 'Workshop #008 – Toyota City Hub', qty: '01', status: 'IN TRANSIT', statusColor: '#15803d', statusBg: '#f0fdf4', source: 'Negombo Main (12)', action: 'TRACK STOCK', actionStyle: 'outline' },
  { name: 'LED Headlamp Unit (L)', sku: 'LEX-9003-LIT', workshop: 'Workshop #045 – Kali', qty: '02', status: 'ALLOCATED', statusColor: '#1d4ed8', statusBg: '#eff6ff', source: 'Internal Stock (03)', action: 'FULFILL NOW', actionStyle: 'red' },
  { name: 'L Side Mirror', sku: 'TOY-2211-SUS', workshop: 'Workshop #012 – Anods', qty: '12', status: 'PENDING', statusColor: '#5f5e5e', statusBg: '#efeded', source: 'Transfer: Workshop #008', sourceRed: true, action: 'TRANSFER STOCK', actionStyle: 'blue' },
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
}) {
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [workshopFilter, setWorkshopFilter] = useState('All Workshops')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [showAddWorkshop, setShowAddWorkshop] = useState(false)
  const [workshopCards, setWorkshopCards] = useState(workshops)
  const [workshopForm, setWorkshopForm] = useState({ org: '', name: '', pending: '0', urgent: '0', transit: '0' })

  const handleAddWorkshop = () => {
    const org = workshopForm.org.trim() || 'New Workshop'
    const name = workshopForm.name.trim() || `Workshop #${String(workshopCards.length + 1).padStart(3, '0')}`
    const pendingValue = Number(workshopForm.pending) || 0
    const urgentValue = Number(workshopForm.urgent) || 0

    setWorkshopCards(current => [
      {
        org,
        name,
        pending: pendingValue,
        urgent: urgentValue > 0 ? `${urgentValue} CRITICAL` : '0 ALERT',
        urgentColor: urgentValue > 0 ? '#bd0014' : '#b45309',
        urgentBg: urgentValue > 0 ? '#fef2f2' : '#fffbeb',
        transit: `${workshopForm.transit || '0'} SKUS`,
      },
      ...current,
    ])
    setWorkshopForm({ org: '', name: '', pending: '0', urgent: '0', transit: '0' })
    setShowAddWorkshop(false)
    onAction(`Workshop ${name} added successfully.`)
  }

  const statusOptions = ['All Status', 'PENDING', 'BACKORDERED', 'IN TRANSIT', 'ALLOCATED']
  const workshopOptions = ['All Workshops', 'Workshop #012', 'Workshop #045', 'Workshop #008']

  const filteredRows = fulfillRows.filter(row => {
    const matchesSearch = [row.name, row.sku, row.workshop, row.status].join(' ').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All Status' || row.status === statusFilter
    const matchesWorkshop = workshopFilter === 'All Workshops' || row.workshop.includes(workshopFilter)
    return matchesSearch && matchesStatus && matchesWorkshop
  })

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
      />
      <div className="flex-1 overflow-auto bg-[#fbf9f8] p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-[18px] font-semibold tracking-[-0.18px] text-[#1b1c1c]">Multi-Workshop Fulfillment</h2>
            <p className="mt-0.5 text-[13px] text-[#5f5e5e]">Monitoring real-time stock allocation across Navala workshops.</p>
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

            <button type="button" onClick={() => setShowAddWorkshop(true)} className="flex h-9 items-center gap-2 rounded-[4px] border border-[#e9bcb7] bg-white px-4 text-[11px] font-bold tracking-[0.55px] text-[#1b1c1c]">
              + Add Workshop
            </button>

            <button type="button" onClick={() => onAction('Allocation logic ran successfully.')} className="flex h-9 items-center gap-2 rounded-[4px] bg-[#bd0014] px-4 text-[11px] font-bold tracking-[0.55px] text-white">
              ↺ Run Allocation Logic
            </button>
          </div>
        </div>

        {showAddWorkshop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
            <div className="w-full max-w-lg rounded-[18px] border border-[#e9bcb7] bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-[#bd0014]">Workshop</p>
                  <h3 className="mt-1 text-[24px] font-black tracking-[-0.5px] text-[#1b1c1c]">Add workshop details</h3>
                </div>
                <button type="button" onClick={() => setShowAddWorkshop(false)} className="text-[24px] leading-none text-[#5f5e5e]">×</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.5px] text-[#5f5e5e]">Workshop organization</label>
                  <input value={workshopForm.org} onChange={event => setWorkshopForm(current => ({ ...current, org: event.target.value }))} className="h-11 w-full rounded-[10px] border border-[#e9bcb7] bg-[#f8f4f3] px-3 text-[14px] text-[#1b1c1c] outline-none focus:border-[#bd0014]" />
                </div>
                <div>
                  <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.5px] text-[#5f5e5e]">Workshop name</label>
                  <input value={workshopForm.name} onChange={event => setWorkshopForm(current => ({ ...current, name: event.target.value }))} className="h-11 w-full rounded-[10px] border border-[#e9bcb7] bg-[#f8f4f3] px-3 text-[14px] text-[#1b1c1c] outline-none focus:border-[#bd0014]" />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.5px] text-[#5f5e5e]">Pending</label>
                    <input value={workshopForm.pending} onChange={event => setWorkshopForm(current => ({ ...current, pending: event.target.value }))} className="h-11 w-full rounded-[10px] border border-[#e9bcb7] bg-[#f8f4f3] px-3 text-[14px] text-[#1b1c1c] outline-none focus:border-[#bd0014]" />
                  </div>
                  <div>
                    <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.5px] text-[#5f5e5e]">Urgent</label>
                    <input value={workshopForm.urgent} onChange={event => setWorkshopForm(current => ({ ...current, urgent: event.target.value }))} className="h-11 w-full rounded-[10px] border border-[#e9bcb7] bg-[#f8f4f3] px-3 text-[14px] text-[#1b1c1c] outline-none focus:border-[#bd0014]" />
                  </div>
                  <div>
                    <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.5px] text-[#5f5e5e]">Transit</label>
                    <input value={workshopForm.transit} onChange={event => setWorkshopForm(current => ({ ...current, transit: event.target.value }))} className="h-11 w-full rounded-[10px] border border-[#e9bcb7] bg-[#f8f4f3] px-3 text-[14px] text-[#1b1c1c] outline-none focus:border-[#bd0014]" />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setShowAddWorkshop(false)} className="rounded-[8px] border border-[#e9bcb7] bg-white px-4 py-2 text-[12px] font-bold uppercase tracking-[0.55px] text-[#1b1c1c]">
                  Cancel
                </button>
                <button type="button" onClick={handleAddWorkshop} className="rounded-[8px] bg-[#bd0014] px-4 py-2 text-[12px] font-bold uppercase tracking-[0.55px] text-white">
                  Save workshop
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Workshop cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {workshopCards.map(w => (
            <div key={w.name} className="rounded-[4px] border border-[#e9bcb7] bg-white p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.55px] text-[#5f5e5e]">{w.org}</p>
              <p className="mt-1 text-[18px] font-black tracking-[-0.18px] text-[#1b1c1c]">{w.name}</p>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-[#5f5e5e]">Pending Requests</p>
                  <p className="text-[24px] font-black text-[#1b1c1c]">{w.pending}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#5f5e5e]">Urgent Needs</p>
                  <span className="mt-1 inline-block rounded-[2px] px-2 py-0.5 text-[10px] font-bold" style={{ color: w.urgentColor, backgroundColor: w.urgentBg }}>{w.urgent}</span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><path d="M0 2h10v8H0V2zM10 4l6 3-6 3V4z" fill="#3b82f6"/></svg>
                <span className="text-[11px] font-bold tracking-[0.55px] text-[#3b82f6]">IN TRANSIT: {w.transit}</span>
              </div>
            </div>
          ))}
          {/* Regional Logistics Hubs */}
          <div className="rounded-[4px] border border-[#e9bcb7] bg-white p-4">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.55px] text-[#5f5e5e]">Regional Logistics Hubs</p>
            <div className="mb-3 flex h-24 items-center justify-center rounded-[2px] bg-[#efeded] text-[11px] text-[#5f5e5e]">🗺 Map view</div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2"><div className="size-2 rounded-full bg-[#bd0014]"/><span className="text-[11px] font-bold text-[#1b1c1c]">NAVALA WAREHOUSE</span></div>
              <div className="flex items-center gap-2"><div className="size-2 rounded-full bg-[#5f5e5e]"/><span className="text-[11px] text-[#5f5e5e]">4 Active Deliveries</span></div>
            </div>
          </div>
        </div>

        {/* Active Fulfillment Queue */}
        <div className="mb-6 overflow-hidden rounded-[4px] border border-[#e9bcb7] bg-white">
          <div className="flex flex-col gap-2 border-b border-[#e9bcb7] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[13px] font-bold text-[#1b1c1c]">Active Fulfillment Queue</span>
            <div className="flex flex-wrap items-center gap-4">
              {[['#22c55e', 'IN TRANSIT'], ['#f59e0b', 'BACKORDERED'], ['#e9e8e7', 'ALLOCATED']].map(([c, l]) => (
                <div key={l} className="flex items-center gap-1">
                  <div className="size-3 rounded-sm" style={{ backgroundColor: c as string }} />
                  <span className="text-[11px] text-[#5f5e5e]">{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[950px] w-full">
              <thead className="bg-[#efeded]">
                <tr>
                  {['PART DETAIL', 'REQUESTING WORKSHOP', 'QTY', 'STATUS', 'SUGGESTED SOURCE', 'PRIORITY ACTIONS'].map(h => (
                    <th key={h} className="border-b border-[#e9bcb7] px-4 py-3 text-left text-[11px] font-bold tracking-[0.55px] text-[#5f5e5e]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, i) => (
                  <tr key={i} className="border-b border-[#e9bcb7]">
                    <td className="px-4 py-4">
                      <p className="text-[13px] font-semibold text-[#1b1c1c]">{row.name}</p>
                      <p className="font-mono text-[11px] text-[#5f5e5e]">SKU: {row.sku}</p>
                    </td>
                    <td className="px-4 py-4 text-[13px] text-[#5f5e5e]">{row.workshop}</td>
                    <td className="px-4 py-4 text-[13px] font-bold text-[#1b1c1c]">{row.qty}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-[2px] px-2 py-1 text-[11px] font-bold" style={{ color: row.statusColor, backgroundColor: row.statusBg }}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {row.sourceRed
                        ? <span className="text-[13px] font-bold text-[#bd0014]">{row.source}</span>
                        : <span className="text-[13px] text-[#5f5e5e]">{row.source}</span>
                      }
                    </td>
                    <td className="px-4 py-4">
                      <button
                        className="rounded-[2px] px-3 py-2 text-[11px] font-bold tracking-[0.55px]"
                        style={{
                          backgroundColor: row.actionStyle === 'red' ? '#bd0014' : row.actionStyle === 'blue' ? '#1d4ed8' : 'transparent',
                          color: row.actionStyle === 'outline' ? '#1b1c1c' : 'white',
                          border: row.actionStyle === 'outline' ? '1px solid #e9bcb7' : 'none',
                        }}
                      >
                        {row.action}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-2 border-t border-[#e9bcb7] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[13px] text-[#5f5e5e]">Showing {filteredRows.length} of 128 open fulfillment requests</span>
            <div className="flex items-center gap-1">
              <span className="text-[13px] text-[#5f5e5e]">Previous</span>
              {['1', '2', '3'].map((p, i) => (
                <button key={i} className={`flex size-8 items-center justify-center rounded-[2px] text-[13px] ${p === '1' ? 'bg-[#bd0014] text-white' : 'text-[#5f5e5e] hover:bg-[#efeded]'}`}>{p}</button>
              ))}
              <span className="text-[13px] text-[#5f5e5e]">Next</span>
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
  {
    supplier: 'Adison Co.', part: '88460-\n47150', desc: 'Bumper\n(Front)',
    qty: 450, unitPrice: '12,400', total: '5,580,000', conf: '98%', confLevel: 'HIGH', confColor: '#15803d', confBg: '#f0fdf4', icon: '✦',
  },
  {
    supplier: 'Denso Corp.', part: '16400-\n0T040', desc: 'Bonnet',
    qty: 120, unitPrice: '28,150', total: '3,378,000', conf: '94%', confLevel: 'HIGH', confColor: '#15803d', confBg: '#f0fdf4', icon: '✦',
  },
  {
    supplier: 'Sumitomo\nElectric', part: '82121-\n02E00', desc: 'R Fender',
    qty: 85, unitPrice: '45,000', total: '3,825,000', conf: '72%', confLevel: 'MED', confColor: '#b45309', confBg: '#fffbeb', icon: '⚠',
  },
  {
    supplier: 'Tokai\nRika', part: '84820-\n02190', desc: 'L Door\n(Rear)',
    qty: null, unitPrice: '4,200', total: '5,040,000', conf: '91%', confLevel: 'HIGH', confColor: '#15803d', confBg: '#f0fdf4', icon: '✦',
  },
]

function PurchaseOrdersView({
  searchTerm,
  onSearchChange,
  onAction,
  aiReviewEnabled,
  setAiReviewEnabled,
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
}: {
  searchTerm: string
  onSearchChange: (value: string) => void
  onAction: (message: string) => void
  aiReviewEnabled: boolean
  setAiReviewEnabled: (value: boolean) => void
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
}) {
  const [rows, setRows] = useState(poRows)

  const filteredRows = rows.filter(row =>
    [row.supplier, row.part, row.desc, row.conf].join(' ').toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const updateQty = (index: number, nextValue: string) => {
    const numeric = nextValue === '' ? null : Number(nextValue)
    setRows(current => current.map((row, rowIndex) =>
      rowIndex === index ? { ...row, qty: Number.isFinite(numeric) ? numeric : null } : row,
    ))
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
      />
      <div className="flex-1 overflow-auto bg-[#fbf9f8] p-4 sm:p-6 lg:p-8">
        <div className="flex min-h-full flex-col gap-8 xl:flex-row">
          {/* Left: table */}
          <div className="flex flex-1 flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-[18px] font-semibold tracking-[-0.18px] text-[#1b1c1c]">Purchase Order Draft</h2>
                <p className="mt-0.5 text-[13px] text-[#5f5e5e]">PO-2024-0892 • Created from AI Prediction Queue</p>
              </div>
              <div>
                <button type="button" onClick={() => setAiReviewEnabled(!aiReviewEnabled)} className="flex items-center gap-3 rounded-[4px] border border-[#e9bcb7] bg-[#f5f3f3] px-4 py-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.55px] text-[#5f5e5e]">REVIEW AI RECOMMENDATION</span>
                  <div className="relative h-6 w-11 flex-shrink-0">
                    <div className={`h-6 w-11 rounded-full ${aiReviewEnabled ? 'bg-[#bd0014]' : 'bg-[#d4d4d4]'}`} />
                    <div className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${aiReviewEnabled ? 'right-0.5' : 'left-0.5'}`} />
                  </div>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-[2px] border border-[#e9bcb7] bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-[900px] w-full">
                  <thead className="bg-[#efeded]">
                    <tr>
                      {[
                        { label: 'SUPPLIER\nNAME', align: 'left' },
                        { label: 'PART\nNUMBER', align: 'left' },
                        { label: 'DESCRIPTION', align: 'left' },
                        { label: 'REC. QTY', align: 'right' },
                        { label: 'UNIT\nPRICE\nLKR.', align: 'right' },
                        { label: 'TOTAL\nLKR.', align: 'right' },
                        { label: 'DEMAND', align: 'center' },
                      ].map(h => (
                        <th key={h.label} className={`border-b border-[#e9bcb7] px-4 py-3 text-[11px] font-bold tracking-[0.55px] text-[#5f5e5e] whitespace-pre-line text-${h.align}`}>
                          {h.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {poRows.map((row, i) => (
                      <tr key={i} className="border-b border-[#e9bcb7]">
                        <td className="whitespace-pre-line px-4 py-4 text-[13px] font-medium text-[#1b1c1c]">{row.supplier}</td>
                        <td className="whitespace-pre-line px-4 py-4 font-mono text-[12px] text-[#1b1c1c]">{row.part}</td>
                        <td className="whitespace-pre-line px-4 py-4 text-[13px] font-medium text-[#1b1c1c]">{row.desc}</td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="flex h-8 w-20 items-center rounded-[2px] border border-[#e9bcb7] bg-white px-2">
                              <span className="flex-1 text-right text-[16px] font-medium text-[#1b1c1c]">{row.qty ?? ''}</span>
                            </div>
                            <span style={{ color: row.icon === '⚠' ? '#f59e0b' : '#bd0014' }}>{row.icon}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right text-[13px] font-medium text-[#1b1c1c]">{row.unitPrice}</td>
                        <td className="px-4 py-4 text-right text-[13px] font-bold text-[#1b1c1c]">{row.total}</td>
                        <td className="px-4 py-4 text-center">
                          <span className="rounded-[2px] px-2 py-1 text-[10px] font-bold uppercase" style={{ color: row.confColor, backgroundColor: row.confBg }}>
                            {row.conf} {row.confLevel}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right: Summary card */}
          <div className="w-full xl:w-[280px] xl:flex-shrink-0">
            <div className="overflow-hidden rounded-[4px] border border-[#e9bcb7] bg-white">
              <div className="border-b border-[#e9bcb7] px-6 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.55px] text-[#5f5e5e]">ORDER SUMMARY</p>
              </div>

              <div className="flex flex-col gap-4 px-6 pt-3">
                {[
                  ['Total SKU Count', '4 Unique Parts'],
                  ['Total Quantity', '1,855 Units'],
                  ['Est. Shipping', 'LKR.145,000'],
                ].map(([l, v]) => (
                  <div key={l} className="flex items-center justify-between">
                    <span className="text-[13px] text-[#5f5e5e]">{l}</span>
                    <span className="text-[13px] font-bold text-[#1b1c1c]">{v}</span>
                  </div>
                ))}

                <div className="flex items-end justify-between border-t border-[#e9bcb7] pt-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase leading-tight tracking-[0.55px] text-[#bd0014]">TOTAL ORDER</p>
                    <p className="text-[11px] font-bold uppercase leading-tight tracking-[0.55px] text-[#bd0014]">VALUE</p>
                  </div>
                  <span className="text-[20px] font-semibold tracking-[-0.48px] text-[#1b1c1c]">LKR.17,968,000</span>
                </div>
              </div>

              <div className="mt-2 flex flex-col gap-2 border-t border-[#e9bcb7] px-6 py-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-[0.55px] text-[#5f5e5e]">MONTHLY BUDGET PROGRESS</span>
                  <span className="text-[11px] font-bold text-[#1b1c1c]">78%</span>
                </div>
                <div className="h-[6px] overflow-hidden rounded-full bg-[#e9e8e7]">
                  <div className="h-full rounded-full bg-[#f59e0b]" style={{ width: '78%' }} />
                </div>
                <p className="text-[11px] text-[#5f5e5e]">¥5.2M remaining in Q3 Logistics Budget</p>
              </div>

              <div className="mx-6 mb-4 rounded-[2px] border border-[#e9bcb7] bg-[#efeded] p-4">
                <div className="mb-1 flex items-center gap-3">
                  <span className="text-[#bd0014]"><IconClock /></span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.55px] text-[#1b1c1c]">ESTIMATED ARRIVAL</span>
                </div>
                <p className="mt-2 text-[18px] font-semibold tracking-[-0.18px] text-[#1b1c1c]">Sept 24 – 28</p>
                <p className="text-[13px] text-[#5f5e5e]">Standard Freight via Ocean</p>
              </div>

              <div className="flex flex-col gap-2 px-6 pb-6">
                <button
                  type="button"
                  onClick={() => onAction('Purchase order finalized and sent to 4 suppliers.')}
                  className="flex h-14 w-full flex-col items-center justify-center rounded-[4px] bg-[#bd0014]"
                >
                  <span className="text-[11px] font-bold uppercase tracking-[0.55px] text-white">FINALIZE AND SEND PO</span>
                  <span className="mt-0.5 text-[10px] uppercase text-white opacity-80">TO 4 SELECTED SUPPLIERS</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAction('Purchase order saved as draft.')}
                  className="flex h-11 w-full items-center justify-center rounded-[2px] border border-[#e9bcb7]"
                >
                  <span className="text-[11px] font-bold uppercase tracking-[0.55px] text-[#1b1c1c]">SAVE AS DRAFT</span>
                </button>
              </div>
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
          <div className="relative z-10 flex h-full flex-col">
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

            <div className="mt-auto grid gap-4 pt-8 sm:grid-cols-3">
              {[
                { label: 'Orders', value: '1,284' },
                { label: 'Fulfillment', value: '94.2%' },
                { label: 'Alerts', value: '42' },
              ].map(item => (
                <div key={item.label} className="rounded-[12px] border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                  <p className="text-[11px] uppercase tracking-[1.2px] text-white/70">{item.label}</p>
                  <p className="mt-2 text-[24px] font-black tracking-[-0.5px]">{item.value}</p>
                </div>
              ))}
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
}: {
  profile: UserProfile
  onChange: (field: keyof UserProfile, value: string | boolean) => void
  onClose: () => void
  onSave: () => void
  onPhotoUpload: (value: string) => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
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
            <div className="w-full">
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.55px] text-[#5f5e5e]">Accent color</label>
              <input
                type="color"
                value={profile.accent}
                onChange={event => onChange('accent', event.target.value)}
                className="h-10 w-full cursor-pointer rounded-[8px] border border-[#e9bcb7] bg-white p-1"
              />
            </div>
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
                  <p className="text-[12px] font-bold uppercase tracking-[0.5px] text-[#5f5e5e]">Account status</p>
                  <p className="mt-1 text-[13px] text-[#1b1c1c]">{profile.isAccountActive ? 'Active account' : 'Deactivated account'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onChange('isAccountActive', !profile.isAccountActive)}
                  className={`relative h-6 w-11 rounded-full transition ${profile.isAccountActive ? 'bg-[#bd0014]' : 'bg-[#d4d4d4]'}`}
                >
                  <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${profile.isAccountActive ? 'right-1' : 'left-1'}`} />
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
  const [aiReviewEnabled, setAiReviewEnabled] = useState(true)
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

  const handleNewOrderSave = (partName: string, supplier: string, quantity: string) => {
    const cleanPartName = partName.trim() || 'New part'
    const cleanSupplier = supplier.trim() || 'Preferred supplier'
    const cleanQuantity = quantity.trim() || '0'

    setStatusMessage(`New order created for ${cleanPartName} from ${cleanSupplier} (${cleanQuantity} units).`)
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
      className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[#fbf9f8] lg:h-screen lg:flex-row"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <Sidebar active={view} onNavigate={handleNavigate} onSignOut={handleSignOut} onOpenSupport={() => setIsSupportOpen(true)} onOpenNewOrder={() => setIsNewOrderOpen(true)} />
      {isSupportOpen && <SupportModal onClose={() => setIsSupportOpen(false)} onSubmit={handleSupportRequest} />}
      {isNewOrderOpen && <NewOrderModal onClose={() => setIsNewOrderOpen(false)} onSubmit={handleNewOrderSave} />}
      <div className="min-w-0 flex-1 overflow-y-auto">
        {statusMessage && (
          <div className="border-b border-[#e9bcb7] bg-[#fff7f5] px-4 py-2 text-[12px] font-medium text-[#bd0014]">
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
            aiReviewEnabled={aiReviewEnabled}
            setAiReviewEnabled={setAiReviewEnabled}
            userName={userProfile.fullName}
            userRole={userProfile.role}
            warehouseName={userProfile.warehouse}
            profilePicture={userProfile.profilePicture}
            onOpenProfile={() => setIsProfileOpen(true)}
            notifications={notifications}
            unreadCount={notifications.filter(item => !item.read).length}
            showNotifications={showNotifications}
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
          onClose={() => setIsProfileOpen(false)}
          onSave={handleSaveProfile}
          onPhotoUpload={value => setUserProfile(current => ({ ...current, profilePicture: value }))}
        />
      )}
    </div>
  )
}
