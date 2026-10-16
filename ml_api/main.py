"""
Aarogya Sahayak - Risk Prediction Microservice
FastAPI service providing clinical heuristic and ML-based risk assessment.
"""

from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="Aarogya Sahayak - Clinical Risk Engine",
    description="Microservice providing health risk evaluation for vital metrics",
    version="1.0.0"
)

# Enable CORS for local Vite dev server and PWA clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class VitalsRiskRequest(BaseModel):
    glucose: float = Field(..., ge=20, le=600, description="Blood glucose level in mg/dL")
    systolic_bp: Optional[float] = Field(None, ge=40, le=300, description="Systolic blood pressure in mmHg")
    blood_pressure: Optional[float] = Field(None, ge=40, le=300, description="Alternative key for systolic BP")
    diastolic_bp: Optional[float] = Field(None, ge=30, le=200, description="Diastolic blood pressure in mmHg")
    weight: Optional[float] = Field(None, ge=20, le=300, description="Body weight in kg")
    bmi: Optional[float] = Field(None, ge=10, le=70, description="Body Mass Index")

    class Config:
        populate_by_name = True


class VitalsRiskResponse(BaseModel):
    risk_level: str
    risk_score: int
    factors: List[str]
    recommendations: List[str]


def evaluate_risk(payload: VitalsRiskRequest) -> VitalsRiskResponse:
    """
    Evaluates cardiovascular, diabetes, and lifestyle risk based on clinical guidelines.
    NOTE: In production, load a serialized ML model (e.g., joblib.load('risk_model.pkl'))
          and predict probabilistic risk scores.
    """
    # Normalize systolic blood pressure from either key
    systolic = payload.systolic_bp if payload.systolic_bp is not None else payload.blood_pressure
    glucose = payload.glucose
    diastolic = payload.diastolic_bp
    bmi = payload.bmi

    # If BMI not supplied but weight is given with default 165cm height
    if bmi is None and payload.weight:
        height_m = 1.65
        bmi = round(payload.weight / (height_m * height_m), 1)

    factors: List[str] = []
    recommendations: List[str] = []

    # Clinical Flag Evaluation
    high_glucose = glucose >= 180
    moderate_glucose = glucose >= 140
    
    high_bp = systolic is not None and systolic >= 140
    moderate_bp = systolic is not None and systolic >= 130
    
    high_diastolic = diastolic is not None and diastolic >= 90
    high_bmi = bmi is not None and bmi >= 28.0

    if high_glucose:
        factors.append(f"Severely elevated blood glucose ({glucose} mg/dL)")
        recommendations.append("Immediate medical consultation advised for glycemic control.")
    elif moderate_glucose:
        factors.append(f"Elevated blood glucose ({glucose} mg/dL)")
        recommendations.append("Limit dietary refined sugars and carbohydrates; monitor fasting levels.")

    if high_bp or high_diastolic:
        bp_label = f"{systolic}/{diastolic}" if diastolic else f"{systolic}"
        factors.append(f"Hypertension Stage 2 ({bp_label} mmHg)")
        recommendations.append("Consult your healthcare provider or ASHA worker for blood pressure management.")
    elif moderate_bp:
        factors.append(f"Pre-hypertension ({systolic} mmHg)")
        recommendations.append("Reduce sodium intake and incorporate 30 minutes of daily aerobic walking.")

    if high_bmi:
        factors.append(f"Elevated BMI ({bmi})")
        recommendations.append("Engage in regular physical activity and a balanced whole-food diet.")

    # Risk Level & Score Synthesis
    if high_glucose or high_bp:
        risk_level = "high"
        risk_score = 85
    elif moderate_glucose or moderate_bp or high_bmi:
        risk_level = "moderate"
        risk_score = 55
    else:
        risk_level = "low"
        risk_score = 20
        factors.append("Vitals are within typical reference ranges")
        recommendations.append("Maintain healthy diet, regular hydration, and active daily routine.")

    return VitalsRiskResponse(
        risk_level=risk_level,
        risk_score=risk_score,
        factors=factors,
        recommendations=recommendations
    )


@app.get("/")
def root():
    return {
        "service": "Aarogya Sahayak - Clinical Risk Engine",
        "status": "online",
        "version": "1.0.0"
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/predict_risk", response_model=VitalsRiskResponse)
def predict_risk_endpoint(vitals: VitalsRiskRequest):
    try:
        result = evaluate_risk(vitals)
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Risk evaluation error: {str(exc)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
