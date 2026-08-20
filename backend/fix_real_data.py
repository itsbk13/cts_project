import pandas as pd

with open('main.py', 'r') as f:
    content = f.read()

# I will rewrite the loop in list_patients to calculate TRUE days in stage
old_loop_code = '''            # Mock days_in_current_stage using last_updated or age as a fallback for demo
            days = 0
            last_dt = str(row.get("created_at", ""))[:10] if pd.notna(row.get("created_at")) else ""
            if last_dt:
                try:
                    days = max(0, (pd.Timestamp.now() - pd.to_datetime(last_dt)).days)
                except:
                    days = int(row.get("Age", 30)) % 20
            else:
                days = int(row.get("Age", 30)) % 20'''

new_loop_code = '''            # TRUE days_in_current_stage calculated from event_df
            days = 0
            patient_events = event_df[event_df["Patient_ID"] == row["Patient_ID"]]
            if not patient_events.empty and "Event_Date" in patient_events.columns:
                patient_events = patient_events.sort_values("Event_Date", ascending=True)
                # Filter out NA dates to be safe
                patient_events = patient_events[patient_events["Event_Date"].notna()]
                if not patient_events.empty:
                    last_event_date = patient_events.iloc[-1]["Event_Date"]
                    try:
                        last_dt = pd.to_datetime(last_event_date)
                        days = max(0, (pd.Timestamp.now() - last_dt).days)
                    except:
                        days = 0'''

content = content.replace(old_loop_code, new_loop_code)

# Do the same for get_patient_detail
old_detail_code = '''        # Calculate days_in_current_stage
        days_in_stage = 14
        if events and events[-1]["date"] != "N/A":
            try:
                last_date = pd.to_datetime(events[-1]["date"])
                days_in_stage = max(0, (pd.Timestamp.now() - last_date).days)
            except:
                pass'''

new_detail_code = '''        # TRUE days_in_current_stage calculated from events
        days_in_stage = 0
        if events and events[-1]["date"] != "N/A":
            try:
                last_date = pd.to_datetime(events[-1]["date"])
                days_in_stage = max(0, (pd.Timestamp.now() - last_date).days)
            except:
                pass'''

content = content.replace(old_detail_code, new_detail_code)

with open('main.py', 'w') as f:
    f.write(content)

print("Updated actual logic for days in stage")
