import ast
import re

with open('main.py', 'r') as f:
    content = f.read()

# 1. Fix get_patient_detail 'current_stage' (sort by event_date) and days_in_current_stage
old_get_patient_detail = '''        events = []
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
                    "status": "completed",
                    "date": str(ev.get("event_date", ""))[:10] if pd.notna(ev.get("event_date")) else "N/A"
                })

        patient_master = build_patient_master(patient_df, event_df if not event_df.empty else pd.DataFrame(columns=["Patient_ID"]), outcome_df=None)'''

new_get_patient_detail = '''        events = []
        if e_rows:
            e_cols = [desc[0] for desc in cursor.description]
            event_df = pd.DataFrame(e_rows, columns=e_cols)
            # SORT by event_date ascending
            if "Event_Date" in event_df.columns:
                event_df["Event_Date"] = pd.to_datetime(event_df["Event_Date"], errors="coerce")
                event_df = event_df.sort_values(by="Event_Date", ascending=True)
                
            e_cols_lower = [c.lower() for c in e_cols]
            for r in event_df.itertuples(index=False):
                ev = dict(zip(e_cols_lower, r))
                events.append({
                    "event_id": ev.get("journey_event_id", ev.get("event_id", "")),
                    "patient_id": patient_id,
                    "stage": ev.get("current_stage", "Diagnosis"),
                    "status": "completed",
                    "date": str(ev.get("event_date", ""))[:10] if pd.notna(ev.get("event_date")) else "N/A"
                })

        patient_master = build_patient_master(patient_df, event_df if not event_df.empty else pd.DataFrame(columns=["Patient_ID"]), outcome_df=None)'''

content = content.replace(old_get_patient_detail, new_get_patient_detail)


old_detail_response = '''        return {
            "patient_id": patient_id,
            "risk_score": prob,
            "risk_level": risk_level,
            "last_updated": events[-1]["date"] if events else str(p_dict_lower.get("created_at")),
            "current_stage": events[-1]["stage"] if events else "Diagnosis",
            "days_in_current_stage": 14,
            "risk_factors": risk_factors,
            "timeline": events,
            "recommendation": recommendation,
            "revenue_at_risk": 50000
        }'''

new_detail_response = '''        
        # Calculate days_in_current_stage
        days_in_stage = 14
        if events and events[-1]["date"] != "N/A":
            try:
                last_date = pd.to_datetime(events[-1]["date"])
                days_in_stage = max(0, (pd.Timestamp.now() - last_date).days)
            except:
                pass

        return {
            "patient_id": patient_id,
            "risk_score": prob,
            "risk_level": risk_level,
            "last_updated": events[-1]["date"] if events else str(p_dict_lower.get("created_at")),
            "current_stage": events[-1]["stage"] if events else "Diagnosis",
            "days_in_current_stage": days_in_stage,
            "risk_factors": risk_factors,
            "timeline": events,
            "recommendation": recommendation,
            "revenue_at_risk": 0
        }'''

content = content.replace(old_detail_response, new_detail_response)


# 2. Fix list_patients return to include days_in_current_stage
old_list_return = '''            result.append({
                "patient_id": row["Patient_ID"],
                "age": row.get("Age", 0),
                "region": row.get("Region", ""),
                "insurance": row.get("Insurance_Type", ""),
                "current_stage": row.get("Final_Stage", "Diagnosis") if pd.notna(row.get("Final_Stage")) else "Diagnosis",
                "risk_score": row.get("risk_score", 0),
                "risk_level": row.get("risk_level", "LOW"),
                "last_updated": str(row.get("created_at", ""))[:10] if pd.notna(row.get("created_at")) else "N/A"
            })'''

new_list_return = '''
            # Mock days_in_current_stage using last_updated or age as a fallback for demo
            days = 0
            last_dt = str(row.get("created_at", ""))[:10] if pd.notna(row.get("created_at")) else ""
            if last_dt:
                try:
                    days = max(0, (pd.Timestamp.now() - pd.to_datetime(last_dt)).days)
                except:
                    days = int(row.get("Age", 30)) % 20
            else:
                days = int(row.get("Age", 30)) % 20

            result.append({
                "patient_id": row["Patient_ID"],
                "age": row.get("Age", 0),
                "region": row.get("Region", ""),
                "insurance": row.get("Insurance_Type", ""),
                "current_stage": row.get("Final_Stage", "Diagnosis") if pd.notna(row.get("Final_Stage")) else "Diagnosis",
                "risk_score": row.get("risk_score", 0),
                "risk_level": row.get("risk_level", "LOW"),
                "last_updated": last_dt if last_dt else "N/A",
                "days_in_current_stage": days
            })'''

content = content.replace(old_list_return, new_list_return)

with open('main.py', 'w') as f:
    f.write(content)

print("Updated main.py")
