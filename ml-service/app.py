import joblib
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import os

app = FastAPI()

# Load model
model_path = os.path.join(os.path.dirname(__file__), 'model.pkl')
if os.path.exists(model_path):
    model = joblib.load(model_path)
else:
    model = None
    print("Warning: model.pkl not found. Predictions will fail.")

class InputData(BaseModel):
    features: List[float]

@app.get("/")
def read_root():
    return {"message": "ML Service is running"}

@app.post("/predict")
def predict(data: InputData):
    if not model:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    try:
        prediction = model.predict([data.features])
        return {"prediction": int(prediction[0])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
