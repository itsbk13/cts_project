"""
Bulk Upload Test  -  Patient Journey Intelligence
Tests:
  1. POST /api/patients/bulk        (JSON array, insert-only, up to 10,000)
  2. POST /api/patients/bulk/csv    (CSV file upload)
  3. POST /api/patients/bulk/analyze (JSON array with events, returns ML + LLM for each)
"""
import requests, time, io, csv, json

BASE = "http://localhost:8000"
PASS, FAIL = [], []

def ok(name, cond, detail=""):
    if cond:
        PASS.append(name)
        print(f"  [PASS] {name}")
    else:
        FAIL.append(name)
        print(f"  [FAIL] {name}  -->  {str(detail)[:140]}")

print("\n" + "="*60)
print("  BULK UPLOAD TEST  --  Patient Journey Intelligence")
print("="*60)

# ── get a token first ────────────────────────────────────────────
ts = int(time.time())
email = f"bulk_{ts}@hospital.com"
reg = {"user_name": "Dr. Bulk", "hospital_name": "Bulk Hospital",
       "email": email, "password": "Bulk@1234", "role": "Analyst"}
r = requests.post(f"{BASE}/register", json=reg)
uid = r.json().get("user_id") if r.ok else None
r = requests.post(f"{BASE}/login", json={"user_id": uid, "password": "Bulk@1234"})
token = r.json().get("access_token") if r.ok else None
H = {"Authorization": f"Bearer {token}"} if token else {}
ok("Login for bulk test", bool(token), r.text[:80])

# onboard the hospital schema
hosp = {"hospital_id": f"hosp_{ts}", "hospital_name": "Bulk Hospital"}
requests.post(f"{BASE}/admin/hospitals", json=hosp, timeout=90)

# ── TEST 1: POST /api/patients/bulk (JSON array, 20 patients) ───
print("\n[1] Bulk JSON Insert  (20 patients)")
batch_20 = [
    {
        "Patient_ID": f"PAT-BULK-{ts}-{i:03d}",
        "Age": 35 + i,
        "Region": ["North", "South", "East", "West"][i % 4],
        "Diagnosis": "Cardiovascular",
        "Therapy": ["Therapy_A", "Therapy_B", "Therapy_C", "Therapy_D"][i % 4],
        "Insurance_Type": ["Commercial", "Medicare", "Medicaid", "Other"][i % 4],
        "Copay_Amount": 20 + i * 5,
        "Prior_Authorization": i % 2,
        "Diagnosis_Date": "2025-01-15",
        "Prescription_Date": "2025-01-30",
        "Pharmacy_Type": "Specialty",
        "Payer": "Aetna"
    }
    for i in range(20)
]
try:
    r = requests.post(f"{BASE}/api/patients/bulk", json=batch_20, headers=H, timeout=90)
    ok("POST /api/patients/bulk (20 records)", r.status_code in (200, 201), r.text[:100])
    if r.ok:
        body = r.json()
        summary = body.get("summary", {})
        ok(f"All 20 inserted (inserted={summary.get('inserted')})", summary.get("inserted") == 20, summary)
        print(f"     Summary: {summary}")
except Exception as ex:
    ok("POST /api/patients/bulk", False, str(ex))

# ── TEST 2: Validation — bad records mixed in ────────────────────
print("\n[2] Bulk JSON with mixed valid + invalid records")
mixed = [
    {"Patient_ID": f"PAT-GOOD-{ts}", "Age": 45, "Region": "North",
     "Diagnosis": "Cardiovascular", "Therapy": "Therapy_A",
     "Insurance_Type": "Commercial", "Copay_Amount": 50, "Prior_Authorization": 1,
     "Diagnosis_Date": "2025-01-01", "Prescription_Date": "2025-01-15"},
    {"Patient_ID": "", "Age": 999, "Region": "INVALID", "Insurance_Type": "INVALID"},  # bad
    {"Patient_ID": f"PAT-GOOD2-{ts}", "Age": 60, "Region": "South",
     "Diagnosis": "Cardiovascular", "Therapy": "Therapy_B",
     "Insurance_Type": "Medicare", "Copay_Amount": 30, "Prior_Authorization": 0,
     "Diagnosis_Date": "2025-02-01", "Prescription_Date": "2025-02-15"},
]
try:
    r = requests.post(f"{BASE}/api/patients/bulk", json=mixed, headers=H, timeout=60)
    ok("Mixed batch accepted (200)", r.status_code == 200, r.text[:100])
    if r.ok:
        body = r.json()
        summary = body.get("summary", {})
        ok("2 inserted, 1 skipped", summary.get("inserted") == 2 and summary.get("skipped") == 1, summary)
        print(f"     Summary: {summary}")
except Exception as ex:
    ok("Mixed batch", False, str(ex))

# ── TEST 3: POST /api/patients/bulk/csv ─────────────────────────
print("\n[3] CSV File Upload  (10 patients)")
csv_rows = [
    ["Patient_ID","Age","Region","Diagnosis","Therapy","Insurance_Type","Copay_Amount","Prior_Authorization","Diagnosis_Date","Prescription_Date","Pharmacy_Type","Payer"],
]
for i in range(10):
    csv_rows.append([
        f"PAT-CSV-{ts}-{i:02d}", 40+i, ["North","South","East","West"][i%4],
        "Cardiovascular", ["Therapy_A","Therapy_B"][i%2],
        ["Commercial","Medicare"][i%2], 50, 1,
        "2025-03-01", "2025-03-15", "Retail", "BlueCross"
    ])
