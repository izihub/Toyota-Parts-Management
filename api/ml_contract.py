"""Preprocessing contract for the legacy model described by the Colab guide."""

import math

import pandas as pd


REFERENCE_YEAR = 2026
DEFAULT_MONTH = 6
SUPPORTED_ZONES = ("Front", "Rear", "Side")


def validate_model(data):
    required = {"pipeline", "classes", "thresholds"}
    if not isinstance(data, dict) or not required.issubset(data):
        raise ValueError("Missing model artifact fields")
    classes = list(data["classes"])
    thresholds = list(data["thresholds"])
    classifier = data["pipeline"].named_steps["clf"]
    if not classes or len(classes) != len(thresholds) or len(classes) != len(classifier.estimators_):
        raise ValueError("Model classes, thresholds and outputs must align")
    if len(set(classes)) != len(classes):
        raise ValueError("Duplicate model classes")
    if any(not math.isfinite(float(t)) or not 0 <= float(t) <= 1 for t in thresholds):
        raise ValueError("Invalid model thresholds")
    for estimator in classifier.estimators_:
        if not set(estimator.classes_).issubset({0, 1}):
            raise ValueError("Expected binary part classifiers")


def build_sample(data, model, make_year, damage_zone):
    model = model.strip().upper()
    if not model or damage_zone not in SUPPORTED_ZONES or not 1886 <= make_year <= 2100:
        raise ValueError("Invalid model, damage zone or make year")
    prep = data["pipeline"].named_steps["prep"]
    # Read the fitted vocabulary, not a new hardcoded list of Toyota models.
    categorical_columns = next(columns for name, _, columns in prep.transformers_ if name == "cat")
    encoder = prep.named_transformers_["cat"]
    vocabularies = dict(zip(categorical_columns, encoder.categories_))
    known_models = set(vocabularies.get("Model_Grouped", []))
    if model not in known_models:
        if "OTHER_MODEL" not in known_models:
            raise ValueError("Vehicle model is unsupported by this model release")
        model = "OTHER_MODEL"
    if "Damage_Zone" in vocabularies and damage_zone not in vocabularies["Damage_Zone"]:
        raise ValueError("Damage zone is unsupported by this model release")
    return pd.DataFrame([{
        "Model_Grouped": model,
        "Damage_Zone": damage_zone,
        "Make_Year": make_year,
        "Vehicle_Age": max(0, min(45, REFERENCE_YEAR - make_year)),
        "month_num": DEFAULT_MONTH,
    }])


def positive_probabilities(data, sample):
    outputs = data["pipeline"].predict_proba(sample)
    estimators = data["pipeline"].named_steps["clf"].estimators_
    if len(outputs) != len(estimators):
        raise ValueError("Prediction output count does not match model")
    probabilities = []
    for output, estimator in zip(outputs, estimators):
        labels = list(estimator.classes_)
        probability = float(output[0][labels.index(1)]) if 1 in labels else 0.0
        if not math.isfinite(probability) or not 0 <= probability <= 1:
            raise ValueError("Invalid model probability")
        probabilities.append(probability)
    return probabilities
