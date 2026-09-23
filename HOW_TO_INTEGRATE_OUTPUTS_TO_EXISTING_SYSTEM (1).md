# 🔌 System Integration Guide: Connecting Model Outputs to Your Existing Application

> **Goal:**  
> You ran the code, and now you have two files:  
> 1. `real_model_option_a_tuned.joblib` (AI Model for Vehicle Intake)  
> 2. `real_warehouse_synergy_rules.json` (53 Inventory Synergy Rules)  
>  
> This guide shows **exactly how to plug these two outputs into your existing application** (whether your backend is **Node.js/Express**, **Python FastAPI/Flask/Django**, **PHP/Laravel**, or **Next.js**), and how to connect them to your frontend UI.

---

## 🏛️ High-Level Architecture Overview

You do **not** need to rewrite your application. The AI models sit alongside your existing database as microservices or backend modules:

```
[ FRONTEND UI ] (React, Vue, Angular, or Blade/Blade/HTML)
      │
      │ 1. HTTP Fetch / REST API Call
      ▼
[ EXISTING BACKEND SERVER ] (Node.js, Python, PHP, or Next.js)
      │
      ├──> Reads `real_warehouse_synergy_rules.json` (For Warehouse Reorder Screen)
      └──> Queries Python Microservice / Model Worker (For Vehicle Claims Screen)
```

---

## 🛠️ Step 1: Where to Put the Two Output Files

Place the two generated files directly into your backend project root or an `ai_models/` folder:

```text
your-existing-web-app/
├── backend/
│   ├── ai_models/
│   │   ├── real_model_option_a_tuned.joblib   <-- Put here
│   │   └── real_warehouse_synergy_rules.json  <-- Put here
│   ├── server.js (or main.py, or routes/web.php)
│   └── ...
└── frontend/
    └── src/components/
```

---

## ⚙️ Step 2: Backend Integration (Choose Your Tech Stack)

### Option A: If Your Existing Backend is **Python (FastAPI, Flask, or Django)**
This is the most direct approach. The backend loads the joblib model and JSON rules at startup.

#### FastAPI Implementation (`backend/ai_routes.py`):
```python
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Optional
import joblib, json
import pandas as pd

router = APIRouter(prefix="/api/ai", tags=["AI Engine"])

# 1. Load models once into memory at startup
MODEL_A = joblib.load("backend/ai_models/real_model_option_a_tuned.joblib")
with open("backend/ai_models/real_warehouse_synergy_rules.json", "r") as f:
    RULES_B = json.load(f)

# -----------------------------------------------------------------
# 1. Vehicle Claims Intake API (Powers Screen 1)
# -----------------------------------------------------------------
class VehicleIntakeRequest(BaseModel):
    model: str                  # e.g., "AQUA"
    year: int                   # e.g., 2013
    damage_zone: Optional[str] = "Front" # "Front", "Rear", "Side"

@router.post("/predict-parts")
def predict_parts(req: VehicleIntakeRequest):
    pipeline = MODEL_A["pipeline"]
    classes = MODEL_A["classes"]
    thresholds = MODEL_A["thresholds"]
    
    sample = pd.DataFrame([{
        "Model_Grouped": req.model.strip().upper(),
        "Damage_Zone": req.damage_zone.strip(),
        "Make_Year": req.year,
        "Vehicle_Age": 2026 - req.year,
        "month_num": 6
    }])
    
    raw_probs = pipeline.predict_proba(sample)
    probs_1d = [p[0][1] if p.shape[1] > 1 else 0.0 for p in raw_probs]
    
    chips = []
    for idx, part_name in enumerate(classes):
        p = probs_1d[idx]
        t = thresholds[idx]
        if p >= t:
            chips.append({
                "part_name": part_name,
                "confidence_pct": round(float(p) * 100, 1),
                "urgency": "High" if p >= 0.65 else ("Medium" if p >= 0.45 else "Low")
            })
            
    chips.sort(key=lambda x: x["confidence_pct"], reverse=True)
    return {
        "vehicle": f"{req.model.upper()} ({req.year})",
        "damage_zone": req.damage_zone,
        "predicted_parts": chips
    }

# -----------------------------------------------------------------
# 2. Warehouse Synergy Reorder API (Powers Screen 2)
# -----------------------------------------------------------------
@router.get("/reorder-bundle")
def get_reorder_bundle(
    primary_part: str = Query(..., description="e.g. FRONT BUMPER"),
    order_qty: int = Query(20, description="Quantity being reordered")
):
    target = primary_part.strip().upper()
    companions = []
    seen = set()
    
    for r in RULES_B:
        if r["antecedent"] == target and r["consequent"] not in seen:
            seen.add(r["consequent"])
            suggested = max(1, int(round(order_qty * r["confidence"])))
            companions.append({
                "companion_part": r["consequent"],
                "confidence_pct": round(r["confidence"] * 100, 1),
                "lift": r["lift"],
                "suggested_order_qty": suggested
            })
            
    companions.sort(key=lambda x: x["lift"], reverse=True)
    return {
        "primary_part": target,
        "base_order_qty": order_qty,
        "bundle_suggestions": companions
    }
```

---

### Option B: If Your Existing Backend is **Node.js / Express or PHP / Laravel**
If your main app is written in Node.js, PHP, or Java:

