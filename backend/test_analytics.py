from main import get_analytics
import os

try:
    res = get_analytics("hosp_335078")
    print("Cohorts:", type(res.get("cohorts")), list(res.get("cohorts").keys()) if isinstance(res.get("cohorts"), dict) else "not dict")
    
    surv = res.get("survival")
    print("Survival:", type(surv), list(surv.keys()) if isinstance(surv, dict) else "not dict")
except Exception as e:
    print("Error:", repr(e))
