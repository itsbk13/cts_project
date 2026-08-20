import os

with open('main.py', 'r') as f:
    content = f.read()

# Fix event_df column case issues in list_patients
# We can just lowercase all columns of event_df before querying it in list_patients!

old_code = '''        if e_rows:
            e_cols = [desc[0] for desc in cursor.description]
            event_df = pd.DataFrame(e_rows, columns=e_cols)
        else:
            event_df = pd.DataFrame(columns=["Patient_ID", "Current_Stage", "Event_Date", "PA_Delay_Days", "Stockout_Flag", "Processing_Date", "Contact_Attempts", "Support_Enrollment", "Claim_Status"])

        patient_master = build_patient_master(patient_df, event_df, outcome_df=None)'''

new_code = '''        if e_rows:
            e_cols = [desc[0] for desc in cursor.description]
            event_df = pd.DataFrame(e_rows, columns=e_cols)
        else:
            event_df = pd.DataFrame(columns=["Patient_ID", "Current_Stage", "Event_Date", "PA_Delay_Days", "Stockout_Flag", "Processing_Date", "Contact_Attempts", "Support_Enrollment", "Claim_Status"])
        
        # Ensure event_df has standard columns for local operations
        event_df_local = event_df.copy()
        event_df_local.columns = [c.lower() for c in event_df_local.columns]

        patient_master = build_patient_master(patient_df, event_df, outcome_df=None)'''

content = content.replace(old_code, new_code)

old_loop = '''            # TRUE days_in_current_stage calculated from event_df
            days = 0
            patient_events = event_df[event_df["Patient_ID"] == row["Patient_ID"]]
            if not patient_events.empty and "Event_Date" in patient_events.columns:
                patient_events = patient_events.sort_values("Event_Date", ascending=True)
                # Filter out NA dates to be safe
                patient_events = patient_events[patient_events["Event_Date"].notna()]
                if not patient_events.empty:
                    last_event_date = patient_events.iloc[-1]["Event_Date"]'''

new_loop = '''            # TRUE days_in_current_stage calculated from event_df
            days = 0
            patient_events = event_df_local[event_df_local["patient_id"] == row.get("Patient_ID", row.get("patient_id"))]
            if not patient_events.empty and "event_date" in patient_events.columns:
                patient_events = patient_events.sort_values("event_date", ascending=True)
                # Filter out NA dates to be safe
                patient_events = patient_events[patient_events["event_date"].notna()]
                if not patient_events.empty:
                    last_event_date = patient_events.iloc[-1]["event_date"]'''

content = content.replace(old_loop, new_loop)

with open('main.py', 'w') as f:
    f.write(content)

print("Fixed case insensitivity in list_patients")
