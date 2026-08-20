from main import analyze_patient
import os

try:
    res = analyze_patient("P003777", "hosp_335078")
    print("Success:", list(res.keys()))
except Exception as e:
    print("Error:", repr(e))
