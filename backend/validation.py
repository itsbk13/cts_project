# =============================================================
# INPUT VALIDATION LAYER
# =============================================================
# PURPOSE:
#   This file validates all raw input data before it is processed
#   by the ML pipeline or inserted into Databricks.
#   Place this validation BEFORE any call to preprocessing.py.
#
#   In FastAPI, call validate_patient() and validate_event() right
#   after receiving the POST request body.
# =============================================================

from datetime import datetime

VALID_REGIONS       = {"North", "South", "East", "West", "Northeast", "Southeast", "Midwest", "Southwest"}
VALID_INSURANCES    = {"Commercial", "Medicare", "Medicaid", "Self-Pay", "Other"}
VALID_THERAPIES     = {"Therapy_A", "Therapy_B", "Therapy_C", "Therapy_D", "Biologic A", "Biologic B", "Small Molecule", "Infusion Therapy", "Oral Therapy"}
VALID_STAGES        = {"Diagnosis", "Prescription", "Prior Authorization", "Hub Enrollment",
                       "Claim Approval", "Prescription Fill", "Treatment Initiation", "Follow-up", "Copay", "First Fill"}
VALID_CLAIM_STATUS  = {"Pending", "Approved", "Rejected"}


def validate_patient(patient: dict) -> list:
    """
    Validates a patient registration record.
    Returns a list of error strings. Empty list means valid.
    """
    errors = []

    # Patient_ID
    if not patient.get("Patient_ID") or not str(patient["Patient_ID"]).strip():
        errors.append("Patient_ID is required and cannot be empty.")

    # Age
    age = patient.get("Age")
    if age is None:
        errors.append("Age is required.")
    elif not isinstance(age, (int, float)) or not (0 <= age <= 120):
        errors.append(f"Age must be a number between 0 and 120. Got: {age}")

    # Region
    if patient.get("Region") not in VALID_REGIONS:
        errors.append(f"Region must be one of {VALID_REGIONS}. Got: {patient.get('Region')}")

    # Insurance_Type
    if patient.get("Insurance_Type") not in VALID_INSURANCES:
        errors.append(f"Insurance_Type must be one of {VALID_INSURANCES}. Got: {patient.get('Insurance_Type')}")

    # Therapy
    if patient.get("Therapy") and patient.get("Therapy") not in VALID_THERAPIES:
        errors.append(f"Therapy must be one of {VALID_THERAPIES}. Got: {patient.get('Therapy')}")

    # Dates
    for date_field in ["Diagnosis_Date", "Prescription_Date"]:
        val = patient.get(date_field)
        if val:
            try:
                datetime.strptime(str(val), "%Y-%m-%d")
            except ValueError:
                errors.append(f"{date_field} must be in YYYY-MM-DD format. Got: {val}")

    # Prior_Authorization
    pa = patient.get("Prior_Authorization")
    if pa is not None and pa not in (0, 1):
        errors.append(f"Prior_Authorization must be 0 or 1. Got: {pa}")

    return errors


def validate_event(event: dict) -> list:
    """
    Validates a journey event record.
    Returns a list of error strings. Empty list means valid.
    """
    errors = []

    # Patient_ID
    if not event.get("Patient_ID"):
        errors.append("Patient_ID is required in event.")

    # Current_Stage
    if event.get("Current_Stage") and event.get("Current_Stage") not in VALID_STAGES:
        errors.append(f"Current_Stage must be one of {VALID_STAGES}. Got: {event.get('Current_Stage')}")

    # PA_Delay_Days
    delay = event.get("PA_Delay_Days", 0)
    if not isinstance(delay, (int, float)) or delay < 0 or delay > 365:
        errors.append(f"PA_Delay_Days must be a number between 0 and 365. Got: {delay}")

    # Stockout_Flag
    if event.get("Stockout_Flag") is not None and event.get("Stockout_Flag") not in (0, 1):
        errors.append(f"Stockout_Flag must be 0 or 1. Got: {event.get('Stockout_Flag')}")

    # Contact_Attempts
    attempts = event.get("Contact_Attempts", 0)
    if not isinstance(attempts, (int, float)) or attempts < 0 or attempts > 100:
        errors.append(f"Contact_Attempts must be between 0 and 100. Got: {attempts}")

    # Claim_Status
    if event.get("Claim_Status") and event.get("Claim_Status") not in VALID_CLAIM_STATUS:
        errors.append(f"Claim_Status must be one of {VALID_CLAIM_STATUS}. Got: {event.get('Claim_Status')}")

    return errors


def validate_or_raise(patient: dict, event: dict):
    """
    Convenience function. Call this at the top of your FastAPI endpoint.
    Raises ValueError with all error messages if any validation fails.
    """
    errors = validate_patient(patient) + validate_event(event)
    if errors:
        raise ValueError(f"Validation failed:\n" + "\n".join(f"  - {e}" for e in errors))
    return True
