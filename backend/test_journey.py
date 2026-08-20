import requests

BASE = 'http://localhost:8000'
# Login
r2 = requests.post(f'{BASE}/login', json={'user_id': 'USER-768564', 'password': 'Password@1'})
token = r2.json().get('access_token', '')
H = {'Authorization': f'Bearer {token}'}

# Instant score
req_score = {
    "patient_id": "TEST-UNIQUE-999",
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
    "Patient_ID": "TEST-UNIQUE-999",
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
r_save = requests.post(f'{BASE}/api/patients/TEST-UNIQUE-999/events', headers=H, json=req_save)
print('Save status:', r_save.status_code)
print('Save response:', r_save.json())

