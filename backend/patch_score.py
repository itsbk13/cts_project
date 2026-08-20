import re

with open('main.py', 'r', encoding='utf-8') as f:
    code = f.read()

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
        risk_score = float(preds[0][1]) if isinstance(preds[0], list) and len(preds[0]) > 1 else float(preds[0])
        risk_level = "HIGH" if risk_score > 0.5 else "LOW"
        
        return {
            "risk_score": risk_score,
            "risk_level": risk_level
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()'''

pattern = re.compile(r'@app\.post\("/api/patients/score"\)\ndef instant_risk_score\(.*?\):.*?except Exception as e:\n\s+raise HTTPException\(status_code=500, detail=str\(e\)\)', re.DOTALL)
code = pattern.sub(instant_risk_score_new, code)

with open('main.py', 'w', encoding='utf-8') as f:
    f.write(code)

print('Patch applied successfully.')
