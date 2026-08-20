import re

with open('main.py', 'r', encoding='utf-8') as f:
    code = f.read()

# Add get_pseudo_probability helper
helper = '''
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
'''

if 'def get_pseudo_probability' not in code:
    code = code.replace('DATABRICKS_SERVING_URL     = os.getenv("DATABRICKS_SERVING_URL")', 'DATABRICKS_SERVING_URL     = os.getenv("DATABRICKS_SERVING_URL")\n' + helper)

# Patch list_patients
list_patients_new = '''def list_patients(hospital_id: str = Depends(get_hospital_id)):
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
            result.append({
                "patient_id": row["Patient_ID"],
                "age": row.get("Age", 0),
                "region": row.get("Region", ""),
                "insurance": row.get("Insurance_Type", ""),
                "current_stage": row.get("Final_Stage", "Diagnosis") if pd.notna(row.get("Final_Stage")) else "Diagnosis",
                "risk_score": row.get("risk_score", 0),
                "risk_level": row.get("risk_level", "LOW"),
                "last_updated": str(row.get("created_at", ""))[:10] if pd.notna(row.get("created_at")) else "N/A"
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()'''

# Patch get_patient_detail
get_patient_detail_new = '''def get_patient_detail(patient_id: str, hospital_id: str = Depends(get_hospital_id)):
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

        return {
            "patient_id": p_dict_lower.get("patient_id"),
            "age": p_dict_lower.get("age"),
            "region": p_dict_lower.get("region"),
            "diagnosis": p_dict_lower.get("diagnosis"),
            "therapy": p_dict_lower.get("therapy"),
            "insurance": p_dict_lower.get("insurance_type"),
            "copay_amount": p_dict_lower.get("copay_amount"),
            "current_stage": events[-1]["stage"] if events else "Diagnosis",
            "risk_score": risk_score,
            "risk_level": risk_level,
            "last_updated": events[-1]["created_at"] if events else str(p_dict_lower.get("created_at")),
            "timeline": [{"stage": e["stage"], "status": "completed", "date": e["event_date"]} for e in events],
            "events": events[::-1]
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()'''

# Patch instant_risk_score
instant_risk_score_new = '''@app.post("/api/patients/score")
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
        
        return {
            "risk_score": prob,
            "risk_level": "HIGH" if prob >= 0.5 else "LOW"
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()'''

pattern_list = re.compile(r'def list_patients\(.*?\):.*?finally:\n\s+cursor\.close\(\)\n\s+conn\.close\(\)', re.DOTALL)
code = pattern_list.sub(list_patients_new, code)

pattern_detail = re.compile(r'def get_patient_detail\(.*?\):.*?finally:\n\s+cursor\.close\(\)\n\s+conn\.close\(\)', re.DOTALL)
code = pattern_detail.sub(get_patient_detail_new, code)

pattern_score = re.compile(r'@app\.post\("/api/patients/score"\)\ndef instant_risk_score\(.*?\):.*?except Exception as e:\n\s+if isinstance\(e, HTTPException\):\n\s+raise\n\s+raise HTTPException\(status_code=500, detail=str\(e\)\)\n\s+finally:\n\s+cursor\.close\(\)\n\s+conn\.close\(\)', re.DOTALL)
code = pattern_score.sub(instant_risk_score_new, code)

# ALSO update log_event where we return the risk_score!
# Just do a simple replace inside log_event.
log_event_replace = '''preds = resp.json().get("predictions", [])
        pred_val = float(preds[0][1]) if isinstance(preds[0], list) and len(preds[0])>1 else float(preds[0])
        prob = get_pseudo_probability(pred_val, features.iloc[0])
        risk_level = "High" if prob >= 0.5 else "Low"'''
code = re.compile(r'preds = resp\.json\(\)\.get\("predictions", \[\]\)\n\s+if isinstance\(preds\[0\], list\).*?risk_level = "High" if risk_score > 0\.5 else "Low"', re.DOTALL).sub(log_event_replace, code)

# Fix the return dict in log_event to use prob instead of risk_score
code = code.replace('"risk_score": risk_score,', '"risk_score": prob,')


with open('main.py', 'w', encoding='utf-8') as f:
    f.write(code)

print('Patch applied successfully.')
