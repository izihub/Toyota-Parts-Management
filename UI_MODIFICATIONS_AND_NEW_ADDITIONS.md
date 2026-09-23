# 🖥️ Codebase Audit & UI Modifications Guide
### *Confirmed Against GitHub Repo: [`izihub/Toyota-Parts-Management`](https://github.com/izihub/Toyota-Parts-Management/tree/master)*

> **Codebase Architecture Confirmed:**  
> - **Stack:** React 18 + TypeScript + Vite + Tailwind CSS (`package.json`)  
> - **Primary Dashboard File:** [`src/App.tsx`](https://github.com/izihub/Toyota-Parts-Management/blob/master/src/App.tsx)  
> - **Views Rendered:**  
>   1. `DemandForecastView` (Lines ~463–800)  
>   2. `PredictionQueueView` (Lines ~800–1100)  
>   3. `InventoryFulfillmentView` (Lines ~1100–1400)  
>   4. `PurchaseOrdersView` / `NewOrderModal` (Lines ~256–320)  
> - **Current State:** The UI is beautifully styled with Tailwind, but currently uses **hardcoded mock arrays** (e.g., `demandRows`, `NAV_ITEMS`, and placeholder `onAction('Reorder list generated...')`).  
> - **Goal:** Wire the trained ML outputs (`real_model_option_a_tuned.joblib` and `real_warehouse_synergy_rules.json`) directly into the exact React components in [`src/App.tsx`](https://github.com/izihub/Toyota-Parts-Management/blob/master/src/App.tsx).

---

## 🧭 File-by-File Codebase Audit

```
izihub/Toyota-Parts-Management/
├── package.json               <-- Vite + React + TypeScript + Lucide/SVG Icons
├── src/
│   ├── App.tsx                <-- ⭐️ ALL 4 SCREENS & MODALS RESIDE HERE
│   ├── LandingPage.tsx        <-- Welcome / Marketing Landing Screen
│   ├── main.tsx               <-- React DOM Root
│   └── imports/               <-- Exported Figma SVG vectors and assets
```

---

## 📱 SCREEN 1: `DemandForecastView` in `src/App.tsx`

### 1. Codebase Audit of Existing Code:
In [`src/App.tsx`](https://github.com/izihub/Toyota-Parts-Management/blob/master/src/App.tsx), lines 463–540:
- `demandRows` is a static array with mock parts (`LED Headlight Assembly (R)`, `LED Fog lamp (R)`, `Front Bumper Reinforcement`).
- State filters:
  ```typescript
  const [vehicleFilter, setVehicleFilter] = useState('All Models')
  const [makeYearFilter, setMakeYearFilter] = useState('All Years')
  const [exteriorPartFilter, setExteriorPartFilter] = useState('All Exterior Parts')
  const [monthYearFilter, setMonthYearFilter] = useState('All Months')
  ```
- Top-right `Generate Reorder List` button currently only fires a dummy notification:
  ```typescript
  onClick={() => onAction('Reorder list generated for high-risk parts.')}
  ```

### 2. Required Modifications & New Additions in `src/App.tsx`:

#### A. Add `Damage Zone` Filter to State & UI
In `DemandForecastView`:
```typescript
// ADD to state filters:
const [damageZoneFilter, setDamageZoneFilter] = useState('All Zones')
const damageZoneOptions = ['All Zones', 'Front', 'Rear', 'Side', 'Multiple Zones']
```
Add the dropdown to the filter bar right next to `Vehicle Model`.

#### B. Replace Dummy `Generate Reorder List` with the "AI Smart Bundle Advisor" Modal
Instead of `onAction(...)`, add modal state and open the `ReorderBundleModal`:
```typescript
const [showReorderModal, setShowReorderModal] = useState(false)
const [selectedBundlePart, setSelectedBundlePart] = useState('FRONT BUMPER')
```
Change the button `onClick`:
```tsx
<button
  type="button"
  onClick={() => setShowReorderModal(true)}
  className="flex h-9 items-center gap-2 rounded-[4px] bg-[#bd0014] px-4 text-[11px] font-bold tracking-[0.55px] text-white"
>
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M5 1v4H1l5 6 5-6H7V1H5z" fill="white"/>
  </svg>
  Generate Reorder List (AI Bundled)
</button>
```

#### C. Add the `ReorderBundleModal` Component into `src/App.tsx`:
Add this component right above `DemandForecastView`. It reads `real_warehouse_synergy_rules.json`:

```tsx
import synergyRules from '../real_warehouse_synergy_rules.json'

function ReorderBundleModal({ onClose }: { onClose: () => void }) {
  const [primaryPart, setPrimaryPart] = useState('FRONT BUMPER')
  const [orderQty, setOrderQty] = useState(20)

  // Filter matching companion parts from Option B rules
  const companions = synergyRules
    .filter(r => r.antecedent === primaryPart)
    .map(r => ({
      part: r.consequent,
      confidence: Math.round(r.confidence * 100),
      lift: r.lift,
      suggestedQty: Math.max(1, Math.round(orderQty * r.confidence))
    }))
    .sort((a, b) => b.lift - a.lift)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-[14px] border border-[#e9bcb7] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#e9bcb7] pb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[1px] text-[#bd0014]">Warehouse AI Advisor</p>
            <h3 className="text-[20px] font-black text-[#1b1c1c]">Automated Collision Reorder Bundle</h3>
          </div>
          <button onClick={onClose} className="text-[22px] text-[#5f5e5e]">×</button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[11px] font-bold uppercase text-[#5f5e5e]">Primary Part to Restock</label>
              <select 
                value={primaryPart} 
                onChange={e => setPrimaryPart(e.target.value)}
                className="mt-1 h-10 w-full rounded border border-[#e9bcb7] bg-[#f8f4f3] px-3 text-[13px] font-bold"
              >
                <option value="FRONT BUMPER">FRONT BUMPER</option>
                <option value="REAR BUMPER">REAR BUMPER</option>
                <option value="LH HEAD LAMP">LH HEAD LAMP</option>
                <option value="RH FOG LAMP">RH FOG LAMP</option>
              </select>
            </div>
            <div className="w-32">
              <label className="text-[11px] font-bold uppercase text-[#5f5e5e]">Order Quantity</label>
              <input 
                type="number" 
                value={orderQty} 
                onChange={e => setOrderQty(Number(e.target.value))}
                className="mt-1 h-10 w-full rounded border border-[#e9bcb7] bg-[#f8f4f3] px-3 text-[13px] font-bold"
              />
            </div>
          </div>

          <div className="rounded border border-[#e9bcb7] bg-[#fcfbfa] p-3">
            <p className="text-[11px] font-bold uppercase text-[#bd0014]">🔗 AI-Identified Companion Stock (7.2x Co-Failure Lift)</p>
            <div className="mt-2 divide-y divide-[#eee]">
              {companions.slice(0, 4).map((c, i) => (
                <div key={i} className="flex items-center justify-between py-2 text-[12px]">
                  <div>
                    <span className="font-bold text-[#1b1c1c]">{c.part}</span>
                    <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-800">{c.lift}x Lift</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#5f5e5e]">{c.confidence}% Co-occurrence</span>
                    <span className="font-bold text-[#bd0014]">+{c.suggestedQty} units</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="rounded border border-[#e9bcb7] px-4 py-2 text-[12px] font-bold">Cancel</button>
          <button onClick={() => { alert('Bundle added to Purchase Order!'); onClose(); }} className="rounded bg-[#bd0014] px-4 py-2 text-[12px] font-bold text-white">
            ⚡ One-Click Add Full Bundle to Purchase Order
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## 📱 SCREEN 2: `PredictionQueueView` in `src/App.tsx`

### 1. Codebase Audit of Existing Code:
In `src/App.tsx`, the prediction queue component renders rows with:
- `ACCIDENT ID / DATE` (`ACC-9482-TX`, `24 Oct 2024`)
- `VEHICLE TYPE` (`Camry Hybrid, Model Year: 2024`)
- `PREDICTED PARTS NEEDED` (Static badges)
- `DEMAND` (`High`, `Med`, `Low`)
- `HUMAN ACTION` (Approval checkboxes)

### 2. Required Modifications & New Additions in `src/App.tsx`:

#### A. Add `Impact Zone` Badge under Vehicle Type
In the table row rendering `VEHICLE TYPE`:
```tsx
<div>
  <p className="text-[13px] font-bold text-[#1b1c1c]">{item.vehicleModel}</p>
  <p className="text-[11px] text-[#5f5e5e]">Model Year: {item.makeYear}</p>
  {/* NEW ADDITION: */}
  <span className="mt-1 inline-block rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
    {item.damageZone || 'Front Impact'}
  </span>
</div>
```

#### B. Display Confidence Percentages on Prediction Badges
In the `PREDICTED PARTS NEEDED` column, update the badge rendering:
```tsx
<div className="flex flex-wrap gap-1.5">
  {item.partsNeeded.map((part, pIdx) => {
    // Determine color from confidence score (from real_model_option_a_tuned.joblib)
    const isHigh = part.confidence >= 65 || part.urgency === 'High'
    return (
      <span
        key={pIdx}
        className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-bold ${
          isHigh ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
        }`}
      >
        {part.name}
        <span className="ml-1 opacity-75 text-[9px]">({part.confidence}%)</span>
      </span>
    )
  })}
</div>
```

#### C. Add "Log New Vehicle Claim" Intake Modal
In `src/App.tsx`, connect the left sidebar `+ New Order` or a new `+ Intake Vehicle` button to an interactive intake modal:
- Adjuster inputs: **Vehicle Model** (Toyota Aqua, Axio, Premio), **Make Year** (e.g. 2013), and **Impact Zone** (`Front`, `Rear`, `Side`).
- Clicking **"Estimate Parts"** calls `POST /api/predict-intake` and dynamically displays the badges (`Front Bumper 74%`, `Grille 71%`, `Bonnet 70%`, `Fog Lamp 67%`).

---

## 📱 SCREENS 3 & 4: `InventoryFulfillmentView` in `src/App.tsx`

### 1. Codebase Audit of Existing Code:
In `src/App.tsx`:
- Top cards: `Workshop #012 - Anods (24 Pending Requests)`, `Workshop #045 - Kali`, `Toyota City Hub`.
- Active queue table displays orders in **`LKR`** currency:
  - Row 1: `Workshop #012 - Anods` requested `Bumper (Front)` (Qty: 02, LKR 18,500) and `Front Grille` (Qty: 02, LKR 9,500).

### 2. Required Modifications & New Additions in `src/App.tsx`:

#### A. The "AI Missing Companion Parts Notice" (Cross-Docking Synergy)
Directly under row 1 (`Workshop #012 - Anods`), render an alert banner when an order contains a primary collision part but lacks its companion:

```tsx
{/* NEW COMPONENT INSIDE FULFILLMENT TABLE ROW */}
{order.parts.some(p => p.name.includes('Bumper (Front)')) && !order.parts.some(p => p.name.includes('Fog Lamp')) && (
  <div className="col-span-full my-1 flex items-center justify-between rounded-lg border border-amber-400 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
    <div className="flex items-center gap-2">
      <span className="font-bold text-amber-700">⚠️ AI Stock Synergy Notice:</span>
      <span>Workshop #012 ordered Bumper + Grille, but omitted companion Fog Lamps (7.2x co-failure lift).</span>
    </div>
    <button 
      onClick={() => alert('Added 02x LH & RH Fog Lamps to Workshop #012 Dispatch!')}
      className="rounded bg-amber-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-amber-700"
    >
      + Auto-Add Companion Fog Lamps
    </button>
  </div>
)}
```

---

## 📋 Exact Codebase Implementation Checklist

| File in GitHub Repo | Component / Line | Action | What to Implement |
|---|---|---|---|
| [`src/App.tsx`](https://github.com/izihub/Toyota-Parts-Management/blob/master/src/App.tsx) | Line ~463 | **NEW** | Import `real_warehouse_synergy_rules.json` directly into `App.tsx`. |
| [`src/App.tsx`](https://github.com/izihub/Toyota-Parts-Management/blob/master/src/App.tsx) | `DemandForecastView` | **UPDATE** | Add `damageZoneFilter` dropdown to filter bar. |
| [`src/App.tsx`](https://github.com/izihub/Toyota-Parts-Management/blob/master/src/App.tsx) | `DemandForecastView` | **UPDATE** | Connect `Generate Reorder List` to open `ReorderBundleModal`. |
| [`src/App.tsx`](https://github.com/izihub/Toyota-Parts-Management/blob/master/src/App.tsx) | `PredictionQueueView` | **UPDATE** | Render `[Front/Rear Impact]` badge under vehicle model. |
| [`src/App.tsx`](https://github.com/izihub/Toyota-Parts-Management/blob/master/src/App.tsx) | `PredictionQueueView` | **UPDATE** | Render confidence % (`74%`) on part chips with green/amber colors. |
| [`src/App.tsx`](https://github.com/izihub/Toyota-Parts-Management/blob/master/src/App.tsx) | `InventoryFulfillmentView`| **NEW** | Add `⚠️ AI Synergy Notice` banner for missing companion fog lamps. |
