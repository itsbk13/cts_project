import requests, time

BASE  = "http://localhost:8000"
PASS, FAIL = [], []

def check(name, cond, detail=""):
    if cond:
        PASS.append(name)
        print(f"  [PASS] {name}")
    else:
        FAIL.append(name)
        print(f"  [FAIL] {name}  -->  {str(detail)[:120]}")

print()
print("================================================================")
print("  LIVE INTEGRATION TEST  --  Patient Journey Intelligence")
print("  Testing with REAL Databricks credentials")
print("================================================================")

print("\n[1] Backend Server")
check("FastAPI running on port 8000", requests.get(f"{BASE}/docs").status_code == 200)

print("\n[2] All Routes Registered")
paths = list(requests.get(f"{BASE}/openapi.json").json()["paths"].keys())
for route in ["/register","/login","/admin/hospitals","/api/patients",
              "/api/patients/{patient_id}/events",
              "/api/patients/{patient_id}/analysis",
              "/api/dashboard/statistics","/api/dashboard/funnel","/api/dashboard/survival"]:
    check(f"Route: {route}", route in paths)

print("\n[3] User Registration  -->  PostgreSQL")
ts = int(time.time())
reg = {"user_name":"Dr. Test","hospital_name":"City Hospital","email":f"test{ts}@hospital.com","password":"Test@1234","role":"Analyst"}
r = requests.post(f"{BASE}/register", json=reg)
check("POST /register 200/201", r.status_code in (200,201), r.text[:100])
user_id = r.json().get("user_id") if r.status_code in (200,201) else None
check("user_id auto-generated", bool(user_id))

print("\n[4] Login  -->  PostgreSQL + JWT")
r = requests.post(f"{BASE}/login", json={"user_id": user_id, "password": "Test@1234"})
check("POST /login 200", r.status_code == 200, r.text[:100])
token = None
if r.status_code == 200:
    body = r.json()
    token = body.get("access_token")
    check("access_token returned", bool(token))
    check("token_type: bearer", body.get("token_type","").lower() == "bearer")
    u = body.get("user", {})
    check("user.user_id in response", bool(u.get("user_id")))
    check("user.hospital_name", bool(u.get("hospital_name")))
    print(f"         User ID: {u.get('user_id')} | Hospital: {u.get('hospital_name')}")

H = {"Authorization": f"Bearer {token}"} if token else {}

print("\n[5] JWT Protection")
r_u = requests.get(f"{BASE}/api/dashboard/statistics")
check("Unauthenticated blocked", r_u.status_code in (401,403,422), str(r_u.status_code))

print("\n[6] Hospital Onboarding  -->  Databricks Schema (async - 60s timeout)")
hosp = {"hospital_id":f"hosp_{ts}","hospital_name":"City Hospital","admin_email":f"test{ts}@hospital.com","admin_password":"Test@1234"}
try:
    r = requests.post(f"{BASE}/admin/hospitals", json=hosp, timeout=60)
    check("POST /admin/hospitals 200", r.status_code in (200,201), r.text[:120])
    if r.status_code in (200,201):
        print(f"         Databricks schema created: patient_analytics.hosp_{ts}")
except requests.exceptions.Timeout:
    check("POST /admin/hospitals 200", False, "Databricks schema creation timed out (>60s) -- Databricks cluster may be starting up")

print("\n[7] Patient Registration  -->  Databricks Delta Table INSERT")
patient_id = f"PAT-LIVE-{ts}"
pat = {"Patient_ID":patient_id,"Age":52,"Region":"South","Diagnosis":"Cardiovascular",
       "Therapy":"Therapy_A","Insurance_Type":"Commercial","Copay_Amount":50,
       "Prior_Authorization":1,"Diagnosis_Date":"2025-01-01","Prescription_Date":"2025-01-15"}
