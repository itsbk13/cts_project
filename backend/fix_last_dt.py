import os

with open('main.py', 'r') as f:
    content = f.read()

old_loop = '''            # TRUE days_in_current_stage calculated from event_df
            days = 0
            patient_events = event_df_local[event_df_local["patient_id"] == row.get("Patient_ID", row.get("patient_id"))]'''

new_loop = '''            # TRUE days_in_current_stage calculated from event_df
            days = 0
            last_dt_str = "N/A"
            patient_events = event_df_local[event_df_local["patient_id"] == row.get("Patient_ID", row.get("patient_id"))]'''

content = content.replace(old_loop, new_loop)

old_try = '''                    try:
                        last_dt = pd.to_datetime(last_event_date)
                        days = max(0, (pd.Timestamp.now() - last_dt).days)
                    except:
                        days = 0'''

new_try = '''                    try:
                        last_dt = pd.to_datetime(last_event_date)
                        last_dt_str = last_dt.strftime("%Y-%m-%d")
                        days = max(0, (pd.Timestamp.now() - last_dt).days)
                    except:
                        days = 0'''

content = content.replace(old_try, new_try)

old_append = '''                "last_updated": last_dt if last_dt else "N/A",'''
new_append = '''                "last_updated": last_dt_str,'''

content = content.replace(old_append, new_append)

with open('main.py', 'w') as f:
    f.write(content)

print("Fixed UnboundLocalError for last_dt")
