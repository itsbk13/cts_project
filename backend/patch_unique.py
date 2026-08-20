import re

with open('main.py', 'r', encoding='utf-8') as f:
    code = f.read()

# Check uniqueness
check_unique = '''
        p_id = p.get('Patient_ID', p.get('patient_id', ''))
        cursor.execute(f"SELECT * FROM patient_analytics.{hospital_id}.patients WHERE Patient_ID = '{p_id}'")
        if cursor.fetchall():
            raise HTTPException(status_code=400, detail=f"Patient ID {p_id} already exists.")
'''

# Find register_patient insertion
if 'raise HTTPException(status_code=400, detail=f"Patient ID' not in code:
    code = code.replace("cursor = conn.cursor()\n    try:\n        p = patient", "cursor = conn.cursor()\n    try:\n        p = patient\n" + check_unique)

with open('main.py', 'w', encoding='utf-8') as f:
    f.write(code)

print('Uniqueness check added.')
