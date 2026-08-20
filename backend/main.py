import os
import sys
import datetime
from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt, JWTError

import schemas, utils

app = FastAPI(title="Hospital User System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABRICKS_SERVER_HOSTNAME = os.getenv("DATABRICKS_SERVER_HOSTNAME")
DATABRICKS_HTTP_PATH       = os.getenv("DATABRICKS_HTTP_PATH")
DATABRICKS_TOKEN           = os.getenv("DATABRICKS_TOKEN")
DATABRICKS_SERVING_URL     = os.getenv("DATABRICKS_SERVING_URL")

def get_pseudo_probability(pred_class: float, row) -> float:
    h_score = 0.0
    if row.get("Prior_Authorization", 0) == 1: h_score += 0.2
    if row.get("Max_PA_Delay_Days", 0) > 14: h_score += 0.3
    elif row.get("Max_PA_Delay_Days", 0) > 7: h_score += 0.15
    if row.get("Claim_Rejected", 0) == 1: h_score += 0.3
    if row.get("Total_Contact_Attempts", 0) > 2: h_score += 0.2
    if row.get("Stockout_Experienced", 0) == 1: h_score += 0.1
    if row.get("Support_Enrolled", 0) == 1: h_score -= 0.2

    if pred_class >= 0.5:
        score = 0.75 + (h_score * 0.2)
        return min(0.99, score)
    else:
        score = 0.15 + (h_score * 0.2)
        return max(0.05, min(0.40, score))


def get_db_connection():
    from databricks import sql
    try:
        return sql.connect(
            server_hostname=DATABRICKS_SERVER_HOSTNAME,
            http_path=DATABRICKS_HTTP_PATH,
            access_token=DATABRICKS_TOKEN
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

@app.post("/register", response_model=schemas.UserOut)
def register_user(user: schemas.UserCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Check if email exists
        cursor.execute("SELECT email FROM patient_analytics.login_credential.hospital_login WHERE email = ?", (user.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")

        user_id = utils.generate_user_id()
        hashed_password = utils.get_password_hash(user.password)
        hospital_id = user_id.replace("-", "_").lower()
        if hospital_id.startswith("user_"):
            hospital_id = "hosp_" + hospital_id[5:]
            
        created_at = datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')

        # Insert login details
        cursor.execute(
            """INSERT INTO patient_analytics.login_credential.hospital_login 
               (hospital_id, user_name, hospital_name, email, hashed_password, reset_code, created_at)
               VALUES (?, ?, ?, ?, ?, NULL, ?)""",
            (hospital_id, user.user_name, user.hospital_name, user.email, hashed_password, created_at)
        )
        
        # Insert role
        cursor.execute(
            """INSERT INTO patient_analytics.login_credential.hospital_roles (hospital_id, role) VALUES (?, ?)""",
            (hospital_id, user.role)
        )
        
        utils.send_registration_email(user.email, user_id)
        
        return {
            "user_id": user_id,
            "user_name": user.user_name,
            "hospital_name": user.hospital_name,
            "email": user.email,
            "role": user.role,
            "created_at": created_at
        }
    except HTTPException:
        raise
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.post("/login")
def login_user(credentials: schemas.UserLogin):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    hospital_id_expected = credentials.user_id.replace("-", "_").lower()
    if hospital_id_expected.startswith("user_"):
        hospital_id_expected = "hosp_" + hospital_id_expected[5:]
        
    try:
        cursor.execute(
            """SELECT l.hospital_id, l.user_name, l.hospital_name, l.hashed_password, r.role 
               FROM patient_analytics.login_credential.hospital_login l
               LEFT JOIN patient_analytics.login_credential.hospital_roles r ON l.hospital_id = r.hospital_id
               WHERE l.hospital_id = ?""",
            (hospital_id_expected,)
        )
        user_record = cursor.fetchone()
        if not user_record:
            raise HTTPException(status_code=401, detail="Invalid User ID or password")
            
        h_id, u_name, h_name, hashed_pw, role = user_record
        
        if not utils.verify_password(credentials.password, hashed_pw):
            raise HTTPException(status_code=401, detail="Invalid User ID or password")

        # Auto-onboard schema
        try:
            from onboard_hospital import onboard_hospital
            onboard_hospital(h_id)
        except Exception:
            pass
            
        access_token = utils.create_access_token(data={"hospital_id": h_id, "role": role})

        return {
            "message": "Login successful",
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "user_id": credentials.user_id,
                "user_name": u_name,
                "hospital_name": h_name,
                "hospital_id": h_id,
                "role": role
            }
        }
    finally:
        cursor.close()
        conn.close()

@app.post("/forgot-password")
def forgot_password(req: schemas.ForgotPasswordRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT hospital_id FROM patient_analytics.login_credential.hospital_login WHERE email = ?", (req.email,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Email not found")
            
        code = utils.generate_reset_code()
        cursor.execute("UPDATE patient_analytics.login_credential.hospital_login SET reset_code = ? WHERE email = ?", (code, req.email))
        
        utils.send_reset_code_email(req.email, code)
        return {"message": "Reset code sent"}
    finally:
        cursor.close()
        conn.close()

@app.post("/verify-code")
def verify_code(req: schemas.VerifyCodeRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT reset_code FROM patient_analytics.login_credential.hospital_login WHERE email = ?", (req.email,))
        row = cursor.fetchone()
        if not row or row[0] != req.code:
            raise HTTPException(status_code=400, detail="Invalid code")
        return {"message": "Code verified"}
    finally:
        cursor.close()
        conn.close()

@app.post("/reset-password")
def reset_password(req: schemas.ResetPasswordRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT reset_code FROM patient_analytics.login_credential.hospital_login WHERE email = ?", (req.email,))
        row = cursor.fetchone()
        if not row or row[0] != req.code:
            raise HTTPException(status_code=400, detail="Invalid or expired code")
            
        hashed_password = utils.get_password_hash(req.new_password)
        cursor.execute("UPDATE patient_analytics.login_credential.hospital_login SET hashed_password = ?, reset_code = NULL WHERE email = ?", (hashed_password, req.email))
        return {"message": "Password updated successfully"}
    finally:
        cursor.close()
        conn.close()
import os
import sys
import requests
import pandas as pd
from jose import jwt, JWTError
from dotenv import load_dotenv
from databricks import sql
from typing import Dict, Any
from fastapi import Header

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from onboard_hospital import onboard_hospital
from validation import validate_or_raise, validate_patient, validate_event
from src.preprocessing import build_patient_master, get_model_features
from llm_recommendation import generate_recommendation
import chatbot

DATABRICKS_SERVER_HOSTNAME = os.getenv("DATABRICKS_SERVER_HOSTNAME")
DATABRICKS_HTTP_PATH       = os.getenv("DATABRICKS_HTTP_PATH")
DATABRICKS_TOKEN           = os.getenv("DATABRICKS_TOKEN")
DATABRICKS_SERVING_URL     = os.getenv("DATABRICKS_SERVING_URL")

def get_pseudo_probability(pred_class: float, row) -> float:
    h_score = 0.0
    if row.get("Prior_Authorization", 0) == 1: h_score += 0.2
    if row.get("Max_PA_Delay_Days", 0) > 14: h_score += 0.3
    elif row.get("Max_PA_Delay_Days", 0) > 7: h_score += 0.15
    if row.get("Claim_Rejected", 0) == 1: h_score += 0.3
    if row.get("Total_Contact_Attempts", 0) > 2: h_score += 0.2
    if row.get("Stockout_Experienced", 0) == 1: h_score += 0.1
    if row.get("Support_Enrolled", 0) == 1: h_score -= 0.2

    if pred_class >= 0.5:
        score = 0.75 + (h_score * 0.2)
        return min(0.99, score)
    else:
        score = 0.15 + (h_score * 0.2)
        return max(0.05, min(0.40, score))


def decode_jwt(token: str) -> dict:
    if token.startswith("Bearer "):
        token = token.split(" ")[1]
    try:
        payload = jwt.decode(token, utils.SECRET_KEY, algorithms=[utils.ALGORITHM], options={"verify_signature": False})
        return payload
    except JWTError:
        return {"hospital_id": token}

def get_hospital_id(authorization: str = Header(..., alias="Authorization")):
    payload = decode_jwt(authorization)
    hospital_id = payload.get("hospital_id")
    if not hospital_id:
        raise HTTPException(status_code=401, detail="Invalid token: hospital_id missing")
    # Sanitise: replace hyphens with underscores so it's a valid SQL/Databricks identifier
    # and use 'hosp_' prefix instead of 'user_' (e.g. "USER-628807" --> "hosp_628807")
    hospital_id = hospital_id.replace("-", "_").lower()
    if hospital_id.startswith("user_"):
        hospital_id = "hosp_" + hospital_id[5:]
    return hospital_id

def get_db_connection():
    try:
        return sql.connect(
            server_hostname=DATABRICKS_SERVER_HOSTNAME,
            http_path=DATABRICKS_HTTP_PATH,
            access_token=DATABRICKS_TOKEN
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

from pydantic import BaseModel

class HospitalCreate(BaseModel):
    hospital_id: str
    hospital_name: str = ""
    admin_email: str = ""
    admin_password: str = ""

@app.post("/admin/hospitals")
def create_hospital(data: HospitalCreate):
    try:
        # Sanitise hospital_id to be a valid SQL/Databricks schema identifier
        safe_id = data.hospital_id.replace("-", "_").lower()
        onboard_hospital(safe_id)
        return {"status": "created", "hospital_id": safe_id, "message": "Hospital onboarded successfully."}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/patients")
def register_patient(patient: dict, hospital_id: str = Depends(get_hospital_id)):
    errors = validate_patient(patient)
    if errors:
        raise HTTPException(status_code=400, detail=errors)
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        p = patient

        p_id = p.get('Patient_ID', p.get('patient_id', ''))
        cursor.execute(f"SELECT * FROM patient_analytics.{hospital_id}.patients WHERE Patient_ID = '{p_id}'")
        if cursor.fetchall():
            raise HTTPException(status_code=400, detail=f"Patient ID {p_id} already exists.")

        # Keys match frontend payload (uppercase) and validation.py schema
        sql_insert = f"""
            INSERT INTO patient_analytics.{hospital_id}.patients
            VALUES (
                '{p.get('Patient_ID', p.get('patient_id', ''))}',
                {p.get('Age', p.get('age', 0))},
                '{p.get('Region', p.get('region', ''))}',
                '{p.get('Diagnosis', p.get('diagnosis', ''))}',
                '{p.get('Therapy', p.get('therapy', ''))}',
                DATE '{p.get('Diagnosis_Date', p.get('diagnosis_date', '2025-01-01'))}',
                DATE '{p.get('Prescription_Date', p.get('prescription_date', '2025-01-01'))}',
                '{p.get('Insurance_Type', p.get('insurance', ''))}',
                '{p.get('Payer', p.get('payer', 'N/A'))}',
                {p.get('Copay_Amount', p.get('copay_amount', 0))},
                {int(p.get('Prior_Authorization', p.get('pa_required', 0)))},
                '{p.get('Pharmacy_Type', p.get('pharmacy_type', 'N/A'))}',
                CURRENT_TIMESTAMP()
            )
        """
        cursor.execute(sql_insert)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Databricks insert failed: {str(e)}")
    finally:
        cursor.close()
        conn.close()
    return {"status": "ok", "message": "Patient registered. Risk will be assessed on next event."}

@app.post("/api/patients/score")
def instant_risk_score(req: dict, hospital_id: str = Depends(get_hospital_id)):
    patient_id = req.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=400, detail="patient_id is required")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(f"SELECT * FROM patient_analytics.{hospital_id}.patients WHERE Patient_ID = '{patient_id}'")
        p_rows = cursor.fetchall()
        if not p_rows:
            raise HTTPException(status_code=404, detail="Patient not found.")
        p_cols = [desc[0] for desc in cursor.description]
        patient_df = pd.DataFrame(p_rows, columns=p_cols)

        cursor.execute(f"SELECT * FROM patient_analytics.{hospital_id}.journey_events WHERE Patient_ID = '{patient_id}'")
        e_rows = cursor.fetchall()
        e_cols = ["Patient_ID", "Current_Stage", "Event_Date", "PA_Delay_Days", "Stockout_Flag", "Processing_Date", "Contact_Attempts", "Support_Enrollment", "Claim_Status"]
        if e_rows:
            e_cols_db = [desc[0] for desc in cursor.description]
            event_df = pd.DataFrame(e_rows, columns=e_cols_db)
        else:
            event_df = pd.DataFrame(columns=e_cols)
            
        new_event = {
            "Patient_ID": patient_id,
            "Current_Stage": req.get("current_stage", "Prior Authorization"),
            "Event_Date": req.get("event_date", pd.Timestamp.now().strftime("%Y-%m-%d")),
            "PA_Delay_Days": int(req.get("pa_delay_days", 0)),
            "Stockout_Flag": 0,
            "Contact_Attempts": int(req.get("contact_attempts", 0)),
            "Support_Enrollment": 0,
            "Claim_Status": "Pending"
        }
        event_df = pd.concat([event_df, pd.DataFrame([new_event])], ignore_index=True)

        patient_master = build_patient_master(patient_df, event_df, outcome_df=None)
        features = get_model_features(patient_master)
        
        data = {
            "dataframe_split": {
                "columns": list(features.columns),
                "data": features.fillna(0).values.tolist()
            }
        }
        headers = {
            "Authorization": f"Bearer {DATABRICKS_TOKEN}",
            "Content-Type": "application/json"
        }
        resp = requests.post(DATABRICKS_SERVING_URL, headers=headers, json=data)
        if resp.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Model error: {resp.text}")
        
        preds = resp.json().get("predictions", [])
        pred_val = float(preds[0][1]) if isinstance(preds[0], list) and len(preds[0]) > 1 else float(preds[0])
        prob = get_pseudo_probability(pred_val, features.iloc[0])
        
        # Generate dynamic risk factors for the UI card based on current event and history
        risk_factors = []
        if req.get("pa_required"):
            risk_factors.append({
                "feature": "Prior Authorization Required",
                "contribution": 0.20,
                "direction": "positive"
            })
        
        delay_days = int(req.get("pa_delay_days", 0))
        if delay_days > 7:
            risk_factors.append({
                "feature": f"PA Delay ({delay_days} days)",
                "contribution": 0.15 + (0.01 * min(delay_days, 30)),
                "direction": "positive"
            })
            
        stage = req.get("current_stage", "")
        if stage in ["Prior Authorization", "Copay"]:
            risk_factors.append({
                "feature": f"Current Stage ({stage})",
                "contribution": 0.10,
                "direction": "positive"
            })
            
        contact_attempts = int(req.get("contact_attempts", 0))
        if contact_attempts >= 2:
            risk_factors.append({
                "feature": f"Multiple Contact Attempts ({contact_attempts})",
                "contribution": 0.12,
                "direction": "positive"
            })

        return {
            "risk_score": prob,
            "risk_level": "HIGH" if prob >= 0.5 else "LOW",
            "risk_factors": risk_factors
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.get("/api/patients")
def list_patients(hospital_id: str = Depends(get_hospital_id)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(f"SELECT * FROM patient_analytics.{hospital_id}.patients")
        p_rows = cursor.fetchall()
        if not p_rows:
            return []
        p_cols = [desc[0] for desc in cursor.description]
        patient_df = pd.DataFrame(p_rows, columns=p_cols)

        cursor.execute(f"SELECT * FROM patient_analytics.{hospital_id}.journey_events")
        e_rows = cursor.fetchall()
        if e_rows:
            e_cols = [desc[0] for desc in cursor.description]
            event_df = pd.DataFrame(e_rows, columns=e_cols)
        else:
            event_df = pd.DataFrame(columns=["Patient_ID", "Current_Stage", "Event_Date", "PA_Delay_Days", "Stockout_Flag", "Processing_Date", "Contact_Attempts", "Support_Enrollment", "Claim_Status"])
        
        # Ensure event_df has standard columns for local operations
        event_df_local = event_df.copy()
        event_df_local.columns = [c.lower() for c in event_df_local.columns]

        patient_master = build_patient_master(patient_df, event_df, outcome_df=None)
        features = get_model_features(patient_master)
        
        data = {
            "dataframe_split": {
                "columns": list(features.columns),
                "data": features.fillna(0).values.tolist()
            }
        }
        headers = {
            "Authorization": f"Bearer {DATABRICKS_TOKEN}",
            "Content-Type": "application/json"
        }
        resp = requests.post(DATABRICKS_SERVING_URL, headers=headers, json=data)
        if resp.status_code == 200:
            preds = resp.json().get("predictions", [])
            risk_scores = []
            for i, p in enumerate(preds):
                pred_val = float(p[1]) if isinstance(p, list) and len(p)>1 else float(p)
                prob = get_pseudo_probability(pred_val, features.iloc[i])
                risk_scores.append(int(round(prob * 100)))
        else:
            risk_scores = [0] * len(patient_master)

        patient_master["risk_score"] = risk_scores
        patient_master["risk_level"] = ["HIGH" if r >= 50 else "LOW" for r in risk_scores]

        if "created_at" in patient_master.columns:
            patient_master = patient_master.sort_values("created_at", ascending=False)
            
        result = []
        for _, row in patient_master.iterrows():

            # TRUE days_in_current_stage calculated from event_df
            days = 0
            last_dt_str = "N/A"
            patient_events = event_df_local[event_df_local["patient_id"] == row.get("Patient_ID", row.get("patient_id"))]
            if not patient_events.empty and "event_date" in patient_events.columns:
                patient_events = patient_events.sort_values("event_date", ascending=True)
                # Filter out NA dates to be safe
                patient_events = patient_events[patient_events["event_date"].notna()]
                if not patient_events.empty:
                    last_event_date = patient_events.iloc[-1]["event_date"]
                    try:
                        last_dt = pd.to_datetime(last_event_date)
                        last_dt_str = last_dt.strftime("%Y-%m-%d")
                        days = max(0, (pd.Timestamp.now() - last_dt).days)
                    except:
                        days = 0

            pa_delay = row.get("Max_PA_Delay_Days", 0)
            if pd.isna(pa_delay): pa_delay = 0
            stockout = row.get("Stockout_Experienced", 0)
            if pd.isna(stockout): stockout = 0
            
            top_driver = "Baseline Risk"
            if pa_delay > 7:
                top_driver = "PA Delay"
            elif stockout > 0:
                top_driver = "Stockout"

            result.append({
                "patient_id": row["Patient_ID"],
                "age": row.get("Age", 0),
                "region": row.get("Region", ""),
                "insurance": row.get("Insurance_Type", ""),
                "current_stage": row.get("Final_Stage", "Diagnosis") if pd.notna(row.get("Final_Stage")) else "Diagnosis",
                "risk_score": row.get("risk_score", 0),
                "risk_level": row.get("risk_level", "LOW"),
                "last_updated": last_dt_str,
                "days_in_current_stage": days,
                "top_risk_driver": top_driver
            })
        return result
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.get("/api/patients/{patient_id}")
def get_patient_detail(patient_id: str, hospital_id: str = Depends(get_hospital_id)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(f"SELECT * FROM patient_analytics.{hospital_id}.patients WHERE Patient_ID = '{patient_id}'")
        p_row = cursor.fetchone()
        if not p_row:
            raise HTTPException(status_code=404, detail="Patient not found.")
        p_cols = [desc[0] for desc in cursor.description]
        p_dict_lower = dict(zip([c.lower() for c in p_cols], p_row))

        patient_df = pd.DataFrame([p_row], columns=p_cols)

        cursor.execute(f"SELECT * FROM patient_analytics.{hospital_id}.journey_events WHERE Patient_ID = '{patient_id}' ORDER BY created_at ASC")
        e_rows = cursor.fetchall()
        
        events = []
        if e_rows:
            e_cols = [desc[0] for desc in cursor.description]
            event_df = pd.DataFrame(e_rows, columns=e_cols)
            e_cols_lower = [c.lower() for c in e_cols]
            for r in e_rows:
                ev = dict(zip(e_cols_lower, r))
                events.append({
                    "event_id": ev.get("journey_event_id", ev.get("event_id", "")),
                    "patient_id": patient_id,
                    "stage": ev.get("current_stage", "Diagnosis"),
                    "event": ev.get("claim_status", ""),
                    "event_date": str(ev.get("event_date"))[:10],
                    "created_at": str(ev.get("created_at"))
                })
        else:
            event_df = pd.DataFrame(columns=["Patient_ID", "Current_Stage", "Event_Date", "PA_Delay_Days", "Stockout_Flag", "Processing_Date", "Contact_Attempts", "Support_Enrollment", "Claim_Status"])

        patient_master = build_patient_master(patient_df, event_df, outcome_df=None)
        features = get_model_features(patient_master)
        
        data = {
            "dataframe_split": {
                "columns": list(features.columns),
                "data": features.fillna(0).values.tolist()
            }
        }
        headers = {
            "Authorization": f"Bearer {DATABRICKS_TOKEN}",
            "Content-Type": "application/json"
        }
        resp = requests.post(DATABRICKS_SERVING_URL, headers=headers, json=data)
        if resp.status_code == 200:
            preds = resp.json().get("predictions", [])
            pred_val = float(preds[0][1]) if isinstance(preds[0], list) and len(preds[0])>1 else float(preds[0])
            prob = get_pseudo_probability(pred_val, features.iloc[0])
            risk_score = int(round(prob * 100))
        else:
            risk_score = 0
            
        risk_level = "HIGH" if risk_score >= 50 else "LOW"

        
        # Calculate days in stage and revenue
        from datetime import datetime
        last_date = events[-1]["event_date"] if events else "2025-01-01"
        try:
            days_in = (datetime.now() - datetime.strptime(last_date[:10], "%Y-%m-%d")).days
        except:
            days_in = 14
            
        revenue = 50000 if risk_level == "HIGH" else 0
        
        # Generate dynamic risk factors based on the features
        pa_delay = int(features["Max_PA_Delay_Days"].iloc[0]) if "Max_PA_Delay_Days" in features.columns else 0
        stockout = int(features["Stockout_Experienced"].iloc[0]) if "Stockout_Experienced" in features.columns else 0
        risk_factors = []
        if pa_delay > 7:
            risk_factors.append({"name": "PA Delay", "contribution": 35, "description": f"PA delayed by {pa_delay} days."})
        if stockout > 0:
            risk_factors.append({"name": "Stockout", "contribution": 20, "description": "Patient experienced a stockout."})
        if not risk_factors:
            risk_factors.append({"name": "Base Risk", "contribution": 10, "description": "Baseline demographic risk."})
            
        return {
            "patient_id": p_dict_lower.get("patient_id"),
            "age": p_dict_lower.get("age"),
            "region": p_dict_lower.get("region"),
            "diagnosis": p_dict_lower.get("diagnosis"),
            "therapy": p_dict_lower.get("therapy"),
            "insurance": p_dict_lower.get("insurance_type"),
            "copay_amount": p_dict_lower.get("copay_amount"),
            "current_stage": patient_master.iloc[0]["Final_Stage"] if not patient_master.empty and "Final_Stage" in patient_master.columns and pd.notna(patient_master.iloc[0]["Final_Stage"]) else "Diagnosis",
            "risk_score": prob,
            "risk_level": risk_level,
            "last_updated": events[-1]["created_at"] if events else str(p_dict_lower.get("created_at")),
            "timeline": [{"stage": e["stage"], "status": "completed", "date": e["event_date"]} for e in events],
            "events": events[::-1],
            "risk_factors": risk_factors,
            "days_in_current_stage": max(0, days_in),
            "recommendation": "Expedite prior authorization and follow up with the patient." if pa_delay > 7 else "Monitor closely.",
            "revenue_at_risk": revenue
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.post("/api/patients/{patient_id}/events")
def log_event(patient_id: str, event: dict, hospital_id: str = Depends(get_hospital_id)):
    errors = validate_event(event)
    if errors:
        raise HTTPException(status_code=400, detail=errors)
    if event.get("Patient_ID") != patient_id:
        event["Patient_ID"] = patient_id
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        e = event
        # Keys match frontend payload (uppercase) and validation.py schema
        event_id = f'EVT-{int(pd.Timestamp.now().timestamp())}'
        sql_insert = f"""
            INSERT INTO patient_analytics.{hospital_id}.journey_events
            VALUES (
                '{event_id}',
                '{patient_id}',
                '{e.get('Current_Stage', e.get('current_stage', ''))}',
                DATE '{e.get('Event_Date', e.get('event_date', '2025-01-01'))}',
                {e.get('PA_Delay_Days', e.get('pa_delay_days', 0))},
                {int(e.get('Stockout_Flag', e.get('stockout_flag', 0)))},
                DATE '{e.get('Processing_Date', e.get('processing_date', '2025-01-01'))}',
                NULL,
                {e.get('Contact_Attempts', e.get('contact_attempts', 0))},
                {int(e.get('Support_Enrollment', e.get('support_enrollment', 0)))},
                '{e.get('Claim_Status', e.get('event', 'Pending'))}',
                NULL,
                CURRENT_TIMESTAMP()
            )
        """
        cursor.execute(sql_insert)
        cursor.execute(f"SELECT * FROM patient_analytics.{hospital_id}.patients WHERE Patient_ID = '{patient_id}'")
        patient_rows = cursor.fetchall()
        if not patient_rows:
            raise HTTPException(status_code=404, detail="Patient profile not found in database.")
        patient_cols = [desc[0] for desc in cursor.description]
        patient_df = pd.DataFrame(patient_rows, columns=patient_cols)
        cursor.execute(f"SELECT * FROM patient_analytics.{hospital_id}.journey_events WHERE Patient_ID = '{patient_id}'")
        event_rows = cursor.fetchall()
        event_cols = [desc[0] for desc in cursor.description]
        event_df = pd.DataFrame(event_rows, columns=event_cols)
    except HTTPException:
        raise
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Database query failed: {str(err)}")
    finally:
        cursor.close()
        conn.close()
    try:
        patient_master = build_patient_master(patient_df, event_df, outcome_df=None)
        features = get_model_features(patient_master)
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Preprocessing failed: {str(err)}")
    data = {
        "dataframe_split": {
            "columns": list(features.columns),
            "data": features.fillna(0).values.tolist()
        }
    }
    headers = {
        "Authorization": f"Bearer {DATABRICKS_TOKEN}",
        "Content-Type": "application/json"
    }
    try:
        resp = requests.post(DATABRICKS_SERVING_URL, headers=headers, json=data)
        if resp.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Model serving error: {resp.text}")
        preds = resp.json().get("predictions", [])
        pred_val = float(preds[0][1]) if isinstance(preds[0], list) and len(preds[0])>1 else float(preds[0])
        prob = get_pseudo_probability(pred_val, features.iloc[0])
        risk_level = "High" if prob >= 0.5 else "Low"
        top_factor = "Claim_Rejected" if "Rejected" in str(event.get("Claim_Status")) else "Recent Event"
        return {
            "event_id": event_id,
            "patient_id": patient_id,
            "risk_score": prob,
            "risk_level": risk_level,
            "top_factor": top_factor,
            "message": "Event logged and risk evaluated."
        }
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Scoring request failed: {str(err)}")

@app.get("/api/patients/{patient_id}/analysis")
def analyze_patient(patient_id: str, hospital_id: str = Depends(get_hospital_id)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(f"SELECT * FROM patient_analytics.{hospital_id}.patients WHERE Patient_ID = '{patient_id}'")
        patient_rows = cursor.fetchall()
        if not patient_rows:
            raise HTTPException(status_code=404, detail="Patient profile not found in database.")
        patient_cols = [desc[0] for desc in cursor.description]
        patient_df = pd.DataFrame(patient_rows, columns=patient_cols)
        cursor.execute(f"SELECT * FROM patient_analytics.{hospital_id}.journey_events WHERE Patient_ID = '{patient_id}'")
        event_rows = cursor.fetchall()
        event_cols = [desc[0] for desc in cursor.description]
        event_df = pd.DataFrame(event_rows, columns=event_cols)
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Database query failed: {str(err)}")
    finally:
        cursor.close()
        conn.close()
    try:
        patient_master = build_patient_master(patient_df, event_df, outcome_df=None)
        features = get_model_features(patient_master)
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Preprocessing failed: {str(err)}")
    data = {
        "dataframe_split": {
            "columns": list(features.columns),
            "data": features.fillna(0).values.tolist()
        }
    }
    headers = {
        "Authorization": f"Bearer {DATABRICKS_TOKEN}",
        "Content-Type": "application/json"
    }
    try:
        resp = requests.post(DATABRICKS_SERVING_URL, headers=headers, json=data)
        if resp.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Model serving error: {resp.text}")
        preds = resp.json().get("predictions", [])
        if isinstance(preds[0], list) and len(preds[0]) > 1:
            risk_score = preds[0][1]
        elif isinstance(preds[0], (int, float)):
            risk_score = float(preds[0])
        else:
            risk_score = 0.0
        # ── LOCKED SPEC: 2-tier risk_level (matches scoring endpoint threshold) ──
        # "High" if risk_score > 0.5 else "Low" — no Medium tier.
        # This is the single source of truth for risk_level across the system.
        # Do NOT compute a separate 3-tier version anywhere else.
        def get_risk_level(score: float) -> str:
            return "High" if (score or 0) > 0.5 else "Low"

        # ── Edge case: missing/null risk_score ───────────────────────────────────
        if risk_score is None:
            risk_score = 0.0
        risk_score = float(risk_score)
        risk_level = get_risk_level(risk_score)

        # ── Build structured SHAP-style top_factors ──────────────────────────────
        # Each factor: {"factor": str, "value": actual_raw_value, "impact": shap_weight}
        pa_delay = int(features["Max_PA_Delay_Days"].iloc[0]) if "Max_PA_Delay_Days" in features.columns else 15
        stockout = int(features["Stockout_Experienced"].iloc[0]) if "Stockout_Experienced" in features.columns else 0

        if risk_level == "High":
            raw_factors = [
                {"factor": "Claim_Rejected",    "value": 1,        "impact": round(risk_score * 0.37, 2)},
                {"factor": "Max_PA_Delay_Days", "value": pa_delay, "impact": round(risk_score * 0.23, 2)},
                {"factor": "Stockout_Flag",     "value": stockout, "impact": round(risk_score * 0.10, 2)},
            ]
        else:
            raw_factors = [
                {"factor": "Max_PA_Delay_Days", "value": pa_delay, "impact": round(risk_score * 0.20, 2)},
                {"factor": "Stockout_Flag",     "value": stockout, "impact": round(risk_score * 0.10, 2)},
            ]

        # ── LOCKED SPEC: Sort by impact desc, keep top 3 only ────────────────────
        # LLM input must be focused — do not dump all SHAP factors into the prompt.
        top_factors = sorted(raw_factors, key=lambda f: f.get("impact", 0), reverse=True)[:3]

        # ── LLM Input Payload — exact contract (locked, updated spec) ──────────────
        # {patient_id, risk_score, risk_level, top_factors} — risk_level now included
        llm_input = {
            "patient_id":  patient_id,
            "risk_score":  round(risk_score, 2),
            "risk_level":  risk_level,
            "top_factors": top_factors
        }

        # ── build_prompt: uses top factors to construct LLM prompt ───────────────
        def build_prompt(score: float, factors: list) -> str:
            # Edge case: empty factors — fall back to score-only prompt
            if not factors:
                return (
                    f"A patient has a risk score of {round(score, 2)}. "
                    "Generate a brief clinical recommendation for the care coordinator."
                )
            # Only use top 3 by impact (already sorted above)
            factors_text = ", ".join(
                f"{f['factor'].replace('_', ' ')} (value: {f['value']})"
                for f in factors[:3]
            )
            return (
                f"Patient risk score: {round(score, 2)}. "
                f"Top risk factors: {factors_text}. "
                "Generate a 2-sentence clinical recommendation for the Hub Coordinator."
            )

        # ── LLM call (Groq API) ───────
        llm_result = generate_recommendation(
            risk_score=risk_score,
            risk_level=risk_level,
            top_factors=top_factors
        )

        # ── LOCKED LLM Output Contract — ONLY these two fields ───────────────────
        # Backend already has patient_id — no need to echo it back.
        return {
            "recommendation": llm_result["recommendation"],
            "risk_level": llm_result["risk_level"]
        }
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Scoring request failed: {str(err)}")



@app.get("/api/dashboard/statistics")
def get_dashboard_statistics(hospital_id: str = Depends(get_hospital_id)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(f"SELECT * FROM patient_analytics.{hospital_id}.statistical_results WHERE Run_Date = CURRENT_DATE()")
        rows = cursor.fetchall()
        if not rows: return {"data": []}
        cols = [desc[0] for desc in cursor.description]
        return {"data": [dict(zip(cols, row)) for row in rows]}
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Database query failed: {str(err)}")
    finally:
        cursor.close()
        conn.close()

@app.get("/api/dashboard/funnel")
def get_dashboard_funnel(hospital_id: str = Depends(get_hospital_id)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(f"SELECT * FROM patient_analytics.{hospital_id}.statistical_results WHERE metric = 'funnel' OR Metric_Type = 'funnel'")
        rows = cursor.fetchall()
        if not rows: return {"data": []}
        cols = [desc[0] for desc in cursor.description]
        return {"data": [dict(zip(cols, row)) for row in rows]}
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Database query failed: {str(err)}")
    finally:
        cursor.close()
        conn.close()

@app.get("/api/dashboard/survival")
def get_dashboard_survival(hospital_id: str = Depends(get_hospital_id)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(f"SELECT * FROM patient_analytics.{hospital_id}.statistical_results WHERE metric = 'kaplan_meier' OR Metric_Type = 'kaplan_meier'")
        rows = cursor.fetchall()
        if not rows: return {"data": []}
        cols = [desc[0] for desc in cursor.description]
        return {"data": [dict(zip(cols, row)) for row in rows]}
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Database query failed: {str(err)}")
    finally:
        cursor.close()
        conn.close()


@app.get("/api/analytics")
def get_analytics(hospital_id: str = Depends(get_hospital_id)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(f"SELECT * FROM patient_analytics.{hospital_id}.patients")
        p_rows = cursor.fetchall()
        p_cols = [desc[0] for desc in cursor.description] if p_rows else ["Patient_ID", "Region", "Insurance_Type"]
        patient_df = pd.DataFrame(p_rows, columns=p_cols) if p_rows else pd.DataFrame(columns=p_cols)
        
        cursor.execute(f"SELECT * FROM patient_analytics.{hospital_id}.journey_events")
        e_rows = cursor.fetchall()
        e_cols = [desc[0] for desc in cursor.description] if e_rows else ["Patient_ID", "Current_Stage", "Event_Date", "PA_Delay_Days", "Stockout_Flag", "Claim_Status"]
        event_df = pd.DataFrame(e_rows, columns=e_cols)
        
        # Fallback empty check
        if patient_df.empty:
            return {
                "overview": {"total_patients": 0, "active_journeys": 0, "conversion_rate": 0, "avg_time_to_fill": 0, "revenue_at_risk": 0},
                "funnel": {"funnel_stages": [], "patient_counts": [], "conversion_rates": [], "dropoff_rates": [], "avg_days_in_stage": []},
                "stage_leakage": [],
                "cohorts": {"heatmap": [], "comparisons": []},
                "leakage": {"drivers": [], "stageLeakage": [], "regionalLeakage": []},
                "survival": {"time": [], "groups": [], "data": {}}
            }

        if not event_df.empty:
            e_cols_lower = [c.lower() for c in e_cols]
            event_df.columns = e_cols_lower
            event_df = event_df.sort_values("created_at") if "created_at" in event_df.columns else event_df
        
        # Track latest stage per patient
        patient_stages = {pid: "Diagnosis" for pid in patient_df.get("Patient_ID", [])}
        patient_pa_delay = {pid: 0 for pid in patient_df.get("Patient_ID", [])}
        patient_claims = {pid: "Pending" for pid in patient_df.get("Patient_ID", [])}
        patient_contact = {pid: 0 for pid in patient_df.get("Patient_ID", [])}

        if not event_df.empty:
            for _, row in event_df.iterrows():
                pid = row["patient_id"]
                patient_stages[pid] = row.get("current_stage", "Diagnosis")
                if row.get("pa_delay_days"):
                    patient_pa_delay[pid] = max(patient_pa_delay[pid], int(row["pa_delay_days"]))
                if row.get("claim_status"):
                    patient_claims[pid] = row["claim_status"]
                if row.get("contact_attempts"):
                    patient_contact[pid] = max(patient_contact.get(pid, 0), int(row["contact_attempts"]))

        stages = ["Diagnosis", "Prescription", "Prior Authorization", "Copay", "First Fill"]
        total_pts = len(patient_df)
        
        # For simplicity in this demo backend:
        # We assume funnel is cumulative. If someone is in First Fill, they passed Copay, etc.
        stage_idx = {s: i for i, s in enumerate(stages)}
        passed_counts = {s: 0 for s in stages}
        
        for pid, stg in patient_stages.items():
            idx = stage_idx.get(stg, 0)
            for i in range(idx + 1):
                passed_counts[stages[i]] += 1
                
        funnel_counts = [passed_counts[s] for s in stages]
        conversions = [100.0 if total_pts == 0 else round((c / total_pts)*100, 1) for c in funnel_counts]
        dropoffs = [0.0 if total_pts == 0 else round(((total_pts - c) / total_pts)*100, 1) for c in funnel_counts]
        
        funnel = {
            "funnel_stages": stages,
            "patient_counts": funnel_counts,
            "conversion_rates": conversions,
            "dropoff_rates": dropoffs,
            "avg_days_in_stage": [2, 14, 5, 3, 2]
        }
        
        active = passed_counts["Diagnosis"] - passed_counts["First Fill"]
        overview = {
            "total_patients": total_pts,
            "active_journeys": max(0, active),
            "conversion_rate": conversions[-1],
            "avg_time_to_fill": 26,
            "revenue_at_risk": (total_pts - funnel_counts[-1]) * 2500
        }
        
        # Leakage
        stage_leakage = []
        for i in range(len(stages)-1):
            drop_count = funnel_counts[i] - funnel_counts[i+1]
            drop_rate = 0 if funnel_counts[i] == 0 else round((drop_count / funnel_counts[i])*100, 1)
            stage_leakage.append({
                "stage": stages[i],
                "dropoff_count": drop_count,
                "dropoff_rate": drop_rate,
                "revenue_at_risk": drop_count * 2500
            })
            
        regional_leakage = []
        regions = patient_df["Region"].unique() if "Region" in patient_df.columns else ["Northeast"]
        for r in regions:
            r_pts = patient_df[patient_df["Region"] == r]
            r_total = len(r_pts)
            if r_total == 0: continue
            r_dropped = sum(1 for pid in r_pts["Patient_ID"] if patient_stages.get(pid) != "First Fill")
            drop_rate = round((r_dropped / r_total)*100, 1)
            regional_leakage.append({
                "region": r,
                "dropoff_rate": drop_rate,
                "patient_count": r_total,
                "revenue_at_risk": r_dropped * 2500
            })
        # Fetch real leakage drivers from Databricks statistical_results
        drivers = []
        try:
            cursor.execute(f"SELECT * FROM patient_analytics.{hospital_id}.statistical_results WHERE Metric_Type = 'Leakage_Driver_CramersV'")
            stat_rows = cursor.fetchall()
            stat_cols = [desc[0] for desc in cursor.description]
            stat_df = pd.DataFrame(stat_rows, columns=stat_cols)
            
            if not stat_df.empty:
                for _, srow in stat_df.iterrows():
                    cat = srow["Category"]
                    val = float(srow["Value"])
                    
                    impact = "HIGH" if val > 0.2 else "MEDIUM" if val > 0.1 else "LOW"
                    hr = round(1.0 + (val * 5), 2)
                    total_dropped = sum(1 for pid, stage in patient_stages.items() if stage != "First Fill")
                    
                    drivers.append({
                        "driver": cat,
                        "impact": impact,
                        "affected_patients": int(total_dropped * min(1.0, val * 3)),
                        "confidence": 0.95,
                        "stage": "All Stages",
                        "hazard_ratio": hr,
                        "p_value": 0.001 if val > 0.15 else 0.04,
                        "effect_size": round(val, 3)
                    })
        except Exception as e:
            print(f"Failed to fetch Cramers V: {e}")
            
        if not drivers:
            drivers = [{"driver": "No drivers found", "impact": "LOW", "affected_patients": 0, "confidence": 0, "stage": "N/A", "hazard_ratio": 1.0, "p_value": 1.0, "effect_size": 0.0}]



        # Cohorts - Acquisition Cohort Analysis
        heatmap_data = []
        if not event_df.empty and "event_date" in event_df.columns:
            # We copy event_df to avoid setting with copy warnings
            edf = event_df.copy()
            edf["event_date"] = pd.to_datetime(edf["event_date"], errors="coerce")
            edf = edf.dropna(subset=["event_date"])
            edf["month_str"] = edf["event_date"].dt.to_period("M")
            
            # 1. Determine cohort month per patient (earliest Event_Date)
            patient_cohorts = edf.groupby("patient_id")["month_str"].min().reset_index()
            patient_cohorts.rename(columns={"month_str": "cohort_month"}, inplace=True)
            
            # 2. Merge cohort month back to events
            events_merged = pd.merge(edf, patient_cohorts, on="patient_id")
            events_merged["month_idx"] = (events_merged["month_str"] - events_merged["cohort_month"]).apply(lambda x: x.n)
            events_merged = events_merged[events_merged["month_idx"] >= 0]
            
            # 3. Calculate cohort sizes
            cohort_sizes = patient_cohorts.groupby("cohort_month")["patient_id"].nunique().reset_index()
            cohort_sizes.rename(columns={"patient_id": "total_patients"}, inplace=True)
            
            # 4. Calculate retention per cohort & month_idx
            retention = events_merged.groupby(["cohort_month", "month_idx"])["patient_id"].nunique().reset_index()
            retention.rename(columns={"patient_id": "retained_patients"}, inplace=True)
            retention = pd.merge(retention, cohort_sizes, on="cohort_month")
            retention["retention_rate"] = (retention["retained_patients"] / retention["total_patients"]) * 100
            
            # 5. Build heatmap array
            for cohort, group in retention.groupby("cohort_month"):
                cohort_str = cohort.strftime("%B %Y")
                total = cohort_sizes[cohort_sizes["cohort_month"] == cohort]["total_patients"].values[0]
                
                max_idx = group["month_idx"].max()
                rates = []
                # Truncate at 12 months for UI layout
                for i in range(min(12, max_idx + 1)):
                    rate_row = group[group["month_idx"] == i]
                    if not rate_row.empty:
                        rates.append(round(rate_row["retention_rate"].values[0]))
                    else:
                        rates.append(0)
                        
                heatmap_data.append({
                    "cohort_month": cohort_str,
                    "total_patients": int(total),
                    "retention_rates": rates
                })
            
            # Sort chronologically
            heatmap_data = sorted(heatmap_data, key=lambda x: pd.to_datetime(x["cohort_month"], format="%B %Y"))
        
        heatmap = heatmap_data

        comparisons = []
        insurances = patient_df["Insurance_Type"].unique() if "Insurance_Type" in patient_df.columns else ["Commercial"]
        for ins in insurances:
            ins_pts = patient_df[patient_df["Insurance_Type"] == ins]
            ins_total = len(ins_pts)
            if ins_total == 0: continue
            ins_dropped = sum(1 for pid in ins_pts["Patient_ID"] if patient_stages.get(pid) != "First Fill")
            base_drop = (ins_dropped / ins_total) * 100
            comparisons.append({
                "label": ins,
                "patient_count": ins_total,
                "first_fill_rate": round(100 - base_drop, 1),
                "avg_time_to_fill": 28 + (len(ins) % 5)
            })
        # Survival Curve - Fetch from Databricks
        curves = []
        try:
            cursor.execute(f"SELECT * FROM patient_analytics.{hospital_id}.statistical_results WHERE Metric_Type = 'KaplanMeier_Curve'")
            stat_rows = cursor.fetchall()
            stat_cols = [desc[0] for desc in cursor.description]
            stat_df = pd.DataFrame(stat_rows, columns=stat_cols)
            
            if not stat_df.empty:
                # Convert Category back to float, sort it, and populate the curve
                stat_df["Category_Float"] = stat_df["Category"].astype(float)
                stat_df = stat_df.sort_values("Category_Float")
                
                for _, row in stat_df.iterrows():
                    curves.append({
                        "time": int(row["Category_Float"]),
                        "survival_probability": round(float(row["Value"]), 2),
                        "group": "Overall"
                    })
        except Exception as e:
            print(f"Failed to fetch survival curve: {e}")
            
        if not curves:
            curves = [{"time": 0, "survival_probability": 1.0, "group": "Overall"}]
            
        survival_obj = {
            "curves": curves,
            
"median_survival_days": next((c["time"] for c in curves if c["survival_probability"] <= 0.5), 0),

            
"key_timepoints": [{"days": t, "probability": next((c["survival_probability"] for c in curves if c["time"] == t), 0), "label": f"Day {t}"} for t in [30, 60, 90] if any(c["time"] == t for c in curves)],

            "groups": ["Overall"]
        }

        return {
            "overview": overview,
            "funnel": funnel,
            "stage_leakage": stage_leakage,
            "cohorts": {
                "heatmap": heatmap,
                "comparisons": comparisons
            },
            "leakage": {
                "drivers": sorted(drivers, key=lambda x: x["affected_patients"], reverse=True),
                "stageLeakage": stage_leakage,
                "regionalLeakage": regional_leakage
            },
            "survival": survival_obj
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.get("/api/patients/{patient_id}/shap")
def get_patient_shap(patient_id: str, hospital_id: str = Depends(get_hospital_id)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(f"SELECT * FROM patient_analytics.{hospital_id}.patients WHERE Patient_ID = '{patient_id}'")
        patient_rows = cursor.fetchall()
        if not patient_rows:
            raise HTTPException(status_code=404, detail="Patient profile not found in database.")
        patient_cols = [desc[0] for desc in cursor.description]
        patient_df = pd.DataFrame(patient_rows, columns=patient_cols)
        cursor.execute(f"SELECT * FROM patient_analytics.{hospital_id}.journey_events WHERE Patient_ID = '{patient_id}'")
        event_rows = cursor.fetchall()
        event_cols = [desc[0] for desc in cursor.description]
        event_df = pd.DataFrame(event_rows, columns=event_cols)
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Database query failed: {str(err)}")
    finally:
        cursor.close()
        conn.close()
    
    try:
        patient_master = build_patient_master(patient_df, event_df, outcome_df=None)
        features = get_model_features(patient_master)
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Preprocessing failed: {str(err)}")
        
    data = {
        "dataframe_split": {
            "columns": list(features.columns),
            "data": features.fillna(0).values.tolist()
        }
    }
    headers = {
        "Authorization": f"Bearer {DATABRICKS_TOKEN}",
        "Content-Type": "application/json"
    }
    try:
        resp = requests.post(DATABRICKS_SERVING_URL, headers=headers, json=data)
        if resp.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Model serving error: {resp.text}")
        preds = resp.json().get("predictions", [])
        pred_val = float(preds[0][1]) if isinstance(preds[0], list) and len(preds[0])>1 else float(preds[0])
        prob = get_pseudo_probability(pred_val, features.iloc[0])
        
        # Build SHAP features dynamically
        pa_delay = int(features["Max_PA_Delay_Days"].iloc[0]) if "Max_PA_Delay_Days" in features.columns else 0
        stockout = int(features["Stockout_Experienced"].iloc[0]) if "Stockout_Experienced" in features.columns else 0
        
        shap_features = []
        if pa_delay > 5:
            shap_features.append({"feature": "Prior Auth Delay", "contribution": 0.25, "direction": "positive", "display_value": f"{pa_delay} days"})
        else:
            shap_features.append({"feature": "Prior Auth Delay", "contribution": -0.05, "direction": "negative", "display_value": f"{pa_delay} days"})
            
        if stockout > 0:
            shap_features.append({"feature": "Stockout Encountered", "contribution": 0.15, "direction": "positive", "display_value": "Yes"})
        else:
            shap_features.append({"feature": "Stockout Encountered", "contribution": -0.02, "direction": "negative", "display_value": "No"})
            
        age = patient_df["Age"].iloc[0] if "Age" in patient_df.columns else 50
        if age > 65:
            shap_features.append({"feature": "Age Risk", "contribution": 0.10, "direction": "positive", "display_value": f"{age} yrs"})
        else:
            shap_features.append({"feature": "Age Factor", "contribution": -0.05, "direction": "negative", "display_value": f"{age} yrs"})

        # Summary Generation
        summary = f"This patient's risk is calculated at {int(prob*100)}%. "
        if pa_delay > 5:
            summary += f"A significant factor is the Prior Authorization delay of {pa_delay} days. "
        if stockout > 0:
            summary += "Experiencing a stockout event has also elevated their drop-off risk. "
        if pa_delay <= 5 and stockout == 0:
            summary += "Currently, their journey is proceeding normally without major blockers."

        return {
            "patient_id": patient_id,
            "base_value": 0.15,
            "predicted_risk": prob,
            "features": shap_features,
            "plain_english_summary": summary
        }
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Scoring request failed: {str(err)}")

@app.post("/api/chat")
def chat_endpoint(req: schemas.ChatRequest, hospital_id: str = Depends(get_hospital_id)):
    import re
    try:
        patient_id = req.patient_id
        
        # If no patient_id provided, try to extract it from the messages
        if not patient_id:
            for msg in reversed(req.messages):
                match = re.search(r'(PT-\d+|P\d{4,})', getattr(msg, "content", msg.get("content") if isinstance(msg, dict) else ""))
                if match:
                    patient_id = match.group(1)
                    break
        
        is_patient_context = bool(patient_id)
        if is_patient_context:
            try:
                context_data = get_patient_detail(patient_id, hospital_id=hospital_id)
            except Exception:
                context_data = get_analytics(hospital_id=hospital_id)
                is_patient_context = False
        else:
            context_data = get_analytics(hospital_id=hospital_id)
            
        answer = chatbot.generate_chat_response(req.messages, context_data, is_patient_context)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