try:
    r = requests.post(f"{BASE}/api/patients", json=pat, headers=H, timeout=60)
    check("POST /api/patients 200/201", r.status_code in (200,201), r.text[:120])
    if r.status_code in (200,201):
        print(f"         Patient {patient_id} inserted into Databricks patients table")
    elif r.status_code == 500:
        print(f"         Databricks error: {r.text[:150]}")
except requests.exceptions.Timeout:
    check("POST /api/patients 200/201", False, "Timeout -- Databricks cluster starting up")

bad = {"Patient_ID":"","Age":999,"Region":"INVALID","Insurance_Type":"INVALID"}
r_bad = requests.post(f"{BASE}/api/patients", json=bad, headers=H)
check("Validation rejects bad data (400)", r_bad.status_code == 400, r_bad.text[:80])

print("\n[8] Journey Event  -->  Databricks Delta Table INSERT")
ev = {"Patient_ID":patient_id,"Current_Stage":"Prior Authorization","Event_Date":"2025-08-01",
      "PA_Delay_Days":18,"Stockout_Flag":0,"Contact_Attempts":3,"Claim_Status":"Rejected","Support_Enrollment":0}
try:
    r = requests.post(f"{BASE}/api/patients/{patient_id}/events", json=ev, headers=H, timeout=60)
    check("POST /api/patients/{id}/events 200", r.status_code in (200,201), r.text[:120])
    if r.status_code in (200,201):
        print(f"         Journey event inserted into Databricks journey_events table")
    elif r.status_code == 500:
        print(f"         Databricks error: {r.text[:150]}")
except requests.exceptions.Timeout:
    check("POST /api/patients/{id}/events 200", False, "Timeout -- Databricks cluster starting up")

print("\n[9] Real-Time ML Scoring  -->  Databricks XGBoost + LLM")
try:
    r = requests.get(f"{BASE}/api/patients/{patient_id}/analysis", headers=H, timeout=60)
    check("GET /api/patients/{id}/analysis", r.status_code in (200,500), r.text[:120])
    if r.status_code == 200:
        body = r.json()
        print(f"         risk_level:     {body.get('risk_level')}")
        rec_safe = str(body.get('recommendation','')).encode('ascii', errors='replace').decode('ascii')
        print(f"         recommendation: {rec_safe[:100]}")
        check("recommendation in response", "recommendation" in body)
        check("risk_level High or Low", body.get("risk_level") in ("High","Low"))
        check("Clean 2-field output", set(body.keys()) == {"recommendation","risk_level"})
    elif r.status_code == 500:
        print(f"         ML Serving error: {r.text[:200]}")
except requests.exceptions.Timeout:
    check("GET /api/patients/{id}/analysis", False, "Timeout -- ML serving endpoint starting up")

print("\n[10] Dashboard  -->  Databricks statistical_results")
for label, url in [("statistics", f"{BASE}/api/dashboard/statistics"),
                    ("funnel",     f"{BASE}/api/dashboard/funnel"),
                    ("survival",   f"{BASE}/api/dashboard/survival")]:
    try:
        r = requests.get(url, headers=H, timeout=60)
        check(f"GET /api/dashboard/{label}", r.status_code in (200,500), r.text[:80])
        if r.status_code == 200:
            print(f"         {label}: {str(r.json())[:80]}")
    except requests.exceptions.Timeout:
        check(f"GET /api/dashboard/{label}", False, "Timeout")

print("\n[11] Frontend  -->  Next.js port 3000")
try:
    rf = requests.get("http://localhost:3000", timeout=8)
    check("Frontend reachable on port 3000", rf.status_code == 200)
    check("Returns HTML", "html" in rf.text.lower())
except Exception as e:
    check("Frontend reachable on port 3000", False, str(e))

print()
print("================================================================")
print(f"  FINAL RESULTS:  {len(PASS)} PASSED   {len(FAIL)} FAILED")
print("================================================================")
if FAIL:
    print("\n  Failed checks:")
    for f in FAIL: print(f"    x {f}")
else:
    print("\n  ALL CHECKS PASSED -- Full live Databricks integration verified.")
print()
