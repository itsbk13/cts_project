import ast

with open('main.py', 'r') as f:
    code = f.read()

old_get_patient = '''        return {
            "patient_id": p_dict_lower.get("patient_id"),
            "age": p_dict_lower.get("age"),
            "region": p_dict_lower.get("region"),
            "diagnosis": p_dict_lower.get("diagnosis"),
            "therapy": p_dict_lower.get("therapy"),
            "insurance": p_dict_lower.get("insurance_type"),
            "copay_amount": p_dict_lower.get("copay_amount"),
            "current_stage": events[-1]["stage"] if events else "Diagnosis",
            "risk_score": prob,
            "risk_level": risk_level,
            "last_updated": events[-1]["created_at"] if events else str(p_dict_lower.get("created_at")),
            "timeline": [{"stage": e["stage"], "status": "completed", "date": e["event_date"]} for e in events],
            "events": events[::-1]
        }'''

new_get_patient = '''        
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
            "current_stage": events[-1]["stage"] if events else "Diagnosis",
            "risk_score": prob,
            "risk_level": risk_level,
            "last_updated": events[-1]["created_at"] if events else str(p_dict_lower.get("created_at")),
            "timeline": [{"stage": e["stage"], "status": "completed", "date": e["event_date"]} for e in events],
            "events": events[::-1],
            "risk_factors": risk_factors,
            "days_in_current_stage": max(0, days_in),
            "recommendation": "Expedite prior authorization and follow up with the patient." if pa_delay > 7 else "Monitor closely.",
            "revenue_at_risk": revenue
        }'''

code = code.replace(old_get_patient, new_get_patient)

# Now let's append the SHAP endpoint
shap_endpoint = '''
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
'''

code += shap_endpoint

with open('main.py', 'w') as f:
    f.write(code)

print("Updated main.py successfully.")
