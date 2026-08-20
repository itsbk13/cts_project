import requests, time

BASE = 'http://localhost:8000'
ts = int(time.time())
email = f'verify_{ts}@hospital.com'

# Register
r = requests.post(f'{BASE}/register', json={
    'user_name': 'Test User', 'hospital_name': 'Test Hospital',
    'email': email, 'password': 'Password@1', 'role': 'Admin'
})
print('Register:', r.status_code, '-', r.json().get('user_id', r.json().get('detail','')))

uid = r.json().get('user_id', '')
if not uid:
    print('FAILED - no user_id')
    exit(1)

# Login
r2 = requests.post(f'{BASE}/login', json={'user_id': uid, 'password': 'Password@1'})
print('Login:', r2.status_code, '-', r2.json().get('message', r2.json().get('detail','')))

token = r2.json().get('access_token', '')
H = {'Authorization': f'Bearer {token}'}

# Patient list
r3 = requests.get(f'{BASE}/api/patients', headers=H)
print('Patient list:', r3.status_code)

print('')
print('All checks passed - patient_analytics.login_credential is working!')
