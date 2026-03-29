import pandas as pd
import pickle
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, roc_auc_score

DATA_PATH = "data/medical-appointments-no-show-en.csv"
MODEL_PATH = "models/noshow_model.pkl"
ENCODERS_PATH = "models/encoders.pkl"


def load_and_preprocess(path: str):
    df = pd.read_csv(path)

    # Target
    df["target"] = (df["no_show"] == "yes").astype(int)

    # Appointment hour from time string (e.g. "13:20")
    df["appointment_hour"] = df["appointment_time"].str.split(":").str[0].astype(float)

    # Age: fill nulls with median
    age_median = df["age"].median()
    df["age"] = df["age"].fillna(age_median)

    # Disability: convert to binary (any non-null, non-empty value = 1)
    df["has_disability"] = df["disability"].apply(
        lambda x: 0 if pd.isna(x) or str(x).strip() == "" else 1
    )

    # Weather: fill nulls with median
    for col in ["average_temp_day", "average_rain_day"]:
        df[col] = df[col].fillna(df[col].median())

    # Categorical encoders
    encoders = {}
    for col in ["gender", "specialty", "city", "rain_intensity", "heat_intensity"]:
        df[col] = df[col].fillna("unknown")
        le = LabelEncoder()
        df[f"{col}_enc"] = le.fit_transform(df[col].astype(str))
        encoders[col] = le

    # appointment_shift: morning=0, afternoon=1
    df["shift_enc"] = (df["appointment_shift"] == "afternoon").astype(int)

    features = [
        "appointment_hour", "shift_enc", "age",
        "under_12_years_old", "over_60_years_old",
        "patient_needs_companion", "has_disability",
        "rainy_day_before", "storm_day_before",
        "average_temp_day", "average_rain_day",
        "gender_enc", "specialty_enc", "city_enc",
        "rain_intensity_enc", "heat_intensity_enc",
    ]

    encoders["features"] = features
    encoders["age_median"] = age_median

    X = df[features]
    y = df["target"]
    return X, y, encoders


def train():
    print("Loading data...")
    X, y, encoders = load_and_preprocess(DATA_PATH)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("Training Random Forest model...")
    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=10,
        class_weight="balanced",
        random_state=42,
        n_jobs=1,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    print("\n" + classification_report(y_test, y_pred))
    print(f"ROC-AUC: {roc_auc_score(y_test, y_prob):.4f}")

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    with open(ENCODERS_PATH, "wb") as f:
        pickle.dump(encoders, f)

    print(f"\nModel saved to {MODEL_PATH}")


if __name__ == "__main__":
    train()
