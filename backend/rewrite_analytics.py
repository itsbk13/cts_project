import re

with open('main.py', 'r') as f:
    content = f.read()

new_get_analytics = '''@app.get("/api/analytics")
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
            
        drivers = [
            {"rank": 1, "factor": "Prior Auth Delay > 7 Days", "description": "PA processing delayed beyond clinical window", "impact": "High", "affected_patients": sum(1 for pid, d in patient_pa_delay.items() if d > 7)},
            {"rank": 2, "factor": "Claim Rejections", "description": "Initial claims rejected requiring appeals", "impact": "High", "affected_patients": sum(1 for pid, c in patient_claims.items() if c == 'Rejected')},
            {"rank": 3, "factor": "Patient Unreachable", "description": "Failed to contact after 3+ attempts", "impact": "Medium", "affected_patients": sum(1 for pid, a in patient_contact.items() if a >= 3)}
        ]

        # Cohorts
        heatmap = []
        for r in regions:
            r_total = len(patient_df[patient_df["Region"] == r])
            r_dropped = sum(1 for pid in patient_df[patient_df["Region"] == r]["Patient_ID"] if patient_stages.get(pid) != "First Fill")
            base_drop = (r_dropped / r_total) * 100 if r_total else 0
            heatmap.append({
                "cohort": "Q3 2026",
                "region": r,
                "size": r_total,
                "month1": min(100, round(100 - (base_drop * 0.4), 1)),
                "month2": min(100, round(100 - (base_drop * 0.7), 1)),
                "month3": min(100, round(100 - base_drop, 1))
            })
            
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
                "values": [100, round(100 - (base_drop*0.3), 1), round(100 - (base_drop*0.6), 1), round(100 - (base_drop*0.8), 1), round(100 - base_drop, 1)]
            })

        # Survival
        time_points = [0, 15, 30, 45, 60, 90]
        survival_groups = ["Overall"] + list(insurances)
        survival_data = {"Overall": []}
        
        overall_dropped = total_pts - passed_counts["First Fill"]
        overall_drop_rate = (overall_dropped / total_pts) if total_pts else 0
        for i, t in enumerate(time_points):
            # Model a typical decay curve based on actual drop rate
            surv = 100 - (overall_drop_rate * 100 * (1 - (0.9 ** i)))
            survival_data["Overall"].append(round(surv, 1))
            
        for ins in insurances:
            ins_pts = patient_df[patient_df["Insurance_Type"] == ins]
            ins_total = len(ins_pts)
            ins_dropped = sum(1 for pid in ins_pts["Patient_ID"] if patient_stages.get(pid) != "First Fill")
            ins_drop_rate = (ins_dropped / ins_total) if ins_total else 0
            survival_data[ins] = []
            for i, t in enumerate(time_points):
                surv = 100 - (ins_drop_rate * 100 * (1 - (0.85 ** i)))
                survival_data[ins].append(round(surv, 1))

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
            "survival": {
                "time": time_points,
                "groups": survival_groups,
                "data": survival_data
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()
'''

# Find the block and replace it
start_idx = content.find('@app.get("/api/analytics")')
# The block ends before the next endpoint or the end of the file
# No other endpoints follow get_analytics in main.py, it's the last one.
content = content[:start_idx] + new_get_analytics

with open('main.py', 'w') as f:
    f.write(content)

print("Updated get_analytics successfully.")