buf = io.StringIO()
writer = csv.writer(buf)
writer.writerows(csv_rows)
csv_bytes = buf.getvalue().encode("utf-8")

try:
    r = requests.post(
        f"{BASE}/api/patients/bulk/csv",
        headers=H,
        files={"file": ("patients.csv", csv_bytes, "text/csv")},
        timeout=90
    )
    ok("POST /api/patients/bulk/csv (10 rows)", r.status_code in (200, 201), r.text[:100])
    if r.ok:
        body = r.json()
        summary = body.get("summary", {})
        ok(f"10 CSV rows inserted (inserted={summary.get('inserted')})", summary.get("inserted") == 10, summary)
        print(f"     Summary: {summary}")
except Exception as ex:
    ok("CSV upload", False, str(ex))

# ── TEST 4: POST /api/patients/bulk/analyze (3 patients + events) ──
print("\n[4] Bulk Analyze  (3 patients with events -> ML + LLM)")
analyze_batch = [
    {
        "Patient_ID": f"PAT-ANA-{ts}-01",
        "Age": 58, "Region": "North", "Diagnosis": "Cardiovascular",
        "Therapy": "Therapy_A", "Insurance_Type": "Commercial",
        "Copay_Amount": 80, "Prior_Authorization": 1,
        "Diagnosis_Date": "2025-01-01", "Prescription_Date": "2025-01-20",
        "Pharmacy_Type": "Specialty", "Payer": "UnitedHealth",
        "events": [
            {"Journey_Event_ID": f"EVT-ANA-{ts}-01", "Patient_ID": f"PAT-ANA-{ts}-01",
             "Current_Stage": "Prior Authorization", "Event_Date": "2025-08-01",
             "PA_Delay_Days": 25, "Stockout_Flag": 0, "Processing_Date": "2025-08-01",
             "Fill_Date": None, "Contact_Attempts": 5, "Support_Enrollment": 0,
             "Claim_Status": "Rejected", "Claim_Rejection_Reason": None}
        ]
    },
    {
        "Patient_ID": f"PAT-ANA-{ts}-02",
        "Age": 42, "Region": "South", "Diagnosis": "Cardiovascular",
        "Therapy": "Therapy_B", "Insurance_Type": "Medicare",
        "Copay_Amount": 20, "Prior_Authorization": 0,
        "Diagnosis_Date": "2025-02-01", "Prescription_Date": "2025-02-10",
        "Pharmacy_Type": "Retail", "Payer": "Aetna",
        "events": [
            {"Journey_Event_ID": f"EVT-ANA-{ts}-02", "Patient_ID": f"PAT-ANA-{ts}-02",
             "Current_Stage": "Prescription Fill", "Event_Date": "2025-08-05",
             "PA_Delay_Days": 0, "Stockout_Flag": 0, "Processing_Date": "2025-08-05",
             "Fill_Date": None, "Contact_Attempts": 1, "Support_Enrollment": 1,
             "Claim_Status": "Approved", "Claim_Rejection_Reason": None}
        ]
    },
    {
        "Patient_ID": f"PAT-ANA-{ts}-03",
        "Age": 65, "Region": "East", "Diagnosis": "Cardiovascular",
        "Therapy": "Therapy_C", "Insurance_Type": "Medicaid",
        "Copay_Amount": 0, "Prior_Authorization": 1,
        "Diagnosis_Date": "2025-03-01", "Prescription_Date": "2025-03-20",
        "Pharmacy_Type": "Specialty", "Payer": "BlueCross"
        # no events key -- should use synthetic event
    }
]
try:
    r = requests.post(f"{BASE}/api/patients/bulk/analyze", json=analyze_batch, headers=H, timeout=120)
    ok("POST /api/patients/bulk/analyze (3 patients)", r.status_code in (200, 201), r.text[:120])
    if r.ok:
        body = r.json()
        summary = body.get("summary", {})
        print(f"     Summary: {summary}")
        for res in body.get("results", []):
            pid = res.get("Patient_ID")
            rl  = res.get("risk_level", "N/A")
            rs  = res.get("risk_score", "N/A")
            rec = str(res.get("recommendation", "")).encode("ascii", errors="replace").decode("ascii")[:80]
            print(f"     {pid}  risk={rl} ({rs})  rec: {rec}")
        ok(f"All 3 analyzed (analyzed={summary.get('analyzed')})", summary.get("analyzed") == 3, summary)
        ok("Each result has risk_level", all(r.get("risk_level") in ("High","Low") for r in body.get("results",[]) if r.get("status")=="analyzed"))
        ok("Each result has recommendation", all("recommendation" in r for r in body.get("results",[]) if r.get("status")=="analyzed"))
except Exception as ex:
    ok("Bulk analyze", False, str(ex))

# ── FINAL ────────────────────────────────────────────────────────
print()
print("="*60)
print(f"  RESULTS:  {len(PASS)} PASSED   {len(FAIL)} FAILED")
print("="*60)
if FAIL:
    for f in FAIL:
        print(f"    x {f}")
else:
    print("  ALL BULK CHECKS PASSED!")
print()
