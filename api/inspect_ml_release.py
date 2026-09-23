"""Print a reproducible inventory of trusted local ML artifacts; no database writes."""

import hashlib
import importlib.metadata
import json
from pathlib import Path
import platform

import joblib

from .ml_contract import validate_model


def inspect_release():
    root = Path(__file__).resolve().parent.parent
    model_path = root / "api/real_model_option_a_tuned.joblib"
    rules_path = root / "src/real_warehouse_synergy_rules.json"
    data = joblib.load(model_path)
    validate_model(data)
    prep = data["pipeline"].named_steps["prep"]
    columns = next(columns for name, _, columns in prep.transformers_ if name == "cat")
    rules = json.loads(rules_path.read_text(encoding="utf-8"))
    return {
        "model_sha256": hashlib.sha256(model_path.read_bytes()).hexdigest(),
        "rules_sha256": hashlib.sha256(rules_path.read_bytes()).hexdigest(),
        "training_environment": "Not recorded in legacy artifact",
        "inspection_environment": {
            "python": platform.python_version(),
            **{name: importlib.metadata.version(name) for name in ["scikit-learn", "pandas", "numpy", "joblib"]},
        },
        "classes": list(data["classes"]),
        "thresholds": [float(t) for t in data["thresholds"]],
        "categorical_vocabulary": {column: list(values) for column, values in zip(columns, prep.named_transformers_["cat"].categories_)},
        "rule_count": len(rules),
        "serving_contract": {
            "reference_year": 2026, "age_clip": [0, 45], "month": 6,
            "unknown_model": "OTHER_MODEL when present; otherwise reject",
            "supported_intake_zones": ["Front", "Rear", "Side"],
            "provenance": "Legacy Colab guide; original dataset and training run unavailable",
        },
    }


if __name__ == "__main__":
    print(json.dumps(inspect_release(), indent=2))
