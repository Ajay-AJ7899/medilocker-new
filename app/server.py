from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np
import os

# -----------------------------
# Load model (Docker-safe path)
# -----------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "diabetes_model.pkl")

model = joblib.load(MODEL_PATH)

app = FastAPI(title="Diabetes Prediction API")

# -----------------------------
# Request Schema
# -----------------------------
class PredictRequest(BaseModel):
    pregnancies: float
    glucose: float
    bloodPressure: float
    skinThickness: float
    insulin: float
    bmi: float
    diabetesPedigree: float
    age: float

# -----------------------------
# Health check
# -----------------------------
@app.get("/")
def health():
    return {"message": "Diabetes model API is running"}

# -----------------------------
# Prediction endpoint
# -----------------------------
@app.post("/predict")
def predict(data: PredictRequest):

    features = np.array([[
        data.pregnancies,
        data.glucose,
        data.bloodPressure,
        data.skinThickness,
        data.insulin,
        data.bmi,
        data.diabetesPedigree,
        data.age
    ]])

    probability = model.predict_proba(features)[0][1]

    risk_level = (
        "Low" if probability < 0.30 else
        "Moderate" if probability < 0.60 else
        "High"
    )

    return {
        "riskProbability": round(float(probability), 3),
        "riskPercentage": int(probability * 100),
        "riskLevel": risk_level
    }
