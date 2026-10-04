from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np

# Step A: Load your trained model from the "model" folder next door
model = joblib.load("../model/crop_model.pkl")

# Step B: Create the "listening" program
app = FastAPI(title="Crop Recommendation API")

# Step C: Allow other websites (like your future Lovable app) to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Step D: Describe exactly what data we expect someone to send us
class CropInput(BaseModel):
    N: float
    P: float
    K: float
    pH: float
    rainfall: float
    temperature: float

# Step E: A simple manual check for sugarcane, since it wasn't in our training data
SUGARCANE_RANGE = {
    "N": (100, 150), "P": (50, 80), "K": (100, 150),
    "pH": (6.0, 7.5),
}

def matches_sugarcane(data: CropInput) -> bool:
    checks = [
        SUGARCANE_RANGE["N"][0] <= data.N <= SUGARCANE_RANGE["N"][1],
        SUGARCANE_RANGE["P"][0] <= data.P <= SUGARCANE_RANGE["P"][1],
        SUGARCANE_RANGE["K"][0] <= data.K <= SUGARCANE_RANGE["K"][1],
        SUGARCANE_RANGE["pH"][0] <= data.pH <= SUGARCANE_RANGE["pH"][1],
    ]
    return sum(checks) >= 3

# Step F: A simple "hello" page, just to check the server is alive
@app.get("/")
def home():
    return {"message": "Crop Recommendation API is running"}

# Step G: The real endpoint — this is what will actually be used
@app.post("/predict-crop")
def predict_crop(data: CropInput):
    features = np.array([[data.N, data.P, data.K, data.pH, data.rainfall, data.temperature]])

    probabilities = model.predict_proba(features)[0]
    classes = model.classes_
    top3_idx = np.argsort(probabilities)[::-1][:3]

    top3 = [
        {"crop": classes[i], "confidence": round(float(probabilities[i]) * 100, 2)}
        for i in top3_idx
    ]

    if matches_sugarcane(data):
        top3.append({"crop": "sugarcane", "confidence": "rule-based match (not from ML model)"})

    return {"top_predictions": top3}