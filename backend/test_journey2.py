import requests, time

BASE = 'http://localhost:8000'
ts = int(time.time())
email = f'verify_{ts}@hospital.com'

# Register hospital
r = requests.post(f'{BASE}/register', json={
    'user_name': 'Test User', 'hospital_name': 'Test Hospital',
    'email': email, 'password': 'Password@1', 'role': 'Admin'
})
uid = r.json().get('user_id', '')

# Login
r2 = requests.post(f'{BASE}/login', json={'user_id': uid, 'password': 'Password@1'})
token = r2.json().get('access_token', '')
H = {'Authorization': f'Bearer {token}'}

# Register patient
r_pat = requests.post(f'{BASE}/api/patients', headers=H, json={
    'Patient_ID': 'TEST-UNIQUE-123', 'Age': 55, 'Region': 'Northeast',
    'Diagnosis': 'Type A', 'Therapy': 'Biologic A',
    'Insurance_Type': 'Commercial', 'Copay_Amount': 100, 'Prior_Authorization': 0
})

# Instant score
req_score = {
    "patient_id": "TEST-UNIQUE-123",
    "current_stage": "Prior Authorization",
    "event": "PA Submitted",
    "age": 55,
    "region": "Northeast",
    "diagnosis": "Type A",
    "therapy": "Biologic A",
    "insurance": "Commercial",
    "copay_amount": 100,
    "pa_required": True,
    "pa_delay_days": 5,
    "contact_attempts": 1
}
r_score = requests.post(f'{BASE}/api/patients/score', headers=H, json=req_score)
print('Score status:', r_score.status_code)
print('Score response:', r_score.json())

# Save event
req_save = {
    "Patient_ID": "TEST-UNIQUE-123",
    "Current_Stage": "Prior Authorization",
    "Event_Date": "2026-08-19",
    "PA_Delay_Days": 5,
    "Stockout_Flag": 0,
    "Contact_Attempts": 1,
    "Support_Enrollment": 0,
    "Claim_Status": "Pending",
    "risk_score": 0.75,
    "risk_level": "HIGH"
}
r_save = requests.post(f'{BASE}/api/patients/TEST-UNIQUE-123/events', headers=H, json=req_save)
print('Save status:', r_save.status_code)
print('Save response:', r_save.json())