1. **For Option B (Warehouse Synergy):**  
   It's a pure JSON file! Your Node.js or PHP server can read `real_warehouse_synergy_rules.json` directly with zero Python needed:

```javascript
// Node.js (Express) Endpoint:
const rulesDB = require('./ai_models/real_warehouse_synergy_rules.json');

app.get('/api/ai/reorder-bundle', (req, res) => {
    const primaryPart = req.query.part.trim().toUpperCase();
    const orderQty = parseInt(req.query.qty) || 20;

    const matches = rulesDB
        .filter(r => r.antecedent === primaryPart)
        .map(r => ({
            companion_part: r.consequent,
            confidence_pct: Math.round(r.confidence * 100),
            lift: r.lift,
            suggested_order_qty: Math.max(1, Math.round(orderQty * r.confidence))
        }))
        .sort((a, b) => b.lift - a.lift);

    res.json({ primary_part: primaryPart, base_qty: orderQty, bundle_suggestions: matches });
});
```

2. **For Option A (Python Model):**  
   Run a small, lightweight Python microservice (using the FastAPI code above) on a local port (e.g., `localhost:8001`). Your Node.js or PHP backend simply forwards the request to `http://localhost:8001/api/ai/predict-parts`.

---

## 🎨 Step 3: Frontend Integration (Connecting to Your Existing Web Dashboard)

### Screen 1: Vehicle Claims Intake Queue (React / Vue / HTML)

When the intake officer selects a vehicle:
```javascript
// Frontend API Call when vehicle is selected
async function handleVehicleIntake(vehicleModel, makeYear, damageZone) {
    const response = await fetch('/api/ai/predict-parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: vehicleModel,
            year: makeYear,
            damage_zone: damageZone
        })
    });
    
    const data = await response.json();
    renderPartChips(data.predicted_parts);
}

// Render the clickable prediction chips in your UI
function renderPartChips(parts) {
    const container = document.getElementById('predicted-parts-container');
    container.innerHTML = '';
    
    parts.forEach(part => {
        const badgeColor = part.urgency === 'High' ? 'bg-green-500' : 'bg-yellow-500';
        const chip = `
            <div class="part-chip ${badgeColor} text-white p-2 rounded inline-block m-1">
                <span class="font-bold">${part.part_name}</span>
                <span class="text-xs ml-2">(${part.confidence_pct}%)</span>
                <input type="checkbox" checked class="ml-2" value="${part.part_name}" />
            </div>
        `;
        container.innerHTML += chip;
    });
}
```

---

### Screen 2: Warehouse Smart Reorder Screen

When a procurement officer types a part to restock (e.g. `FRONT BUMPER` - 20 units):
```javascript
// Frontend API Call when ordering a primary part
async function handleReorderPartChange(partName, orderQty) {
    const response = await fetch(`/api/ai/reorder-bundle?primary_part=${encodeURIComponent(partName)}&order_qty=${orderQty}`);
    const data = await response.json();
    
    const bundleList = document.getElementById('bundle-suggestions-table');
    bundleList.innerHTML = '';
    
    data.bundle_suggestions.forEach(item => {
        const row = `
            <tr>
                <td><strong>${item.companion_part}</strong></td>
                <td>${item.confidence_pct}%</td>
                <td><span class="badge badge-info">${item.lift}x Lift</span></td>
                <td>
                    <input type="number" value="${item.suggested_order_qty}" class="form-control" />
                </td>
                <td>
                    <button class="btn btn-sm btn-primary">Add to Order</button>
                </td>
            </tr>
        `;
        bundleList.innerHTML += row;
    });
}
```

---

## 🗄️ Step 4: Storing Results in Your Existing Database

If you want to track predictions in your existing SQL database (PostgreSQL, MySQL, SQL Server):

### 1. New Table for Tracking Intake Predictions:
```sql
CREATE TABLE ai_intake_predictions (
    id SERIAL PRIMARY KEY,
    accident_id VARCHAR(50),
    vehicle_model VARCHAR(100),
    make_year INT,
    damage_zone VARCHAR(50),
    predicted_parts JSONB, -- Stores the predicted badges & confidence scores
    human_approved_parts JSONB, -- Stores what parts the human mechanic actually approved
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
*Value:* This allows you to track your **AI Approval Rate** (e.g. *"Mechanics approve 91% of AI-suggested parts"*).

### 2. Table for Association Rules (Optional — if not reading from JSON directly):
```sql
CREATE TABLE warehouse_synergy_rules (
    id SERIAL PRIMARY KEY,
    primary_part VARCHAR(150),
    companion_part VARCHAR(150),
    confidence_pct DECIMAL(5, 2),
    lift_multiplier DECIMAL(5, 2),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📋 Complete Developer Checklist

Give this 5-point checklist to your engineering lead:

- [ ] **Step 1:** Download `real_model_option_a_tuned.joblib` and `real_warehouse_synergy_rules.json` and save them in the backend directory.
- [ ] **Step 2:** Mount the two endpoints: `POST /api/ai/predict-parts` and `GET /api/ai/reorder-bundle`.
- [ ] **Step 3:** On the **Vehicle Intake Screen**, bind the model and damage zone inputs to fetch the prediction chips.
- [ ] **Step 4:** On the **Warehouse Purchase Order Screen**, bind the primary part selection to show the companion stocking table.
- [ ] **Step 5:** Deploy! (No retraining needed until your accident dataset grows by another 200+ records).
