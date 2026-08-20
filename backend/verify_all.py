import requests, time

BASE = 'http://localhost:8000'
uid_email = f'test_{int(time.time())}@hospital.com'
r_reg = requests.post(f'{BASE}/register', json={
    'user_name': 'Test', 'hospital_name': 'Test Hosp', 
    'email': uid_email, 'password': 'Password@1', 'role': 'Admin'
})
uid = r_reg.json()['user_id']
r_login = requests.post(f'{BASE}/login', json={'user_id': uid, 'password': 'Password@1'})
token = r_login.json()['access_token']
H = {'Authorization': f'Bearer {token}'}

# Register a patient
r1 = requests.post(f'{BASE}/api/patients', headers=H, json={
    'Patient_ID': 'TEST-UNIQUE-999', 'Age': 30, 'Region': 'Northeast',
    'Diagnosis': 'Oncology', 'Therapy': 'Biologic A',
    'Insurance_Type': 'Commercial', 'Copay_Amount': 50, 'Prior_Authorization': 0
})
print('First insert status:', r1.status_code)

# Try duplicate
r2 = requests.post(f'{BASE}/api/patients', headers=H, json={
    'Patient_ID': 'TEST-UNIQUE-999', 'Age': 35, 'Region': 'Northeast',
    'Diagnosis': 'Oncology', 'Therapy': 'Biologic A',
    'Insurance_Type': 'Commercial', 'Copay_Amount': 50, 'Prior_Authorization': 0
})
print('Duplicate insert status:', r2.status_code, '(should be 400)')
print('Error message:', r2.json().get('detail'))

# Test analytics endpoint
r3 = requests.get(f'{BASE}/api/analytics', headers=H)
print('Analytics status:', r3.status_code)
data = r3.json()
print('Total patients:', data['overview']['total_patients'])
print('Funnel stages:', data['funnel']['funnel_stages'])
print('Funnel counts:', data['funnel']['patient_counts'])

# Test patient list - should show newly registered patient
r4 = requests.get(f'{BASE}/api/patients', headers=H)
print('Patient list status:', r4.status_code)
patients = r4.json()
print('Patient count:', len(patients))
if patients:
    print('First patient:', patients[0])
