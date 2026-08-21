# =============================================================
# PATIENT JOURNEY ANALYTICS — PREPROCESSING MODULE
# =============================================================
# This module contains all the logic to go from RAW hospital
# data (patient info + journey events) to the 6 features the
# trained model needs.
#
# Used by:
#   - notebooks/01_training_pipeline.ipynb  (training)
#   - Databricks inference notebook         (inference on new data)
# =============================================================

import pandas as pd
import numpy as np


# -----------------------------------------------------------
# CONSTANTS
# -----------------------------------------------------------

# The 5 stages in order (matches frontend JOURNEY_STAGES constant)
STAGE_ORDER = {
    "Diagnosis":          1,
    "Prescription":       2,
    "Prior Authorization":3,
    "Copay":              4,
    "First Fill":         5,
}

REVERSE_STAGE_ORDER = {v: k for k, v in STAGE_ORDER.items()}

# The 6 features the XGBoost model was trained on
MODEL_FEATURE_NAMES = [
    "Prior_Authorization",
    "Max_PA_Delay_Days",
    "Stockout_Experienced",
    "Support_Enrolled",
    "Total_Contact_Attempts",
    "Claim_Rejected",
]

# All columns the model needs from patient-level data
PATIENT_LEVEL_COLUMNS = [
    "Patient_ID",
    "Age",
    "Region",
    "Diagnosis",
    "Therapy",
    "Diagnosis_Date",
    "Prescription_Date",
    "Insurance_Type",
    "Payer",
    "Copay_Amount",
    "Prior_Authorization",
    "Pharmacy_Type",
]

# All columns expected in journey events
JOURNEY_EVENT_COLUMNS = [
    "Journey_Event_ID",
    "Patient_ID",
    "Current_Stage",
    "Event_Date",
    "PA_Delay_Days",
    "Stockout_Flag",
    "Processing_Date",
    "Fill_Date",
    "Contact_Attempts",
    "Support_Enrollment",
    "Claim_Status",
    "Claim_Rejection_Reason",
]


# -----------------------------------------------------------
# STEP 1: COMPUTE JOURNEY FRICTION FEATURES
# -----------------------------------------------------------
# Takes the Journey_Events table (many rows per patient) and
# collapses them into ONE row per patient with 5 aggregated
# features.

