import unittest
from types import SimpleNamespace

import joblib
from pathlib import Path

from .ml_contract import build_sample, positive_probabilities, validate_model


class ModelContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = joblib.load(Path(__file__).with_name("real_model_option_a_tuned.joblib"))

    def test_existing_artifact_and_inference(self):
        validate_model(self.data)
        sample = build_sample(self.data, " aqua nhp10 ", 2013, "Front")
        self.assertEqual(sample.iloc[0]["Model_Grouped"], "AQUA NHP10")
        self.assertEqual(sample.iloc[0]["Vehicle_Age"], 13)
        self.assertEqual(sample.iloc[0]["month_num"], 6)
        scores = positive_probabilities(self.data, sample)
        self.assertEqual(len(scores), len(self.data["classes"]))
        self.assertTrue(all(0 <= score <= 1 for score in scores))

    def test_unknown_models_and_age_boundaries(self):
        sample = build_sample(self.data, "UNSEEN MODEL", 1886, "Rear")
        self.assertEqual(sample.iloc[0]["Model_Grouped"], "OTHER_MODEL")
        self.assertEqual(sample.iloc[0]["Vehicle_Age"], 45)
        self.assertEqual(build_sample(self.data, "AQUA NHP10", 2100, "Side").iloc[0]["Vehicle_Age"], 0)

    def test_invalid_input(self):
        for model, year, zone in [(" ", 2013, "Front"), ("AQUA", 1800, "Front"), ("AQUA", 2013, None)]:
            with self.assertRaises(ValueError):
                build_sample(self.data, model, year, zone)

    def test_invalid_threshold_contract(self):
        for thresholds in [[], [float("nan")] * len(self.data["classes"])]:
            with self.assertRaises(ValueError):
                validate_model({**self.data, "thresholds": thresholds})

    def test_single_class_and_reversed_class_order(self):
        pipeline = SimpleNamespace(
            named_steps={"clf": SimpleNamespace(estimators_=[
                SimpleNamespace(classes_=[1]), SimpleNamespace(classes_=[0]),
                SimpleNamespace(classes_=[1, 0]),
            ])},
            predict_proba=lambda _: [[[1.0]], [[1.0]], [[0.8, 0.2]]],
        )
        self.assertEqual(positive_probabilities({"pipeline": pipeline}, None), [1.0, 0.0, 0.8])


if __name__ == "__main__":
    unittest.main()
