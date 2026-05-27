from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, field_validator
import pandas as pd
import numpy as np
import joblib

# =========================================================
# LOAD TRAINED MODEL
# =========================================================

model = joblib.load("titanic_survival_model.pkl")

# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="Titanic Survival Prediction API",
    description="Predict whether a passenger survived or not",
    version="1.0"
)

# =========================================================
# CORS MIDDLEWARE
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# INPUT VALIDATION
# =========================================================

class PassengerData(BaseModel):

    pclass: int = Field(..., ge=1, le=3)

    sex: str

    age: float = Field(..., ge=0, le=100)

    sibsp: int = Field(..., ge=0)

    parch: int = Field(..., ge=0)

    fare: float = Field(..., ge=0)

    embarked: str

    # ==========================
    # SEX VALIDATION
    # ==========================

    @field_validator("sex")
    @classmethod
    def validate_sex(cls, value):

        value = value.lower()

        allowed = ["male", "female"]

        if value not in allowed:

            raise ValueError(
                "sex must be either 'male' or 'female'"
            )

        return value

    # ==========================
    # EMBARKED VALIDATION
    # ==========================

    @field_validator("embarked")
    @classmethod
    def validate_embarked(cls, value):

        value = value.upper()

        allowed = ["S", "C", "Q"]

        if value not in allowed:

            raise ValueError(
                "embarked must be one of 'S', 'C', or 'Q'"
            )

        return value


# =========================================================
# RESPONSE MODEL
# =========================================================

class PredictionResponse(BaseModel):

    prediction: str

    survival_probability: str


# =========================================================
# STATIC FILES MOUNTING
# =========================================================

app.mount("/static", StaticFiles(directory="static"), name="static")


# =========================================================
# HOME ROUTE (SERVES FRONTEND)
# =========================================================

@app.get("/")
def home():

    return FileResponse("static/index.html")


# =========================================================
# PREDICTION ROUTE
# =========================================================

@app.post(
    "/predict",
    response_model=PredictionResponse
)

def predict_survival(data: PassengerData):

    # =====================================================
    # CONVERT INPUT TO DATAFRAME
    # =====================================================

    new_passenger = pd.DataFrame([data.model_dump()])

    # =====================================================
    # FEATURE ENGINEERING
    # =====================================================

    # Family Size
    new_passenger["family_size"] = (

        new_passenger["sibsp"] +

        new_passenger["parch"] + 1
    )

    # Is Alone
    new_passenger["is_alone"] = np.where(

        new_passenger["family_size"] == 1,

        1,

        0
    )

    # Fare Per Person
    new_passenger["fare_per_person"] = (

        new_passenger["fare"] /

        new_passenger["family_size"]
    )

    # =====================================================
    # AGE BAND
    # =====================================================

    new_passenger["age_band"] = pd.cut(

        new_passenger["age"],

        bins=[0, 12, 20, 40, 60, 100],

        labels=[
            "child",
            "teen",
            "adult",
            "senior",
            "old"
        ]
    )

    # =====================================================
    # FARE BAND
    # =====================================================

    fare = new_passenger["fare"].iloc[0]

    if fare < 10:

        fare_band = "low"

    elif fare < 30:

        fare_band = "medium"

    elif fare < 80:

        fare_band = "high"

    else:

        fare_band = "vip"

    new_passenger["fare_band"] = fare_band

    # =====================================================
    # MODEL PREDICTION
    # =====================================================

    prediction = model.predict(new_passenger)[0]

    probability = model.predict_proba(
        new_passenger
    )[0][1]

    # =====================================================
    # RESULT
    # =====================================================

    result = (

        "Passenger Survived"

        if prediction == 1

        else "Passenger Did Not Survive"
    )

    # =====================================================
    # RETURN RESPONSE
    # =====================================================

    return {

        "prediction": result,

        "survival_probability":
        f"{probability * 100:.2f}%"
    }