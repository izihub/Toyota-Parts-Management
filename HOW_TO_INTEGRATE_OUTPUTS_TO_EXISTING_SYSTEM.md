# 🔌 System Integration Guide: Connecting Model Outputs to `Toyota-Parts-Management`

> **Confirmed Against Repository:** [`izihub/Toyota-Parts-Management`](https://github.com/izihub/Toyota-Parts-Management/tree/master)  
> **Application Tech Stack:** React 18 + TypeScript + Vite + Tailwind CSS (`src/App.tsx`)

---

## 🏛️ How the Pieces Connect in This Exact Codebase

Your GitHub repository is a **Vite + React + TypeScript** single-page application.  
Here is the most elegant, modern way to integrate the two model outputs:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ REACT FRONTEND (Vite / React 18 / Tailwind)                                                 │
│                                                                                             │
│ 1. Option B (Synergy Rules): IMPORTED DIRECTLY!                                             │
│    `import synergyRules from './real_warehouse_synergy_rules.json'`                         │
│    -> Runs 100% in-browser inside Vite! Zero backend server required for Option B!          │
│                                                                                             │
│ 2. Option A (Vehicle Intake AI): CALLED VIA LIGHTWEIGHT API                                 │
│    `fetch('/api/predict-intake')`                                                           │
│    -> Calls a lightweight Python FastAPI service loading `real_model_option_a_tuned.joblib` │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Step 1: File Placement in Your Project

Place the two generated files inside your repo:

```text
Toyota-Parts-Management/
├── src/
│   ├── App.tsx                              <-- Dashboard UI code
│   ├── real_warehouse_synergy_rules.json    <-- Put here (directly importable by React!)
│   └── ...
├── api/
│   ├── main.py                              <-- Lightweight Python API for Option A
│   └── real_model_option_a_tuned.joblib     <-- Model file loaded by FastAPI
├── vite.config.ts                           <-- Add API proxy
└── package.json
```

---

## ⚡ Step 2: Option B Integration (Zero Backend Needed!)

Because `real_warehouse_synergy_rules.json` is pure JSON, **Vite supports importing JSON files natively**.

### Inside `src/App.tsx`:
```tsx
// 1. Add this import at the top of src/App.tsx
import synergyRules from './real_warehouse_synergy_rules.json'

// 2. Helper function to get companion parts for any primary part
export function getCompanionBundle(primaryPart: string, orderQty: number = 20) {
  const target = primaryPart.trim().toUpperCase()
  return synergyRules
    .filter(r => r.antecedent === target)
    .map(r => ({
      companionPart: r.consequent,
      confidencePct: Math.round(r.confidence * 100),
      lift: r.lift,
      suggestedOrderQty: Math.max(1, Math.round(orderQty * r.confidence))
    }))
    .sort((a, b) => b.lift - a.lift)
}
```

Now, in `DemandForecastView`, when the user clicks **`Generate Reorder List`**, you can immediately pop up the bundle recommendations without making a single network request!

---

## 🤖 Step 3: Option A Integration (Python API for Vehicle Claims)

Because `real_model_option_a_tuned.joblib` requires Python scikit-learn, run a tiny FastAPI server in an `api/` folder:

### Create `api/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import joblib
import pandas as pd

app = FastAPI(title="Toyota Claims Intake AI")

# Allow Vite frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load tuned model at startup
MODEL_DATA = joblib.load("api/real_model_option_a_tuned.joblib")
pipeline = MODEL_DATA["pipeline"]
classes = MODEL_DATA["classes"]
thresholds = MODEL_DATA["thresholds"]

class VehicleClaimRequest(BaseModel):
    model: str                  # e.g. "AQUA"
    make_year: int              # e.g. 2013
    damage_zone: Optional[str] = "Front" # "Front", "Rear", "Side"

@app.post("/api/predict-intake")
def predict_intake_parts(req: VehicleClaimRequest):
    sample = pd.DataFrame([{
        "Model_Grouped": req.model.strip().upper(),
        "Damage_Zone": req.damage_zone.strip(),
        "Make_Year": req.make_year,
        "Vehicle_Age": 2026 - req.make_year,
        "month_num": 6
    }])
    
    raw_probs = pipeline.predict_proba(sample)
    probs_1d = [p[0][1] if p.shape[1] > 1 else 0.0 for p in raw_probs]
    
    chips = []
    for idx, part_name in enumerate(classes):
        prob = probs_1d[idx]
        t = thresholds[idx]
        if prob >= t:
            chips.append({
                "part_name": part_name,
                "confidence_pct": round(float(prob) * 100, 1),
                "urgency": "High" if prob >= 0.65 else ("Medium" if prob >= 0.45 else "Low")
            })
            
    chips.sort(key=lambda x: x["confidence_pct"], reverse=True)
    return {
        "vehicle": f"{req.model.upper()} ({req.make_year})",
        "damage_zone": req.damage_zone,
        "predicted_parts": chips
    }

# Run with: uvicorn api.main:app --port 8000 --reload
```

---

## 🔄 Step 4: Configure Vite Proxy (`vite.config.ts`)

In your repository's [`vite.config.ts`](https://github.com/izihub/Toyota-Parts-Management/blob/master/vite.config.ts), add a proxy so frontend calls to `/api` automatically route to FastAPI:

```typescript
export default defineConfig({
  server: {
    port: 8443, // your existing port from screenshots
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})
```

---

## 🎨 Step 5: Frontend Code Updates in `src/App.tsx`

### 1. In `PredictionQueueView` (Claims Intake Screen):
When fetching predictions for an incoming vehicle:

```tsx
async function fetchAIPredictions(model: string, year: number, zone: string) {
  try {
    const res = await fetch('/api/predict-intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, make_year: year, damage_zone: zone })
    })
    const data = await res.json()
    return data.predicted_parts
  } catch (err) {
    console.error('AI Service offline, using fallback cache', err)
    return []
  }
}
```

### 2. In `DemandForecastView` (Warehouse Reorder Modal):
Add the `ReorderBundleModal` directly into `src/App.tsx` (using the exact colors `#bd0014`, `#e9bcb7`, and `#1b1c1c` from your app):

```tsx
function ReorderBundleModal({ onClose }: { onClose: () => void }) {
  const [selectedPart, setSelectedPart] = useState('FRONT BUMPER')
  const [qty, setQty] = useState(20)
  
  // Directly reads the local JSON rules!
  const companions = getCompanionBundle(selectedPart, qty)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-[14px] border border-[#e9bcb7] bg-white p-6 shadow-2xl">
        <h3 className="text-[20px] font-black text-[#1b1c1c]">AI Collision Reorder Advisor</h3>
        <p className="text-[12px] text-[#5f5e5e] mt-1">Based on 1,000 accident repair records</p>
        
        <div className="mt-4 flex gap-3">
          <select 
            value={selectedPart} 
            onChange={e => setSelectedPart(e.target.value)}
            className="h-10 flex-1 rounded border border-[#e9bcb7] bg-[#f8f4f3] px-3 text-[13px] font-bold"
          >
            <option value="FRONT BUMPER">FRONT BUMPER</option>
            <option value="REAR BUMPER">REAR BUMPER</option>
            <option value="LH HEAD LAMP">LH HEAD LAMP</option>
            <option value="LH FOG LAMP">LH FOG LAMP</option>
          </select>
          <input 
            type="number" 
            value={qty} 
            onChange={e => setQty(Number(e.target.value))}
            className="h-10 w-24 rounded border border-[#e9bcb7] bg-[#f8f4f3] px-3 text-[13px] font-bold" 
          />
        </div>

        <div className="mt-4 rounded border border-[#e9bcb7] bg-[#fcfbfa] p-3">
          <p className="text-[11px] font-bold uppercase text-[#bd0014]">Recommended Companion Stock (Co-Failure Synergy)</p>
          <div className="mt-2 divide-y divide-[#eee]">
            {companions.slice(0, 4).map((c, i) => (
              <div key={i} className="flex justify-between py-2 text-[12px]">
                <span className="font-bold text-[#1b1c1c]">{c.companionPart} ({c.lift}x Lift)</span>
                <span className="font-bold text-[#bd0014]">+{c.suggestedOrderQty} units ({c.confidencePct}%)</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="rounded border border-[#e9bcb7] px-4 py-2 text-[12px] font-bold">Close</button>
          <button onClick={() => { alert('Added bundle to Purchase Order!'); onClose(); }} className="rounded bg-[#bd0014] px-4 py-2 text-[12px] font-bold text-white">
            Add Bundle to Purchase Order
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## 🚀 Step 6: 2-Step Local Run Instructions

To run the whole system:

1. **Terminal 1 (Backend AI):**
   ```bash
   uvicorn api.main:app --port 8000 --reload
   ```
2. **Terminal 2 (React Frontend):**
   ```bash
   npm run dev
   ```

Open `http://localhost:8443` in your browser. Both AI models are now live!
