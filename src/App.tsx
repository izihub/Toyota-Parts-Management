import DatabaseBanner from './DatabaseBanner'
import ApprovedPredictions from './ApprovedPredictions'
import OperationalMetrics from './OperationalMetrics'
import DemandForecastDetails from './DemandForecastDetails'
import FulfillmentActionsModal from './FulfillmentActionsModal'
import InventoryOperations from './InventoryOperations'
import React, { useState } from 'react'
import svgPaths from '../imports/svg-7e3q15howf'
import LandingPage from './LandingPage'
import ReorderBundleModal from './ReorderBundleModal'
import CatalogManager from './CatalogManager'
import ClaimConversionModal from './ClaimConversionModal'
import { catalogRequest, type CatalogItem } from './catalog'
import { draftError, type DraftLine } from './purchase'
import { averageScore, scoreLevel, readPendingIntake, type PendingIntake, type Claim, type ModelMetadata, type IntakeResponse } from './prediction'


type View = 'demand' | 'prediction' | 'inventory' | 'purchase'

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 30000)
  try {
    const response = await fetch(path, { ...options, signal: controller.signal })
    if (!response.ok) throw new Error(`API request failed (${response.status})`)
    return await response.json() as T
  } finally {
    window.clearTimeout(timer)
  }
}

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
function IconPin() {
  return (
    <svg width="13" height="17" viewBox="0 0 13.3333 16.6667" fill="none">
      <path d={svgPaths.p2f7922c0} fill="currentColor" />
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
function IconBike() {
  return (
    <svg width="18" height="19" viewBox="0 0 18.0318 18.5059" fill="none">
      <path d={svgPaths.p1154e780} fill="currentColor" />
    </svg>
  )
}

function CardGlyph({ kind }: { kind: 'queue' | 'parts' | 'inspection' | 'selected' | 'workshop' | 'transit' }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {kind === 'queue' && <><rect x="5" y="4" width="14" height="16" rx="2" /><path d="M9 4V2h6v2M9 9h6M9 13h4" /></>}
      {kind === 'parts' && <><path d="m12 3 8 4-8 4-8-4 8-4Z" /><path d="m4 12 8 4 8-4M4 17l8 4 8-4" /></>}
      {kind === 'inspection' && <><path d="M12 3 22 20H2L12 3Z" /><path d="M12 9v4M12 17h.01" /></>}
      {kind === 'selected' && <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>}
      {kind === 'workshop' && <><path d="M4 20V8l8-4 8 4v12" /><path d="M8 20v-6h8v6M8 9h.01M12 9h.01M16 9h.01" /></>}
      {kind === 'transit' && <><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>}
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
            Add to draft
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
    <header className={`sticky top-0 z-30 flex h-auto flex-shrink-0 flex-col gap-3 border-b px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.08)] lg:h-12 lg:flex-row lg:items-center lg:justify-between lg:py-0 ${headerClasses}`}>
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

type StockRow = {
  img: string
  name: string
  pn: string
  compat: string
  stock: number
  demand: number
  stockColor: string
}

function DemandForecastView({
  searchTerm,
  onSearchChange,
  onAction,
  onClear,
  onAddBundle,
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
  onAddBundle: (lines: DraftLine[]) => void
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
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [showCurrentStock, setShowCurrentStock] = useState(false)
  const [showReorderBundle, setShowReorderBundle] = useState(false)
  const [currentStockForm, setCurrentStockForm] = useState([{ vehicleModel: '', makeYear: '', partNameNo: '', quantity: '' }])
  const [stockRows, setStockRows] = useState<Array<StockRow & {fitments: Array<{model: string; make_year: number}>; reserved: number | null; available: number | null; warehouse: string}>>([])
  const [demandMetrics, setDemandMetrics] = useState<{ delivery_rate: number | null } | null>(null)
  const loadStock = () => apiRequest<Array<{part_name: string; part_number: string | null; quantity: number; reorder_level: number; fitments: Array<{model: string; make_year: number}>; identity_status: string; reserved_quantity?: number; available_quantity?: number; warehouse_name: string; synthetic?: boolean}>>('/api/stock')
    .then(items => setStockRows(items.map(item => ({
      reserved: item.reserved_quantity ?? null, available: item.available_quantity ?? null, warehouse: item.warehouse_name,
      fitments: item.fitments, img: '📦', name: `${item.synthetic ? '[SYNTHETIC] ' : ''}${item.part_name}`, pn: item.part_number || '—', compat: item.fitments.length ? item.fitments.map(f => `${f.model} (${f.make_year})`).join(', ') : item.identity_status === 'CATALOGED' ? 'Fitment not specified' : 'Legacy - fitment not mapped',
      vehicleModel: item.fitments[0]?.model || 'Unmapped', makeYear: item.fitments[0]?.make_year || 0, exteriorPart: 'Other',
      monthYear: new Date().toLocaleString('en', { month: 'short', year: 'numeric' }),
      demand: item.reorder_level, stock: item.quantity,
      stockColor: item.quantity <= item.reorder_level ? '#bd0014' : '#1b1c1c',
      health: item.reorder_level ? Math.min(100, Math.round(item.quantity / item.reorder_level * 100)) : 100,
      conf: item.synthetic ? 'SYNTHETIC' : 'LIVE', confColor: item.synthetic ? '#92400e' : '#15803d', confBg: item.synthetic ? '#fffbeb' : '#f0fdf4',
    }))))
    .catch(error => onAction(`Could not load stock: ${String(error)}`))
  const loadDemandMetrics = () => apiRequest<{ delivery_rate: number | null }>('/api/metrics')
    .then(data => setDemandMetrics(data))
    .catch(error => onAction(`Could not load demand metrics: ${String(error)}`))
  React.useEffect(() => { void loadStock(); void loadDemandMetrics() }, [])

  const lowStockAlerts = stockRows.filter(row => row.stock <= row.demand).length
  const criticalStockouts = stockRows.filter(row => row.stock <= 0).length
  const fulfillmentRate = demandMetrics?.delivery_rate ?? null
  const fulfillmentPercent = fulfillmentRate == null ? 0 : Math.min(100, Math.max(0, fulfillmentRate))

  const vehicleOptions = ['All Models', ...new Set(stockRows.flatMap(row => row.fitments.map(f => f.model)))]
  const makeYearOptions = ['All Years', ...new Set(stockRows.flatMap(row => row.fitments.map(f => String(f.make_year))))]

  const filteredRows = stockRows.filter(row => {
    const matchesSearch = [row.name, row.pn, row.compat].join(' ').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesVehicle = vehicleFilter === 'All Models' || row.fitments.some(f => f.model === vehicleFilter)
    const matchesYear = makeYearFilter === 'All Years' || row.fitments.some(f => String(f.make_year) === makeYearFilter && (vehicleFilter === 'All Models' || f.model === vehicleFilter))
    return matchesSearch && matchesVehicle && matchesYear
  })

  const handleClearAll = () => {
    setVehicleFilter('All Models')
    setMakeYearFilter('All Years')
    onClear()
  }

  const handleAddCurrentStock = async () => {
    const validStockRows = currentStockForm.filter(row => row.vehicleModel.trim() && row.makeYear.trim() && row.partNameNo.trim() && Number(row.quantity) > 0)

    if (validStockRows.length !== currentStockForm.length) {
      onAction('Complete all current stock rows before saving.')
      return
    }

    try {
      await apiRequest('/api/stock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(validStockRows.map(row => ({ vehicle_model: row.vehicleModel, make_year: Number(row.makeYear), part_name: row.partNameNo, quantity: Number(row.quantity), warehouse_name: warehouseName }))) })
      const totalQuantity = validStockRows.reduce((total, row) => total + Number(row.quantity), 0)
      setCurrentStockForm([{ vehicleModel: '', makeYear: '', partNameNo: '', quantity: '' }])
      setShowCurrentStock(false)
      void loadStock()
      onAction(`${totalQuantity} stock units saved to ${warehouseName}.`)
    } catch (error) { onAction(`Could not save stock: ${String(error)}`) }
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
            <h2 className="text-[18px] font-semibold tracking-[-0.18px] text-[#1b1c1c]">Demand Review &amp; Inventory</h2>
            <p className="mt-0.5 text-[13px] text-[#5f5e5e]">Reviewing saved predictions and current warehouse stock.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setShowCurrentStock(true)} className="flex h-9 items-center gap-2 rounded-[4px] border border-[#e9bcb7] bg-white px-4 text-[11px] font-bold tracking-[0.55px] text-[#1b1c1c]">
              + Add Legacy Stock
            </button>
            <button type="button" onClick={() => setShowReorderBundle(true)} className="flex h-9 items-center gap-2 rounded-[4px] bg-[#bd0014] px-4 text-[11px] font-bold tracking-[0.55px] text-white">
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
                  <h3 className="mt-1 text-[24px] font-black tracking-[-0.5px] text-[#1b1c1c]">Add legacy stock</h3>
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
        {showReorderBundle && <ReorderBundleModal onAddBundle={onAddBundle} onClose={() => setShowReorderBundle(false)} />}

        <CatalogManager onUpdated={() => void loadStock()} />

        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-[4px] border border-[#e9bcb7] bg-white p-4 pl-5 shadow-[0_8px_24px_rgba(189,0,20,0.06)]">
            <div className="absolute inset-y-0 left-0 w-1 bg-[#bd0014]" />
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.55px] text-[#5f5e5e]">Low Stock Alerts</p>
              <span className="flex size-9 items-center justify-center rounded-[4px] bg-[#fff7f5] text-[#bd0014]" aria-hidden="true">
                <svg width="20" height="18" viewBox="0 0 22 19" fill="none">
                  <path d="M11 0L21.5 18H0.5L11 0Z" fill="currentColor" />
                  <path d="M11 5v6M11 14.5v.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
            </div>

            <div className="mt-4 flex items-end gap-2">
              <span className="text-[32px] font-semibold leading-[32px] tracking-[-0.48px] text-[#1b1c1c]">
                {lowStockAlerts.toLocaleString()}
              </span>
              <span className="pb-1 text-[13px] text-[#5f5e5e]">SKUs</span>
            </div>

            <div className="mt-3 flex items-center gap-2 text-[13px] font-medium text-[#ba1a1a]">
              <span className="inline-block size-2.5 rounded-full bg-[#ba1a1a]" />
              {criticalStockouts.toLocaleString()} CRITICAL STOCKOUTS
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[4px] border border-[#e9bcb7] bg-white p-4 pl-5 shadow-[0_8px_24px_rgba(16,185,129,0.08)]">
            <div className="absolute inset-y-0 left-0 w-1 bg-[#10b981]" />
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.55px] text-[#5f5e5e]">Fulfillment Rate</p>
              <span className="flex size-9 items-center justify-center rounded-[4px] bg-[#ecfdf5] text-[#059669]" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8.5 14.5L4.5 10.5L5.7 9.3L8.5 12.1L14.3 6.3L15.5 7.5L8.5 14.5Z" fill="currentColor" />
                </svg>
              </span>
            </div>

            <div className="mt-4 text-[32px] font-semibold leading-[32px] tracking-[-0.48px] text-[#1b1c1c]">
              {fulfillmentRate == null ? '—' : `${fulfillmentRate.toFixed(1)}%`}
            </div>

            <div className="mt-4 h-[6px] w-full overflow-hidden rounded-full bg-[#efeded]">
              <div
                className="h-full rounded-full bg-[#10b981]"
                style={{ width: `${fulfillmentPercent}%` }}
              />
            </div>
          </div>
        </div>

        <DemandForecastDetails />
        <ApprovedPredictions />

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
                    {['SPARE PART DETAILS', 'COMPATIBILITY', 'WAREHOUSE', 'ON HAND', 'RESERVED', 'AVAILABLE'].map(h => (
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
                      <td className="px-4 py-3 text-[13px] font-medium text-[#1b1c1c]">{row.warehouse}</td>
                      <td className="px-4 py-3 text-[13px] font-medium" style={{ color: isNightMode && row.stockColor === '#1b1c1c' ? '#ffffff' : row.stockColor }}>{row.stock.toLocaleString()}</td>
                      <td className="px-4 py-3">{row.reserved ?? 'Unmapped'}</td>
                      <td className="px-4 py-3">
                        {row.available ?? 'Unmapped'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-2 border-t border-[#e9bcb7] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-[13px] text-[#5f5e5e]">Showing {filteredRows.length} of {stockRows.length} warehouse stock records</span>
            </div>
          </div>


        </div>
      </div>
    </div>
  )
}

// ─── Prediction Queue View ────────────────────────────────────────────────────

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
  const [showConversion, setShowConversion] = useState(false)
  const [queueRows, setQueueRows] = useState<Claim[]>([])
  const [pendingStorageKey] = useState(() => {
    try { return `toyota-pending-intake:${localStorage.getItem('toyota-active-user-email') || userName}` }
    catch { return `toyota-pending-intake:${userName}` }
  })
  const [restoredIntake] = useState(() => readPendingIntake(pendingStorageKey))
  const restoredBody = restoredIntake ? JSON.parse(restoredIntake.body) : null
  const [metadata, setMetadata] = useState<ModelMetadata | null>(null)
  const [queueLoading, setQueueLoading] = useState(true)
  const [queueError, setQueueError] = useState('')
  const [metadataError, setMetadataError] = useState('')
  const [intakeError, setIntakeError] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedActions, setSelectedActions] = useState<string[]>([])
  const [confidenceFilter, setConfidenceFilter] = useState('All Scores')
  const [yearFilter, setYearFilter] = useState('All Years')
  const [vehicleFilter, setVehicleFilter] = useState('All Models')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [intakeModel, setIntakeModel] = useState<string>(restoredBody?.model || '')
  const [intakeYear, setIntakeYear] = useState<string>(String(restoredBody?.make_year || 2013))
  const [impactZone, setImpactZone] = useState<string>(restoredBody?.damage_zone || 'Front')
  const [isPredicting, setIsPredicting] = useState(false)
  const [isReviewing, setIsReviewing] = useState(false)
  const intakeLock = React.useRef(false)
  const reviewLock = React.useRef(false)
  const pendingIntake = React.useRef<PendingIntake | null>(restoredIntake)
  const loadGeneration = React.useRef(0)

  const loadQueue = React.useCallback(async () => {
    const generation = ++loadGeneration.current
    setQueueLoading(true)
    setQueueError('')
    try {
      const rows = await apiRequest<Claim[]>('/api/claims')
      if (generation === loadGeneration.current) {
        setQueueRows(rows)
        setSelectedIds(current => current.filter(id => rows.some(row => row.id === id)))
        setSelectedActions(current => current.filter(id => rows.some(row => row.parts.some(part => `${row.id}-${part.name}` === id))))
      }
    } catch {
      if (generation === loadGeneration.current) setQueueError('Could not load the review queue. Please retry.')
    } finally {
      if (generation === loadGeneration.current) setQueueLoading(false)
    }
  }, [])

  const loadMetadata = React.useCallback(async () => {
    setMetadataError('')
    try {
      const data = await apiRequest<ModelMetadata>('/api/model-metadata')
      setMetadata(data)
      if (!pendingIntake.current) {
        setIntakeModel(current => data.vehicle_models.includes(current) ? current : '')
        setImpactZone(current => data.damage_zones.includes(current) ? current : data.damage_zones[0] || '')
      }
    } catch {
      setMetadataError('Vehicle options are unavailable. Retry before creating a claim.')
    }
  }, [])

  React.useEffect(() => {
    void loadQueue()
    void loadMetadata()
    return () => { loadGeneration.current++ }
  }, [loadQueue, loadMetadata])

  const handleClaimsIntake = async () => {
    if (intakeLock.current) return
    const submitted = pendingIntake.current ? JSON.parse(pendingIntake.current.body) as { model: string; make_year: number; damage_zone: string } : { model: intakeModel, make_year: Number(intakeYear), damage_zone: impactZone }
    const year = submitted.make_year
    if (!pendingIntake.current && (!metadata || !metadata.vehicle_models.includes(intakeModel) || !metadata.damage_zones.includes(impactZone) || !Number.isInteger(year) || year < metadata.min_year || year > metadata.max_year)) {
      setIntakeError('Choose a supported vehicle variant and enter a valid make year.')
      return
    }
    const body = pendingIntake.current?.body ?? JSON.stringify(submitted)
    pendingIntake.current ??= { body, key: crypto.randomUUID() }
    try { sessionStorage.setItem(pendingStorageKey, JSON.stringify(pendingIntake.current)) }
    catch {
      pendingIntake.current = null
      setIntakeError('Browser storage is unavailable. Enable storage before submitting a claim so retries can be recovered safely.')
      return
    }
    intakeLock.current = true
    setIsPredicting(true)
    setIntakeError('')
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 45000)
    try {
      const response = await fetch('/api/predict-intake', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': pendingIntake.current.key }, body,
        signal: controller.signal,
      })
      if (!response.ok) {
        if ([400, 422].includes(response.status)) {
          pendingIntake.current = null
          sessionStorage.removeItem(pendingStorageKey)
          setIntakeError('The claim details were rejected. Check the vehicle variant, year and impact zone, then try again.')
          return
        }
        throw new Error(`Intake failed (${response.status})`)
      }
      const prediction = await response.json() as IntakeResponse
      sessionStorage.removeItem(pendingStorageKey)
      pendingIntake.current = null
      // Keep the confirmed result visible even if the subsequent queue refresh fails.
      loadGeneration.current++
      const claim: Claim = {
        id: prediction.accident_id, date: new Date().toLocaleString(), vehicle: submitted.model, year,
        damage_zone: prediction.damage_zone, model_version: prediction.model_version, status: 'PENDING',
        parts: prediction.predicted_parts.map(part => ({ ...part, name: part.part_name, human_action: null })),
      }
      setQueueRows(current => [claim, ...current.filter(row => row.id !== claim.id)])
      onAction(claim.parts.length ? `${claim.id} saved for review.` : `${claim.id} saved. No parts met the model thresholds; manual inspection is needed.`)
      void loadQueue()
    } catch (error) {
      setIntakeError(controller.signal.aborted
        ? 'The request timed out after 45 seconds. Retry Claim will check the original submission without creating a duplicate.'
        : `${error instanceof Error ? error.message : 'Connection failed'}. Could not confirm whether this claim was saved. Retry Claim safely checks the original submission.`)
    } finally {
      window.clearTimeout(timer)
      intakeLock.current = false
      setIsPredicting(false)
    }
  }

  const confidenceOptions = ['All Scores', 'High (80+%)', 'Medium (50-79%)', 'Low (<50%)']
  const yearOptions = ['All Years', ...Array.from(new Set(queueRows.map(row => row.year))).sort((a, b) => b - a).map(String)]
  const vehicleOptions = ['All Models', ...Array.from(new Set(queueRows.map(row => row.vehicle)))]

  const filteredRows = queueRows.filter(row => {
    const matchesSearch = [row.id, row.vehicle, row.parts.map(part => part.name).join(' '), row.date].join(' ').toLowerCase().includes(searchTerm.toLowerCase())
    const score = averageScore(row)
    const matchesConfidence = confidenceFilter === 'All Scores' || 
      (confidenceFilter === 'High (80+%)' && score !== null && score >= 80) ||
      (confidenceFilter === 'Medium (50-79%)' && score !== null && score >= 50 && score < 80) ||
      (confidenceFilter === 'Low (<50%)' && score !== null && score < 50)
    const matchesYear = yearFilter === 'All Years' || row.year.toString() === yearFilter
    const matchesVehicle = vehicleFilter === 'All Models' || row.vehicle === vehicleFilter
    return matchesSearch && matchesConfidence && matchesYear && matchesVehicle
  })

  const toggleSelected = (id: string) => {
    setSelectedIds(current =>
      current.includes(id) ? current.filter(item => item !== id) : [...current, id],
    )
  }

  const handleSelectedAction = async (action: 'approved' | 'rejected', ids = selectedIds) => {
    if (reviewLock.current) return
    if (ids.length === 0 && selectedActions.length === 0) {
      onAction('Select at least one claim or part to review.')
      return
    }
    reviewLock.current = true
    setIsReviewing(true)
    try {
      const parts = queueRows.flatMap(row => row.parts.filter(part => selectedActions.includes(`${row.id}-${part.name}`)).map(part => ({ accident_id: row.id, part_name: part.name })))
      await apiRequest('/api/claims/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accident_ids: ids, parts, action: action.toUpperCase() }) })
      setSelectedIds([])
      setSelectedActions([])
      onAction(`Selected reviews ${action}.`)
      await loadQueue()
    } catch { onAction('Could not confirm the review. Check the refreshed queue before retrying.'); await loadQueue() }
    finally { reviewLock.current = false; setIsReviewing(false) }
  }

  return (
    <div className="flex flex-1 flex-col">
      {showConversion && <ClaimConversionModal onClose={() => setShowConversion(false)} onSaved={onAction} />}
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
            <p className="mt-0.5 text-[13px] text-[#5f5e5e]">Review suggested repair parts and their model scores before approving claims.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setShowConversion(true)} className="rounded border border-[#e9bcb7] bg-white px-4 py-2 text-xs font-bold text-[#1b1c1c]">Create fulfillment from reviewed claim</button>
            <button type="button" disabled={isPredicting || isReviewing || queueLoading || !!queueError || queueRows.length === 0} onClick={() => void handleSelectedAction('approved', queueRows.map(row => row.id))} className="flex h-9 items-center gap-2 rounded-[4px] border border-[#e9bcb7] bg-white px-4 text-[11px] font-bold tracking-[0.55px] text-[#1b1c1c]">
              Approve All Claims
            </button>
            <button type="button" disabled={isPredicting || isReviewing || queueLoading || !!queueError} onClick={() => void handleSelectedAction('approved')} className="flex h-9 items-center gap-2 rounded-[4px] bg-[#bd0014] px-4 text-[11px] font-bold tracking-[0.55px] text-white">
              ✓ Approve Selected
            </button>
            <button type="button" disabled={isPredicting || isReviewing || queueLoading || !!queueError} onClick={() => void handleSelectedAction('rejected')} className="flex h-9 items-center gap-2 rounded-[4px] border border-[#e9bcb7] bg-white px-4 text-[11px] font-bold tracking-[0.55px] text-[#1b1c1c]">
              ✕ Reject Selected
            </button>
          </div>
        </div>

        {metadataError && <p role="alert" className="mb-4 text-sm text-[#bd0014]">{metadataError} <button type="button" onClick={() => void loadMetadata()} className="underline">Retry vehicle options</button></p>}
        {!metadata && !metadataError && <p role="status">Loading supported vehicle variants...</p>}
        {pendingIntake.current && !isPredicting && <p role="status" className="mb-4 text-sm text-[#5f5e5e]">A previous submission needs confirmation. You can edit the fields for your next claim. Retry Claim sends the original saved details; after it succeeds, submit your edited details as a new claim.</p>}
        {intakeError && <p role="alert" className="mb-4 text-sm text-[#bd0014]">{intakeError}</p>}
        <div className="mb-6 rounded-[4px] border border-[#e9bcb7] bg-white p-4">
          <div className="mb-3">
            <p className="text-[12px] font-bold uppercase tracking-[0.55px] text-[#bd0014]">Vehicle Claims Intake</p>
            <p className="mt-1 text-[12px] text-[#5f5e5e]">Choose the exact vehicle variant. If it is not listed, manual assessment is required.</p>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <label className="flex flex-1 flex-col gap-1 text-[11px] font-bold text-[#5f5e5e]">
              Vehicle Model
              <select disabled={!metadata || isPredicting} value={intakeModel} onChange={event => setIntakeModel(event.target.value)} className="h-9 rounded-[4px] border border-[#e9bcb7] bg-[#f8f4f3] px-3 text-[12px] font-bold text-[#1b1c1c]">
                <option value="">Choose a vehicle variant</option>
                {pendingIntake.current && !metadata?.vehicle_models.includes(intakeModel) && <option value={intakeModel}>{intakeModel}</option>}
                {metadata?.vehicle_models.map(model => <option key={model}>{model}</option>)}
              </select>
            </label>
            <label className="flex w-full flex-col gap-1 text-[11px] font-bold text-[#5f5e5e] lg:w-28">
              Year
              <input disabled={isPredicting} min={metadata?.min_year} max={metadata?.max_year} step="1" type="number" value={intakeYear} onChange={event => setIntakeYear(event.target.value)} className="h-9 rounded-[4px] border border-[#e9bcb7] bg-[#f8f4f3] px-3 text-[12px] font-bold text-[#1b1c1c]" />
            </label>
            <fieldset className="flex flex-1 flex-col gap-1">
              <legend className="text-[11px] font-bold text-[#5f5e5e]">Impact Zone</legend>
              <div className="flex h-9 items-center gap-4 rounded-[4px] border border-[#e9bcb7] bg-[#f8f4f3] px-3">
                {(metadata?.damage_zones ?? []).map(zone => <label key={zone} className="flex items-center gap-1 text-[12px] font-bold text-[#1b1c1c]"><input disabled={isPredicting} type="radio" name="impact-zone" value={zone} checked={impactZone === zone} onChange={event => setImpactZone(event.target.value)} className="accent-[#bd0014]" />{zone}</label>)}
              </div>
            </fieldset>
            <button type="button" onClick={handleClaimsIntake} disabled={isPredicting || (!pendingIntake.current && (!metadata || !intakeModel)) || isReviewing} className="h-9 rounded-[4px] bg-[#bd0014] px-4 text-[11px] font-bold tracking-[0.55px] text-white disabled:opacity-60">
              {isPredicting ? 'Predicting...' : pendingIntake.current ? 'Retry Claim' : 'Predict Damaged Parts'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-[4px] border border-[#e9bcb7] bg-white p-3">
          {/* Confidence Score Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[#5f5e5e]">Average Model Score</span>
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
                  <th className="w-8 px-4 py-3"><input type="checkbox" aria-label="Select all visible claims" disabled={isReviewing} checked={filteredRows.length > 0 && filteredRows.every(row => selectedIds.includes(row.id))} onChange={() => {
                    if (filteredRows.every(row => selectedIds.includes(row.id))) {
                      setSelectedIds([])
                    } else {
                      setSelectedIds(filteredRows.map(row => row.id))
                    }
                  }} className="size-4" /></th>
                  {['ACCIDENT ID / DATE', 'VEHICLE TYPE', 'SUGGESTED PARTS / MODEL SCORE', 'SCORE LEVEL', 'HUMAN ACTION'].map(h => (
                    <th key={h} className="border-b border-[#e9bcb7] px-4 py-3 text-left text-[11px] font-bold tracking-[0.55px] text-[#5f5e5e]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(queueLoading || queueError || filteredRows.length === 0) && <tr><td colSpan={6} className="p-6 text-center text-sm text-[#5f5e5e]" role={queueError ? 'alert' : 'status'}>
                  {queueLoading ? 'Loading claims...' : queueError || (queueRows.length ? 'No claims match these filters.' : 'No claims are awaiting review.')}
                  {queueError && <button type="button" onClick={() => void loadQueue()} className="ml-2 underline">Retry queue</button>}
                </td></tr>}
                {!queueLoading && filteredRows.map(row => (
                  <tr key={row.id} className="border-b border-[#e9bcb7]">
                    <td className="px-4 py-4"><input type="checkbox" aria-label={`Select claim ${row.id}`} disabled={isReviewing} checked={selectedIds.includes(row.id)} onChange={() => toggleSelected(row.id)} className="size-4" /></td>
                    <td className="px-4 py-4">
                      <p className="text-[13px] font-semibold text-[#1b1c1c]">{row.id}</p>
                      <p className="mt-0.5 text-[11px] text-[#5f5e5e]">{row.date}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-[13px] font-medium text-[#1b1c1c]">{row.vehicle}</p>
                      <p className="text-[11px] text-[#5f5e5e]">Model Year: {row.year}</p>
                      <p className="mt-1 text-[11px] text-[#5f5e5e]">Impact zone: {row.damage_zone || 'Not recorded'}</p>
                    </td>
                    <td className="px-4 py-4">
                      {row.parts.length === 0 && <p className="text-[12px] text-[#5f5e5e]">No parts met the prediction thresholds. Manual inspection needed.</p>}
                      <div className="flex flex-wrap gap-1">
                        {row.parts.map(part => (
                          <span key={part.name} className="rounded-[2px] bg-[#efeded] px-2 py-1 text-[11px] font-bold tracking-[0.5px] text-[#5f5e5e]">{part.name} - {part.confidence_pct.toFixed(1)}% model score</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        {row.parts.map(part => <span key={part.name} className="text-[11px] font-bold" style={{ color: part.confidence_pct >= 80 ? '#15803d' : part.confidence_pct >= 50 ? '#b45309' : '#b91c1c' }}>{scoreLevel(part.confidence_pct)}</span>)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        {row.parts.map(part => {
                          const actionId = `${row.id}-${part.name}`
                          return <label key={actionId} className="flex h-[22px] items-center"><input disabled={isReviewing} aria-label={`Review ${part.name} for ${row.id}`} type="checkbox" checked={selectedActions.includes(actionId)} onChange={() => setSelectedActions(current => current.includes(actionId) ? current.filter(id => id !== actionId) : [...current, actionId])} className="size-4 accent-[#bd0014]" /></label>
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-2 border-t border-[#e9bcb7] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[13px] text-[#5f5e5e]">Showing {filteredRows.length} of {queueRows.length} pending claims</span>
          </div>
        </div>

        {/* Bottom stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Pending Claims', value: String(queueRows.length), sub: 'Awaiting review', subColor: '#92400e', accent: '#d97706', icon: 'queue' as const, iconTone: 'bg-[#fffbeb] text-[#b45309]' },
            { label: 'Suggested Parts', value: String(queueRows.reduce((sum, row) => sum + row.parts.length, 0)), sub: 'Unreviewed suggestions', subColor: '#1d4ed8', accent: '#2563eb', icon: 'parts' as const, iconTone: 'bg-[#eff6ff] text-[#2563eb]' },
            { label: 'Manual Inspection', value: String(queueRows.filter(row => row.parts.length === 0).length), sub: 'No parts passed thresholds', subColor: '#bd0014', accent: '#bd0014', icon: 'inspection' as const, iconTone: 'bg-[#fff7f5] text-[#bd0014]' },
            { label: 'Selected Claims', value: String(selectedIds.length), sub: 'Whole-claim review selected', subColor: '#047857', accent: '#10b981', icon: 'selected' as const, iconTone: 'bg-[#ecfdf5] text-[#059669]' },
          ].map(s => (
            <div key={s.label} className="relative overflow-hidden rounded-[4px] border border-[#e9bcb7] bg-white p-4 pl-5 shadow-[0_6px_18px_rgba(27,28,28,0.04)]">
              <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: s.accent }} />
              <div className="flex items-start justify-between gap-3">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.45px] text-[#5f5e5e]">{s.label}</p>
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-[4px] ${s.iconTone}`}><CardGlyph kind={s.icon} /></span>
              </div>
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

type WorkshopCard = { org: string; name: string; addedDate: string }
type FulfillmentPart = { name: string; sku: string; qty: number; unitPrice: number; vehicle_model?: string; make_year?: number }
type FulfillmentRow = { id: string; workshop: string; status: string; accident_id?: string; parts: FulfillmentPart[] }

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
  const [workshopCards, setWorkshopCards] = useState<WorkshopCard[]>([])
  const [workshopForm, setWorkshopForm] = useState({ org: '', name: '', addedDate: new Date().toISOString().slice(0, 10) })
  const [orderForm, setOrderForm] = useState({
    workshopName: '',
    parts: [{ partNameNo: '', vehicleModel: '', makeYear: '', quantity: '', unitPrice: '' }],
  })
  const [fulfillmentRows, setFulfillmentRows] = useState<FulfillmentRow[]>([])
  const [managedOrder, setManagedOrder] = useState<string | null>(null)
  const [selectedFulfillmentIds, setSelectedFulfillmentIds] = useState<string[]>([])
  const loadWorkshops = () => apiRequest<Array<{name: string; organization: string; created_at: string}>>('/api/workshops')
    .then(items => setWorkshopCards(items.map(item => ({ org: item.organization, name: item.name, addedDate: item.created_at.slice(0, 10), pending: 0, urgent: '0 ALERT', urgentColor: '#b45309', urgentBg: '#fffbeb', transit: '0 SKUS' }))))
    .catch(error => onAction(`Could not load workshops: ${String(error)}`))
  const loadFulfillment = () => apiRequest<typeof fulfillmentRows>('/api/fulfillment').then(setFulfillmentRows).catch(error => onAction(`Could not load fulfillment: ${String(error)}`))
  React.useEffect(() => { void loadWorkshops(); void loadFulfillment() }, [])

  const handleAddWorkshop = async () => {
    const organizationName = workshopForm.org.trim()
    const workshopName = workshopForm.name.trim()
    if (!organizationName || !workshopName) {
      onAction('Enter an organization name and workshop name.')
      return
    }

    try { await apiRequest('/api/workshops', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: workshopName, organization: organizationName }) }) }
    catch (error) { onAction(`Could not save workshop: ${String(error)}`); return }
    void loadWorkshops()
    setWorkshopForm({ org: '', name: '', addedDate: new Date().toISOString().slice(0, 10) })
    setShowWorkshopDetails(false)
    onAction(`${workshopName} added successfully.`)
  }

  const handleCreateOrder = async () => {
    const workshopName = orderForm.workshopName.trim()
    const parts = orderForm.parts
      
      .map(part => ({
        name: part.partNameNo.trim(),
        vehicleModel: part.vehicleModel.trim(),
        sku: part.partNameNo.trim() || `MAKE YEAR: ${part.makeYear.trim()}`,
        makeYear: part.makeYear.trim(),
        qty: Number(part.quantity) || 0,
        unitPrice: Number(part.unitPrice) || 0,
      }))

    if (!workshopName || parts.length === 0 || parts.some(part => !part.name || !part.vehicleModel || !part.makeYear || !Number.isInteger(part.qty) || part.qty <= 0 || part.unitPrice < 0)) {
      onAction('Enter a workshop name and at least one part.')
      return
    }

    try { await apiRequest('/api/fulfillment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workshop_name: workshopName, parts: parts.map(part => ({ part_name: part.name, vehicle_model: part.vehicleModel, make_year: Number(part.makeYear), quantity: part.qty, unit_price: part.unitPrice })) }) }) }
    catch (error) { onAction(`Could not save fulfillment order: ${String(error)}`); return }
    void loadFulfillment()
    setOrderForm({ workshopName: '', parts: [{ partNameNo: '', vehicleModel: '', makeYear: '', quantity: '', unitPrice: '' }] })
    setShowAddWorkshop(false)
    onAction(`New order for ${workshopName} added successfully.`)
  }

  const statusOptions = ['All Status', 'PENDING', 'IN TRANSIT', 'FULFILLED']
  const workshopOptions = ['All Workshops', ...workshopCards.map(workshop => workshop.name)]

  const filteredRows = fulfillmentRows.filter(row => {
    const matchesSearch = [row.workshop, row.status, ...row.parts.flatMap(part => [part.name, part.sku])].join(' ').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All Status' || row.status === statusFilter
    const matchesWorkshop = workshopFilter === 'All Workshops' || row.workshop.includes(workshopFilter)
    return matchesSearch && matchesStatus && matchesWorkshop
  })

  const fulfillSelectedOrders = async () => {
    if (selectedFulfillmentIds.length === 0) return
    const results = await Promise.allSettled(selectedFulfillmentIds.map(id => apiRequest(`/api/fulfillment/${id.replace('fulfill-', '')}?status=FULFILLED`, { method: 'PATCH' })))
    await loadFulfillment()
    setSelectedFulfillmentIds([])
    onAction(`${results.filter(r => r.status === 'fulfilled').length} deliveries confirmed; ${results.filter(r => r.status === 'rejected').length} failed.`)
  }

  const clearFulfillmentRow = (rowId: string) => {
    void apiRequest(`/api/fulfillment/${rowId.replace('fulfill-', '')}`, { method: 'DELETE' })
      .then(() => loadFulfillment()).catch(error => onAction(`Could not delete fulfillment order: ${String(error)}`))
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
            <div key={w.name} className="relative min-w-[280px] flex-1 overflow-hidden rounded-[4px] border border-[#e9bcb7] bg-white p-4 pl-5 shadow-[0_6px_18px_rgba(37,99,235,0.06)]">
              <div className="absolute inset-y-0 left-0 w-1 bg-[#2563eb]" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.55px] text-[#5f5e5e]">{w.org}</p>
                  <p className="mt-1 text-[18px] font-black tracking-[-0.18px] text-[#1b1c1c]">{w.name}</p>
                </div>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[4px] bg-[#eff6ff] text-[#2563eb]"><CardGlyph kind="workshop" /></span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-[#5f5e5e]">Pending Requests</p>
                  <p className="text-[24px] font-black text-[#1b1c1c]">{fulfillmentRows.filter(row => row.workshop === w.name && row.status === 'PENDING').length}</p>
                </div>
                <span className="flex size-8 items-center justify-center rounded-[4px] bg-[#fffbeb] text-[#b45309]"><CardGlyph kind="queue" /></span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-[4px] bg-[#eff6ff] text-[#2563eb]"><CardGlyph kind="transit" /></span>
                <span className="text-[11px] font-bold tracking-[0.55px] text-[#3b82f6]">IN TRANSIT: {fulfillmentRows.filter(row => row.workshop === w.name && row.status === 'IN TRANSIT').length} orders</span>
              </div>
            </div>
          ))}
        </div>

        <InventoryOperations />
        {managedOrder && <FulfillmentActionsModal orderId={managedOrder} onClose={() => setManagedOrder(null)} onUpdated={() => void loadFulfillment()} />}
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
                    <td className="px-4 py-4 text-[13px] text-[#5f5e5e]">{row.workshop}{row.accident_id && <p className="mt-1 text-xs">Claim: {row.accident_id}</p>}</td>
                    <td className="px-4 py-4">
                      {row.parts.map(part => (
                        <div key={part.sku} className="mb-1 last:mb-0">
                          <p className="text-[13px] font-semibold text-[#1b1c1c]">{part.name}</p>
                          <p className="font-mono text-[11px] text-[#5f5e5e]">SKU: {part.sku}</p>
                          {part.vehicle_model && <p className="text-xs text-[#5f5e5e]">{part.vehicle_model} ({part.make_year})</p>}
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
                      <p className="text-xs font-bold">{row.status}</p>
                      <button className="mt-2 text-xs underline" onClick={() => setManagedOrder(row.id)}>Manage stock & companions</button>
                    </td>
                    <td className="px-4 py-4">
                      <input
                        aria-label={`Fulfill ${row.parts.map(part => part.name).join(', ')}`}
                        type="checkbox"
                        disabled={row.status !== 'IN TRANSIT'}
                        checked={selectedFulfillmentIds.includes(row.id)}
                        onChange={() => setSelectedFulfillmentIds(current => current.includes(row.id) ? current.filter(id => id !== row.id) : [...current, row.id])}
                        className="size-4 accent-[#bd0014]"
                      />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button type="button" disabled={!!row.accident_id || row.status !== 'PENDING'} title={row.accident_id ? 'Linked claim orders cannot be deleted' : undefined} aria-label={`Clear ${row.parts.map(part => part.name).join(', ')}`} onClick={() => clearFulfillmentRow(row.id)} className="flex size-7 items-center justify-center rounded-[2px] text-[18px] leading-none text-[#5f5e5e] hover:bg-[#fef2f2] hover:text-[#bd0014]">×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-2 border-t border-[#e9bcb7] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[13px] text-[#5f5e5e]">Showing {filteredRows.length} of {fulfillmentRows.length} fulfillment requests</span>
            <div className="flex items-center gap-3">
              <button type="button" onClick={fulfillSelectedOrders} disabled={selectedFulfillmentIds.length === 0} className="rounded-[2px] bg-[#bd0014] px-3 py-2 text-[11px] font-bold tracking-[0.55px] text-white disabled:cursor-not-allowed disabled:opacity-40">
                FULFILL ORDERS
              </button>
            </div>
          </div>
        </div>

        <OperationalMetrics fulfillment />

      </div>
    </div>
  )
}

// ─── Purchase Orders View ─────────────────────────────────────────────────────

function PurchaseOrdersView({
  searchTerm,
  onSearchChange,
  onAction,
  addedRows,
  onRowsChange,
  shippingCost,
  setShippingCost,
  isSaving,
  setIsSaving,
  onOrderSaved,
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
  addedRows: DraftLine[]
  onRowsChange: React.Dispatch<React.SetStateAction<DraftLine[]>>
  shippingCost: string
  setShippingCost: React.Dispatch<React.SetStateAction<string>>
  isSaving: boolean
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>
  onOrderSaved: (ids: string[]) => void
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
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const loadCatalog = () => catalogRequest<CatalogItem[]>('/api/catalog').then(setCatalog).catch(error => onAction(String(error)))
  React.useEffect(() => { void loadCatalog() }, [])
  const rows = addedRows
  const saveLock = React.useRef(false)
  const [savedOrders, setSavedOrders] = useState<Array<{order_number: string; status: string; part: string; qty: number; unitPrice: number; supplier: string; vehicle: string; shipping_cost: number; source: DraftLine['source'] | null; sku: string | null}>>([])
  const loadOrders = () => apiRequest<typeof savedOrders>('/api/orders').then(setSavedOrders).catch(error => onAction(`Could not load orders: ${String(error)}`))
  React.useEffect(() => { void loadOrders() }, [])




  const filteredRows = rows.filter(row =>
    [row.supplier, row.vehicle, row.part, row.source.kind].join(' ').toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalOrderValue = rows.reduce((total, row) => total + row.qty * (row.unitPrice ?? 0), 0)
  const totalQuantity = rows.reduce((total, row) => total + row.qty, 0)
  const totalWithShipping = totalOrderValue + (Number(shippingCost) || 0)
  const budgetProgress = Math.min(100, Math.round((totalWithShipping / 23000000) * 100))

  const saveOrder = async (status: 'DRAFT' | 'SUBMITTED') => {
    if (saveLock.current || isSaving) return
    const error = draftError(rows, Number(shippingCost))
    if (error) { onAction(error); return }
    saveLock.current = true
    setIsSaving(true)
    try {
      const saved = await apiRequest<{order_number: string}>('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, shipping_cost: Number(shippingCost), lines: rows.map(row => ({ supplier: row.supplier, vehicle: row.vehicle, part: row.part, quantity: row.qty, unit_price: row.unitPrice, source: row.source, sku: row.sku, vehicle_model: row.vehicle_model, make_year: row.make_year })) }) })
      onOrderSaved(rows.map(row => row.id))
      setShippingCost('0')
      void loadOrders()
      onAction(`${saved.order_number} ${status === 'DRAFT' ? 'saved as draft' : 'submitted'}.`)
    } catch (error) { onAction(`Could not confirm order save. Check saved orders before retrying: ${String(error)}`); void loadOrders() }
    finally { saveLock.current = false; setIsSaving(false) }
  }

  const clearRow = (rowToClear: DraftLine) => {
    onRowsChange(current => current.filter(row => row.id !== rowToClear.id))
  }

  const updateLine = (id: string, field: 'supplier' | 'vehicle' | 'qty' | 'unitPrice', value: string | number | null) => {
    onRowsChange(current => current.map(row => row.id === id ? { ...row, [field]: value } : row))
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
          <CatalogManager onUpdated={() => void loadCatalog()} />
          {/* Left: table */}
          <div className="flex flex-col gap-6">
            <div className="rounded-[4px] border border-[#e9bcb7] bg-white p-4">
              <h3 className="text-[14px] font-bold text-[#1b1c1c]">Saved purchase orders</h3>
              {savedOrders.length === 0 && <p className="mt-2 text-[12px] text-[#5f5e5e]">No saved orders yet.</p>}
              <div className="mt-2 max-h-40 overflow-auto text-[12px] text-[#1b1c1c]">
                {savedOrders.map((line, index) => <p key={`${line.order_number}-${index}`} className="border-t py-2">{line.order_number} · {line.status} · {line.part} · {line.qty} units · LKR {(line.qty * line.unitPrice).toLocaleString()}</p>)}
              </div>
            </div>
            {/* Header */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-[18px] font-semibold tracking-[-0.18px] text-[#1b1c1c]">Purchase Order Draft</h2>
                <p className="mt-0.5 text-[13px] text-[#5f5e5e]">PO-2024-0892 • Created from AI Prediction Queue</p>
              </div>
            </div>

            <p className="text-sm text-[#5f5e5e]">{rows.some(row => row.unitPrice === null) ? 'Some prices are missing; totals include priced lines only. ' : ''}Saving includes all {rows.length} draft lines, including lines hidden by search.</p>
            {/* Table */}
            <div className="overflow-hidden rounded-[2px] border border-[#e9bcb7] bg-white">
              <div className="max-h-[430px] overflow-x-auto overflow-y-auto">
                <table className="min-w-[1120px] w-full">
                  <thead className="sticky top-0 z-10 bg-[#efeded]">
                    <tr>
                      {['SUPPLIER NAME', 'VEHICLE MODEL / YEAR', 'PART NAME / NO', 'QUANTITY', 'UNIT PRICE', 'TOTAL PRICE', 'SOURCE', ''].map(h => (
                        <th key={h} className="border-b border-[#e9bcb7] px-4 py-3 text-left text-[11px] font-bold tracking-[0.55px] text-[#5f5e5e]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.length === 0 && <tr><td colSpan={8} className="p-6 text-sm text-[#5f5e5e]">{rows.length ? 'No draft lines match your search.' : 'No draft lines yet. Add an order or a reviewed companion bundle.'}</td></tr>}
                    {filteredRows.map(row => (
                      <tr key={row.id} className="border-b border-[#e9bcb7]">
                        <td className="px-4 py-4 text-[13px] font-medium text-[#1b1c1c]"><input aria-label={`Supplier for ${row.part}`} disabled={isSaving} value={row.supplier} onChange={event => updateLine(row.id, 'supplier', event.target.value)} placeholder="Enter supplier" className="w-40 rounded border border-[#e9bcb7] bg-[#f8f4f3] p-2" /></td>
                        <td className="px-4 py-4 text-[13px] text-[#1b1c1c]"><input aria-label={`Vehicle compatibility for ${row.part}`} disabled={isSaving || !!row.sku} value={row.vehicle} onChange={event => updateLine(row.id, 'vehicle', event.target.value)} placeholder="Model / year" className="w-40 rounded border border-[#e9bcb7] bg-[#f8f4f3] p-2" /></td>
                        <td className="px-4 py-4 font-mono text-[12px] text-[#1b1c1c]">{row.part}
                          <select aria-label={`Catalog SKU and fitment for ${row.part}`} disabled={isSaving} value={row.sku ? JSON.stringify([row.sku, row.vehicle_model, row.make_year]) : ''} onChange={event => {
                            const [sku, model, year] = event.target.value ? JSON.parse(event.target.value) : ['', '', null]
                            onRowsChange(current => current.map(line => line.id === row.id ? { ...line, sku: sku || undefined, vehicle_model: model || undefined, make_year: year || undefined, vehicle: sku ? `${model} (${year})` : '' } : line))
                          }} className="mt-2 block w-56 rounded border border-[#e9bcb7] bg-[#f8f4f3] p-2 text-xs">
                            <option value="">Choose catalog SKU / fitment</option>
                            {catalog.filter(item => item.part_name === row.part.trim().toUpperCase()).flatMap(item => item.fitments.map(f => <option key={`${item.sku}-${f.model}-${f.make_year}`} value={JSON.stringify([item.sku, f.model, f.make_year])}>{item.sku} - {f.model} ({f.make_year})</option>))}
                          </select>
                        </td>
                        <td className="px-4 py-4 text-[13px] font-medium text-[#1b1c1c]"><input aria-label={`Order quantity for ${row.part}`} disabled={isSaving} type="number" min="1" step="1" value={row.qty || ''} onChange={event => updateLine(row.id, 'qty', Number(event.target.value))} className="w-24 rounded border border-[#e9bcb7] bg-[#f8f4f3] p-2" /></td>
                        <td className="px-4 py-4 text-[13px] text-[#1b1c1c]"><input aria-label={`Unit price for ${row.part}`} disabled={isSaving} type="number" min="0" step="0.01" value={row.unitPrice ?? ''} onChange={event => updateLine(row.id, 'unitPrice', event.target.value === '' ? null : Number(event.target.value))} placeholder="LKR" className="w-28 rounded border border-[#e9bcb7] bg-[#f8f4f3] p-2" /></td>
                        <td className="px-4 py-4 text-[13px] font-bold text-[#1b1c1c]">LKR {(row.qty * (row.unitPrice ?? 0)).toLocaleString()}</td>
                        <td className="px-4 py-4">
                          <span className="text-xs" title={row.source.rule_version}>{row.source.kind === 'bundle' ? `Bundle (${row.source.mode})` : 'Manual'}{row.source.rule_version && <span className="block text-[#5f5e5e]">Rules: {row.source.rule_version.slice(0, 12)}</span>}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button type="button" disabled={isSaving} aria-label={`Clear ${row.part}`} onClick={() => clearRow(row)} className="flex size-7 items-center justify-center rounded-[2px] text-[18px] leading-none text-[#5f5e5e] hover:bg-[#fef2f2] hover:text-[#bd0014]">×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-end border-t border-[#e9bcb7] px-6 py-4">
                <span className="mr-4 text-[13px] font-bold uppercase tracking-[0.55px] text-[#5f5e5e]">Total of all draft parts</span>
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
              <div><p className="text-[13px] text-[#5f5e5e]">Total spare parts</p><p className="mt-1 text-[22px] font-black text-[#1b1c1c]">{rows.length}</p></div>
              <div><p className="text-[13px] text-[#5f5e5e]">Total quantity</p><p className="mt-1 text-[22px] font-black text-[#1b1c1c]">{totalQuantity.toLocaleString()} units</p></div>
              <label><span className="text-[13px] text-[#5f5e5e]">Shipping cost</span><div className="mt-1 flex h-10 items-center rounded-[4px] border border-[#e9bcb7] bg-[#f8f4f3] px-3"><span className="text-[13px] text-[#5f5e5e]">LKR</span><input disabled={isSaving} type="number" min="0" step="0.01" value={shippingCost} onChange={event => setShippingCost(event.target.value)} className="min-w-0 flex-1 bg-transparent px-2 text-[15px] font-bold text-[#1b1c1c] outline-none" /></div></label>
              <div><p className="text-[13px] text-[#5f5e5e]">Total order value</p><p className="mt-1 text-[22px] font-black text-[#bd0014]">LKR {totalWithShipping.toLocaleString()}</p></div>
            </div>
            <div className="border-t border-[#e9bcb7] px-6 py-5">
              <div className="mb-2 flex items-center justify-between"><span className="text-[11px] font-bold uppercase tracking-[0.55px] text-[#5f5e5e]">MONTHLY BUDGET PROGRESS</span><span className="text-[11px] font-bold text-[#1b1c1c]">{budgetProgress}%</span></div>
              <div className="h-[6px] overflow-hidden rounded-full bg-[#e9e8e7]"><div className="h-full rounded-full bg-[#f59e0b]" style={{ width: `${budgetProgress}%` }} /></div>
            </div>
            <div className="flex flex-col gap-2 border-t border-[#e9bcb7] px-6 py-5 sm:flex-row sm:justify-end">
              <button type="button" disabled={isSaving || !rows.length} onClick={() => void saveOrder('SUBMITTED')} className="flex h-11 items-center justify-center rounded-[4px] bg-[#bd0014] px-6 text-[11px] font-bold uppercase tracking-[0.55px] text-white">{isSaving ? 'Saving...' : 'Finalize the order'}</button>
              <button type="button" disabled={isSaving || !rows.length} onClick={() => void saveOrder('DRAFT')} className="flex h-11 items-center justify-center rounded-[4px] border border-[#e9bcb7] px-6 text-[11px] font-bold uppercase tracking-[0.55px] text-[#1b1c1c]">Save as draft</button>
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
  const [addedPurchaseRows, setAddedPurchaseRows] = useState<DraftLine[]>([])
  const [draftShippingCost, setDraftShippingCost] = useState('0')
  const [isSavingPurchase, setIsSavingPurchase] = useState(false)
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
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
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
    const completedDetails = details.filter(detail => detail.supplier.trim() && detail.vehicle.trim() && detail.part.trim() && Number.isInteger(Number(detail.quantity)) && Number(detail.quantity) > 0 && detail.unitPrice.trim() !== '' && Number.isFinite(Number(detail.unitPrice)) && Number(detail.unitPrice) >= 0)
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
        id: crypto.randomUUID(),
        source: { kind: 'manual' as const },
      })),
    ])
    setStatusMessage(`${completedDetails.length} purchase order detail${completedDetails.length > 1 ? 's' : ''} created. Total: LKR ${total.toLocaleString()}.`)
    setIsNewOrderOpen(false)
    setSearchTerm('')
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
        <DatabaseBanner />
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
            onAddBundle={lines => {
              setAddedPurchaseRows(current => [...current, ...lines])
              setSearchTerm('')
              setView('purchase')
              setStatusMessage(`${lines.length} selected bundle lines added to the draft. Complete supplier, vehicle compatibility and prices before saving.`)
            }}
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
            onRowsChange={setAddedPurchaseRows}
            shippingCost={draftShippingCost}
            setShippingCost={setDraftShippingCost}
            isSaving={isSavingPurchase}
            setIsSaving={setIsSavingPurchase}
            onOrderSaved={ids => setAddedPurchaseRows(current => current.filter(row => !ids.includes(row.id)))}
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
