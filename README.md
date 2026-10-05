# SmartCrop - Wheather based crop recommendation assistant 

# Crop Recommendation ML Model

## Status: Phase 1 complete (model training)

## Dataset
- Source: Kaggle Train_Dataset.csv / Test_Dataset.csv
- Note: Test_Dataset.csv was found to be an exact duplicate of Train_Dataset.csv,
  so only Train_Dataset.csv was used, with an 80/20 stratified split.
- 40 crops, ~18,000 rows. Columns: N, P, K, pH, rainfall, temperature -> Crop

## Model
- RandomForestClassifier (scikit-learn), class_weight='balanced' to handle
  severe class imbalance (rice: 2245 rows vs pumpkin: 9 rows).
- Accuracy: 92.7%

## Known limitations
- N-P-K values are fixed per crop in this dataset rather than continuously
  varying, unlike real soil data.
- jowar, jute, and rice share identical N-P-K values (80,40,40) and overlapping
  climate ranges, causing the model to sometimes confuse these three specifically.
  This is a dataset limitation, not a training bug.
- Sugarcane is missing from this dataset; a rule-based fallback entry is planned
  for Phase 2/3.

## Next steps
- Phase 2: wrap model in an API (FastAPI)
- Phase 3: deploy API, connect to frontend (Lovable)

 ## Future Improvements:
  Benchmark Random Forest against XGBoost/LightGBM with cross-validation and SHAP explainability — architecture already supports swapping models with minimal changes.

- **Deployed API :**
- https://smartcrop-api-1p5w.onrender.com
