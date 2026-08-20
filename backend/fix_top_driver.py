import os
import re

with open('main.py', 'r') as f:
    content = f.read()

old_loop = '''        for _, row in patient_master.iterrows():

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

new_loop = '''        for _, row in patient_master.iterrows():

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

            pa_delay = row.get("PA_Delay_Days", 0)
            if pd.isna(pa_delay): pa_delay = 0
            stockout = row.get("Stockout_Flag", 0)
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
                "last_updated": last_dt if last_dt else "N/A",
                "days_in_current_stage": days,
                "top_risk_driver": top_driver
            })'''

content = content.replace(old_loop, new_loop)

with open('main.py', 'w') as f:
    f.write(content)

print("Updated list_patients to return top_risk_driver")
