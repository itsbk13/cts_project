import requests, time

BASE = 'http://localhost:8000'
ts = int(time.time())
email = f'verify_{ts}@hospital.com'

# Register
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
    'Patient_ID': 'TEST-COPAY', 'Age': 55, 'Region': 'Northeast',
    'Diagnosis': 'Type A', 'Therapy': 'Biologic A',
    'Insurance_Type': 'Commercial', 'Copay_Amount': 100, 'Prior_Authorization': 0
})

# Save event with Copay stage
req_save = {
    "Patient_ID": "TEST-COPAY",
    "Current_Stage": "Copay",
    "Event_Date": "2026-08-19",
    "PA_Delay_Days": 0,
    "Stockout_Flag": 0,
    "Contact_Attempts": 1,
    "Support_Enrollment": 0,
    "Claim_Status": "Pending",
    "risk_score": 0.25,
    "risk_level": "LOW"
}
r_save = requests.post(f'{BASE}/api/patients/TEST-COPAY/events', headers=H, json=req_save)
print('Save status:', r_save.status_code)
print('Save response:', r_save.json())

# Save event with First Fill stage
req_save2 = {
    "Patient_ID": "TEST-COPAY",
    "Current_Stage": "First Fill",
    "Event_Date": "2026-08-19",
    "PA_Delay_Days": 0,
    "Stockout_Flag": 0,
    "Contact_Attempts": 1,
    "Support_Enrollment": 0,
    "Claim_Status": "Pending",
    "risk_score": 0.15,
    "risk_level": "LOW"
}
r_save2 = requests.post(f'{BASE}/api/patients/TEST-COPAY/events', headers=H, json=req_save2)
print('Save status 2:', r_save2.status_code)
print('Save response 2:', r_save2.json())