def build_journey_friction(journey_df: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregates journey events per patient into friction features.

    Input:  journey_df — raw Journey_Events table
            (multiple rows per patient, one row per stage)

    Output: DataFrame with one row per patient and columns:
            Patient_ID, Max_PA_Delay_Days, Stockout_Experienced,
            Support_Enrolled, Total_Contact_Attempts, Claim_Rejected
    """

    # -- Core aggregations --
    friction = (
        journey_df
        .groupby("Patient_ID")
        .agg(
            # Worst prior-auth delay the patient faced across all stages
            Max_PA_Delay_Days=("PA_Delay_Days", "max"),

            # Did the patient EVER face a medication stockout?
            Stockout_Experienced=("Stockout_Flag", "max"),

            # Was the patient EVER enrolled in a support program?
            Support_Enrolled=("Support_Enrollment", "max"),

            # Total number of contact attempts across all stages
            Total_Contact_Attempts=("Contact_Attempts", "sum"),
        )
        .reset_index()
    )

    # -- Claim rejection: did ANY claim get rejected? --
    claim_rejected = (
        journey_df
        .assign(
            Claim_Rejected_Flag=(
                journey_df["Claim_Status"] == "Rejected"
            ).astype(int)
        )
        .groupby("Patient_ID")["Claim_Rejected_Flag"]
        .max()
        .reset_index(name="Claim_Rejected")
    )

    # Merge claim rejection back
    friction = friction.merge(
        claim_rejected,
        on="Patient_ID",
        how="left",
        validate="one_to_one",
    )

    # Fill any missing values with 0
    friction = friction.fillna(0)

    return friction


# -----------------------------------------------------------
# STEP 2: COMPUTE STAGE PROGRESSION FEATURES
# -----------------------------------------------------------
# Figures out how far each patient got through the 8 stages.

def build_stage_progression(journey_df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes the furthest stage each patient reached.

    Input:  journey_df — raw Journey_Events table

    Output: DataFrame with one row per patient and columns:
            Patient_ID, Stages_Reached, Final_Stage, Journey_Completed
    """

    journey_with_stage_num = journey_df.copy()
    journey_with_stage_num["Stage_Number"] = (
        journey_with_stage_num["Current_Stage"].map(STAGE_ORDER)
    )

    stage_progression = (
        journey_with_stage_num
        .groupby("Patient_ID")["Stage_Number"]
        .max()
        .reset_index(name="Stages_Reached")
    )

    stage_progression["Final_Stage"] = (
        stage_progression["Stages_Reached"].map(REVERSE_STAGE_ORDER)
    )

    # Patient completed the full journey if they reached First Fill (stage 5)
    stage_progression["Journey_Completed"] = (
        stage_progression["Stages_Reached"] == 5
    ).astype(int)

    return stage_progression


# -----------------------------------------------------------
# STEP 3: COMPUTE JOURNEY TIMING FEATURES
# -----------------------------------------------------------

def build_journey_timing(journey_df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes total journey duration per patient.

    Input:  journey_df — raw Journey_Events table

    Output: DataFrame with columns:
            Patient_ID, First_Journey_Date, Last_Journey_Date,
            Journey_Duration_Days
    """

    journey_df = journey_df.copy()
    journey_df["Event_Date"] = pd.to_datetime(
        journey_df["Event_Date"], errors="coerce"
    )

    timing = (
        journey_df
        .groupby("Patient_ID")
        .agg(
            First_Journey_Date=("Event_Date", "min"),
            Last_Journey_Date=("Event_Date", "max"),
        )
        .reset_index()
    )

    timing["Journey_Duration_Days"] = (
        timing["Last_Journey_Date"] - timing["First_Journey_Date"]
    ).dt.days

    return timing


# -----------------------------------------------------------
# STEP 4: BUILD FULL PATIENT MASTER TABLE
# -----------------------------------------------------------
# Merges patient info + friction features + stage progression
# + timing features + outcomes (if available) into one flat table.

def build_patient_master(
    patient_df: pd.DataFrame,
    journey_df: pd.DataFrame,
    outcome_df: pd.DataFrame = None,
) -> pd.DataFrame:
    """
    Builds the complete patient master DataFrame.

    Inputs:
        patient_df  — Patient_Data table (one row per patient)
        journey_df  — Journey_Events table (many rows per patient)
        outcome_df  — Journey_Outcomes table (one row per patient)
                      Pass None if outcomes not available (pure inference)

    Output:
        patient_master — one row per patient with all columns including
                         the 6 engineered model features
    """

    # Standardise date columns
    patient_df = patient_df.copy()
    journey_df = journey_df.copy()

    for col in ["Diagnosis_Date", "Prescription_Date"]:
        if col in patient_df.columns:
            patient_df[col] = pd.to_datetime(patient_df[col], errors="coerce")

    for col in ["Event_Date", "Processing_Date", "Fill_Date"]:
        if col in journey_df.columns:
            journey_df[col] = pd.to_datetime(journey_df[col], errors="coerce")

    # Start with patient-level data
    master = patient_df.copy()

    # Merge outcomes if provided
    if outcome_df is not None:
        master = master.merge(
            outcome_df,
            on="Patient_ID",
            how="left",
            validate="one_to_one",
        )

    # Merge journey timing
    timing = build_journey_timing(journey_df)
    master = master.merge(
        timing,
        on="Patient_ID",
        how="left",
    )

    # Merge stage progression
    progression = build_stage_progression(journey_df)
    master = master.merge(
        progression,
        on="Patient_ID",
        how="left",
    )

    # Merge friction features (contains the 5 aggregated model features)
    friction = build_journey_friction(journey_df)
    master = master.merge(
        friction,
        on="Patient_ID",
        how="left",
    )

    return master


# -----------------------------------------------------------
# STEP 5: EXTRACT THE 6 MODEL FEATURES
# -----------------------------------------------------------
# This is what you pass directly into model.predict_proba()

def get_model_features(patient_master: pd.DataFrame) -> pd.DataFrame:
    """
    Extracts only the 6 features the trained XGBoost model needs.

    Input:  patient_master — full patient master table

    Output: DataFrame with only the 6 model feature columns
            (same order as training)
    """

    missing = [
        col for col in MODEL_FEATURE_NAMES
        if col not in patient_master.columns
    ]
    if missing:
        raise ValueError(
            f"Patient master is missing model features: {missing}\n"
            f"Make sure build_patient_master() was called correctly."
        )

    return patient_master[MODEL_FEATURE_NAMES].copy()


# -----------------------------------------------------------
# STEP 6: FUNNEL ANALYSIS
# -----------------------------------------------------------

def compute_funnel(journey_df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes stage-level funnel: how many patients reached each stage,
    and the drop-off rate between consecutive stages.

    Input:  journey_df — raw Journey_Events table

    Output: DataFrame with columns:
            Stage, Patients, Percentage, Dropoff_Count, Dropoff_Rate
    """

    stage_list = list(STAGE_ORDER.keys())

    journey_df = journey_df.copy()
    journey_df["Stage_Number"] = journey_df["Current_Stage"].map(STAGE_ORDER)

    max_stage = (
        journey_df
        .groupby("Patient_ID")["Stage_Number"]
        .max()
    )

    funnel_rows = []
    for stage, number in STAGE_ORDER.items():
        patients_reached = int((max_stage >= number).sum())
        funnel_rows.append({
            "Stage": stage,
            "Stage_Number": number,
            "Patients": patients_reached,
        })

    funnel = pd.DataFrame(funnel_rows).sort_values("Stage_Number").reset_index(drop=True)

    total = funnel["Patients"].iloc[0] if len(funnel) > 0 else 1
    funnel["Percentage"] = (funnel["Patients"] / total * 100).round(2)

    funnel["Dropoff_Count"] = 0
    funnel["Dropoff_Rate"] = 0.0

    for i in range(1, len(funnel)):
        prev = funnel.loc[i - 1, "Patients"]
        curr = funnel.loc[i, "Patients"]
        funnel.loc[i, "Dropoff_Count"] = prev - curr
        funnel.loc[i, "Dropoff_Rate"] = round(
            (prev - curr) / prev * 100 if prev > 0 else 0, 2
        )

    return funnel.drop(columns=["Stage_Number"])


# -----------------------------------------------------------
# STEP 7: COHORT ANALYSIS
# -----------------------------------------------------------

def compute_cohort_dropoff(
    patient_master: pd.DataFrame,
    group_by: str,
) -> pd.DataFrame:
    """
    Computes drop-off rate for each category within a column.

    Inputs:
        patient_master — full patient master table (must have Dropoff_Flag)
        group_by       — column name to group by (e.g. "Region", "Insurance_Type")

    Output: DataFrame with columns:
            <group_by>, Total_Patients, Dropoffs, Dropoff_Rate_Pct
    """

    if "Dropoff_Flag" not in patient_master.columns:
        raise ValueError("patient_master must contain Dropoff_Flag for cohort analysis.")

    cohort = (
        patient_master
        .groupby(group_by)
        .agg(
            Total_Patients=("Patient_ID", "count"),
            Dropoffs=("Dropoff_Flag", "sum"),
        )
        .reset_index()
    )

    cohort["Dropoff_Rate_Pct"] = (
        cohort["Dropoffs"] / cohort["Total_Patients"] * 100
    ).round(2)

    return cohort.sort_values("Dropoff_Rate_Pct", ascending=False).reset_index(drop=True)
