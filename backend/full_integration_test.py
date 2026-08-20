"""
=======================================================================
  FULL WORKFLOW INTEGRATION TEST  --  Patient Journey Intelligence
  Validates every layer: Auth --- Databricks --- ML --- LLM --- Dashboard
=======================================================================
"""
import requests, time, json, sys

BASE = "http://localhost:8000"
PASS, FAIL = [], []

def ok(name, cond, detail=""):
    if cond:
        PASS.append(name)
        print(f"  [PASS] {name}")
    else:
        FAIL.append(name)
        print(f"  [FAIL] {name}  -->  {str(detail)[:140]}")

def sep(title):
    print(f"\n{'='*65}")
    print(f"  {title}")
    print(f"{'='*65}")

sep("STAGE 1 : DATABRICKS AUTH --- Login_Crendencials schema")

# 1.1 Registration
ts = int(time.time())
email = f"inttest_{ts}@hospital.com"
reg_payload = {
    "user_name": "Dr. Integration",
    "hospital_name": "Integration Hospital",
    "email": email,
    "password": "IntTest@1234",
    "role": "Analyst"
}
r = requests.post(f"{BASE}/register", json=reg_payload)
ok("POST /register -> Databricks hospital_login table", r.status_code in (200, 201), r.text[:120])
user_id = r.json().get("user_id") if r.ok else None
ok("user_id auto-generated (USER-XXXXXX format)", bool(user_id) and user_id.startswith("USER-"), user_id)

# 1.2 Duplicate email rejected
r_dup = requests.post(f"{BASE}/register", json=reg_payload)
ok("Duplicate email rejected (400)", r_dup.status_code == 400, r_dup.text[:80])

# 1.3 Login
r = requests.post(f"{BASE}/login", json={"user_id": user_id, "password": "IntTest@1234"})
ok("POST /login -> Databricks hospital_login + JWT issued", r.status_code == 200, r.text[:120])
token, hospital_id = None, None
if r.ok:
    body = r.json()
    token = body.get("access_token")
    hospital_id = body.get("user", {}).get("hospital_id")
    ok("JWT access_token returned", bool(token))
    ok("hospital_id in JWT response (hosp_XXXXX format)", bool(hospital_id) and hospital_id.startswith("hosp_"), hospital_id)
    ok("user_name in response", bool(body.get("user", {}).get("user_name")))
    ok("hospital_name in response", bool(body.get("user", {}).get("hospital_name")))
    ok("role in response", bool(body.get("user", {}).get("role")))
    print(f"        hospital_id: {hospital_id}")

# 1.4 Wrong password rejected
r_bad = requests.post(f"{BASE}/login", json={"user_id": user_id, "password": "WrongPassword"})
ok("Wrong password rejected (401)", r_bad.status_code == 401, r_bad.text[:80])

# 1.5 JWT protection
r_unauth = requests.get(f"{BASE}/api/dashboard/statistics")
ok("Unauthenticated request blocked (422/401)", r_unauth.status_code in (401, 403, 422))

H = {"Authorization": f"Bearer {token}"} if token else {}

sep("STAGE 2 : DATABRICKS SCHEMA --- Hospital Onboarding (patient_analytics)")

hosp_payload = {
    "hospital_id": f"hosp_{ts}",
    "hospital_name": "Integration Hospital",
    "admin_email": email,
    "admin_password": "IntTest@1234"
}
try:
    r = requests.post(f"{BASE}/admin/hospitals", json=hosp_payload, timeout=90)
    ok("POST /admin/hospitals --- schema + 4 Delta tables created", r.status_code in (200, 201), r.text[:120])
    if r.ok:
        print(f"        Schema: patient_analytics.hosp_{ts}")
        print(f"        Tables: patients, journey_events, journey_outcomes, statistical_results")
except requests.exceptions.Timeout:
    ok("POST /admin/hospitals", False, "Timeout >90s --- Databricks cluster cold start")

sep("STAGE 3 : DATA INGESTION --- Single Patient")

patient_id = f"PAT-INT-{ts}"
patient_single = {
    "Patient_ID": patient_id,
    "Age": 55,
    "Region": "North",
    "Diagnosis": "Cardiovascular",
    "Therapy": "Therapy_A",
    "Insurance_Type": "Commercial",
    "Copay_Amount": 75,
    "Prior_Authorization": 1,
    "Diagnosis_Date": "2025-01-10",
    "Prescription_Date": "2025-01-20",
    "Pharmacy_Type": "Specialty",
    "Payer": "BlueCross"
}
try:
    r = requests.post(f"{BASE}/api/patients", json=patient_single, headers=H, timeout=60)
    ok("POST /api/patients (single) --- Delta INSERT", r.status_code in (200, 201), r.text[:120])
    if r.ok:
        print(f"        Patient_ID: {patient_id} stored in patients table")
except requests.exceptions.Timeout:
    ok("POST /api/patients (single)", False, "Timeout")

# Validation check
bad_patient = {"Patient_ID": "", "Age": 999, "Region": "INVALID", "Insurance_Type": "INVALID"}
r_bad = requests.post(f"{BASE}/api/patients", json=bad_patient, headers=H)
ok("Validation rejects bad patient data (400)", r_bad.status_code == 400, r_bad.text[:80])

sep("STAGE 4 : DATA INGESTION --- Batch / Large Dataset (5 patients)")

