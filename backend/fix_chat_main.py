with open(r"x:\login\backend\main.py", "r", encoding="utf-8") as f:
    content = f.read()

# Replace analyze_patient with get_patient_detail in chat_endpoint
content = content.replace("context_data = analyze_patient(patient_id, hospital_id=hospital_id)", "context_data = get_patient_detail(patient_id, hospital_id=hospital_id)")

with open(r"x:\login\backend\main.py", "w", encoding="utf-8") as f:
    f.write(content)
