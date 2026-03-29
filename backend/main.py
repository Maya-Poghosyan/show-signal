import os
import pickle
import pandas as pd
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from agent import initiate_outreach, handle_reply
from patients import PATIENTS

app = FastAPI(title="Show Signal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = "models/noshow_model.pkl"
ENCODERS_PATH = "models/encoders.pkl"

try:
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    with open(ENCODERS_PATH, "rb") as f:
        encoders = pickle.load(f)
except FileNotFoundError:
    model = None
    encoders = None

RISK_LABELS = {
    "appointment_hour": "Late-day appointment",
    "shift_enc": "Afternoon appointment",
    "age": "Age-related attendance risk",
    "over_60_years_old": "Patient is over 60",
    "under_12_years_old": "Patient is under 12",
    "patient_needs_companion": "Requires a companion",
    "has_disability": "Patient has a disability",
    "rainy_day_before": "Rain the day before",
    "storm_day_before": "Storm the day before",
    "average_rain_day": "High rainfall on appointment day",
    "city_enc": "Location transport barrier",
    "specialty_enc": "Specialty attendance pattern",
}


class PatientInput(BaseModel):
    age: float
    gender: str
    specialty: str
    appointment_time: str       # "HH:MM"
    appointment_shift: str      # "morning" | "afternoon"
    city: str
    under_12_years_old: int
    over_60_years_old: int
    patient_needs_companion: int
    disability: str             # "" | "motor" | "intellectual"
    rainy_day_before: int
    storm_day_before: int
    rain_intensity: str
    heat_intensity: str
    average_temp_day: float
    average_rain_day: float


class OutreachRequest(BaseModel):
    patient_id: str
    patient_name: str
    appointment_date: str


def safe_encode(encoder, value: str, fallback: int = 0) -> int:
    try:
        return int(encoder.transform([value])[0])
    except ValueError:
        return fallback


def compute_prediction(p: dict) -> dict:
    appointment_hour = float(p["appointment_time"].split(":")[0])
    shift_enc = 1 if p["appointment_shift"] == "afternoon" else 0
    has_disability = 0 if not p.get("disability") or str(p["disability"]).strip() == "" else 1
    age = p["age"] if p["age"] is not None else encoders["age_median"]

    gender_enc = safe_encode(encoders["gender"], p["gender"])
    specialty_enc = safe_encode(encoders["specialty"], p["specialty"])
    city_enc = safe_encode(encoders["city"], p["city"])
    rain_enc = safe_encode(encoders["rain_intensity"], p["rain_intensity"])
    heat_enc = safe_encode(encoders["heat_intensity"], p["heat_intensity"])

    row = pd.DataFrame([{
        "appointment_hour": appointment_hour,
        "shift_enc": shift_enc,
        "age": age,
        "under_12_years_old": p["under_12_years_old"],
        "over_60_years_old": p["over_60_years_old"],
        "patient_needs_companion": p["patient_needs_companion"],
        "has_disability": has_disability,
        "rainy_day_before": p["rainy_day_before"],
        "storm_day_before": p["storm_day_before"],
        "average_temp_day": p["average_temp_day"],
        "average_rain_day": p["average_rain_day"],
        "gender_enc": gender_enc,
        "specialty_enc": specialty_enc,
        "city_enc": city_enc,
        "rain_intensity_enc": rain_enc,
        "heat_intensity_enc": heat_enc,
    }])

    prob = float(model.predict_proba(row)[0][1])
    importances = dict(zip(encoders["features"], model.feature_importances_))
    top_features = sorted(importances.items(), key=lambda x: x[1], reverse=True)[:5]
    risk_factors = [RISK_LABELS[f] for f, _ in top_features if f in RISK_LABELS]

    return {
        "no_show_probability": round(prob, 3),
        "risk_level": "high" if prob >= 0.4 else "medium" if prob >= 0.2 else "low",
        "risk_factors": risk_factors,
    }


@app.get("/patients")
def get_patients():
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Run train.py first.")
    result = []
    for p in PATIENTS:
        prediction = compute_prediction(p)
        result.append({**p, **prediction})
    return result


@app.post("/predict")
def predict(patient: PatientInput):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Run train.py first.")
    return compute_prediction(patient.model_dump())


def build_patient_flags(p: dict) -> list[str]:
    flags = []
    if p.get("over_60_years_old"):
        flags.append("over 60 years old")
    if p.get("under_12_years_old"):
        flags.append("under 12 years old")
    if p.get("patient_needs_companion"):
        flags.append("requires a companion")
    disability = str(p.get("disability", "")).strip()
    if disability:
        flags.append(f"{disability} disability")
    if p.get("scholarship"):
        flags.append("on welfare/scholarship program")
    if p.get("rainy_day_before") or p.get("storm_day_before"):
        flags.append("adverse weather expected")
    return flags


@app.post("/outreach")
def outreach(req: OutreachRequest):
    test_phone = os.getenv("TEST_PHONE_NUMBER")
    if not test_phone:
        raise HTTPException(status_code=500, detail="TEST_PHONE_NUMBER not configured.")

    patient = next((p for p in PATIENTS if p["id"] == req.patient_id), None)
    flags = build_patient_flags(patient) if patient else []

    message = initiate_outreach(
        phone=test_phone,
        patient_name=req.patient_name,
        appointment_date=req.appointment_date,
        patient_flags=flags,
    )
    return {"status": "sent", "message": message}


@app.post("/webhook/sms")
async def sms_webhook(request: Request):
    form = await request.form()
    from_number = form.get("From", "")
    body = form.get("Body", "")
    if not from_number or not body:
        raise HTTPException(status_code=400, detail="Missing From or Body")
    reply = handle_reply(phone=from_number, patient_message=body)
    return {"status": "ok", "reply": reply}