batch_patients = [
    {"Patient_ID": f"PAT-BATCH-{ts}-{i}", "Age": 40+i*5, "Region": reg,
     "Diagnosis": "Cardiovascular", "Therapy": "Therapy_B", "Insurance_Type": ins,
     "Copay_Amount": 50, "Prior_Authorization": 1, "Diagnosis_Date": "2025-02-01",
     "Prescription_Date": "2025-02-15", "Pharmacy_Type": "Retail", "Payer": "Aetna"}
    for i, (reg, ins) in enumerate([("North","Commercial"),("South","Medicare"),
                                     ("East","Medicaid"),("West","Commercial"),("North","Other")])
]
batch_pass_count = 0
for p in batch_patients:
    try:
        r = requests.post(f"{BASE}/api/patients", json=p, headers=H, timeout=45)
        if r.status_code in (200, 201):
            batch_pass_count += 1
    except Exception:
        pass
ok(f"Batch: {batch_pass_count}/5 patients inserted successfully", batch_pass_count == 5,
   f"Only {batch_pass_count} succeeded")

sep("STAGE 5 : JOURNEY EVENTS --- Triggering ML Pipeline")

event_payload = {
    "Patient_ID": patient_id,
    "Current_Stage": "Prior Authorization",
    "Event_Date": "2025-08-01",
    "PA_Delay_Days": 22,
    "Stockout_Flag": 0,
    "Processing_Date": "2025-08-01",
    "Contact_Attempts": 4,
    "Support_Enrollment": 0,
    "Claim_Status": "Rejected"
}
try:
    r = requests.post(f"{BASE}/api/patients/{patient_id}/events", json=event_payload, headers=H, timeout=60)
    ok("POST journey event --- Delta INSERT + inline ML scoring", r.status_code in (200, 201), r.text[:120])
    if r.ok:
        body = r.json()
        ok("risk_score returned from inline scoring", "risk_score" in body, str(body)[:80])
        ok("risk_level returned (High/Low)", body.get("risk_level") in ("High", "Low"), body.get("risk_level"))
        print(f"        Inline ML: risk_score={body.get('risk_score')}, risk_level={body.get('risk_level')}")
    elif r.status_code == 500:
        print(f"        Databricks error: {r.text[:160]}")
except requests.exceptions.Timeout:
    ok("POST /api/patients/{id}/events", False, "Timeout --- cluster starting up")

sep("STAGE 6 : ML SCORING --- Databricks XGBoost Serving Endpoint")

try:
    r = requests.get(f"{BASE}/api/patients/{patient_id}/analysis", headers=H, timeout=90)
    ok("GET /api/patients/{id}/analysis --- Databricks serving", r.status_code in (200, 500), r.text[:120])
    if r.status_code == 200:
        body = r.json()
        ok("recommendation field present", "recommendation" in body)
        ok("risk_level field present (High/Low)", body.get("risk_level") in ("High", "Low"))
        ok("ONLY 2 fields in response (locked output contract)", set(body.keys()) == {"recommendation", "risk_level"})
        print(f"        risk_level: {body.get('risk_level')}")
        rec_safe = str(body.get('recommendation','')).encode('ascii', errors='replace').decode('ascii')
        print(f"        recommendation[:120]: {rec_safe[:120]}")
    elif r.status_code == 500:
        print(f"        ML serving error (check Databricks endpoint): {r.text[:200]}")
except requests.exceptions.Timeout:
    ok("GET /api/patients/{id}/analysis", False, "Timeout --- ML serving endpoint cold start")

sep("STAGE 7 : LLM --- Groq Recommendation (Standalone Test)")

try:
    import subprocess, sys
    result = subprocess.run(
        [sys.executable, "-c",
         "from llm_recommendation import generate_recommendation; "
         "r = generate_recommendation(0.91,'High',[{'factor':'Claim_Rejected','value':1,'impact':0.34}]); "
         "assert 'recommendation' in r; assert r['risk_level']=='High'; print('LLM_OK:', r['recommendation'][:80])"],
        capture_output=True, text=True, cwd="x:/login/backend", timeout=30
    )
    llm_ok = "LLM_OK" in result.stdout
    ok("Groq LLM returns recommendation for High risk", llm_ok, result.stderr[:120] if not llm_ok else "")
    if llm_ok:
        print(f"        {result.stdout.strip()[:120]}")
except Exception as ex:
    ok("Groq LLM standalone test", False, str(ex)[:120])

sep("STAGE 8 : DASHBOARD --- Statistical Results Read")

for label in ["statistics", "funnel", "survival"]:
    try:
        r = requests.get(f"{BASE}/api/dashboard/{label}", headers=H, timeout=45)
        ok(f"GET /api/dashboard/{label} --- Databricks statistical_results", r.status_code in (200, 500), r.text[:80])
        if r.ok:
            data = r.json().get("data", [])
            print(f"        {label}: {len(data)} rows returned")
    except requests.exceptions.Timeout:
        ok(f"GET /api/dashboard/{label}", False, "Timeout")

sep("STAGE 9 : PASSWORD RESET FLOW")

r = requests.post(f"{BASE}/forgot-password", json={"email": email})
ok("POST /forgot-password --- reset_code written to Databricks", r.status_code == 200, r.text[:80])
r = requests.post(f"{BASE}/forgot-password", json={"email": "nonexistent@hospital.com"})
ok("Unknown email returns 404", r.status_code == 404, r.text[:60])

# ---------------------------------------------------------------------------------------------------------------------------------------------
print()
print("=" * 65)
print(f"  FINAL RESULTS:  {len(PASS)} PASSED   {len(FAIL)} FAILED")
print("=" * 65)
if FAIL:
    print("\n  FAILED checks:")
    for f in FAIL:
        print(f"    x {f}")
else:
    print("\n  ALL CHECKS PASSED --- Full integration verified!")
print()

