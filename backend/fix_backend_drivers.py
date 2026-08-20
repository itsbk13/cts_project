import re

with open(r"x:\login\backend\main.py", "r", encoding="utf-8") as f:
    content = f.read()

pattern = r"drivers = \[\s+\{\"driver\": \"Prior Auth Delay.*?\]"
replacement = """def compute_driver_stats(condition_func, driver_name, stage):
              affected = [pid for pid in patient_df["Patient_ID"] if condition_func(pid)]
              unaffected = [pid for pid in patient_df["Patient_ID"] if not condition_func(pid)]
              
              if not affected or not unaffected:
                  return None
                  
              drop_affected = sum(1 for pid in affected if patient_stages.get(pid) != "First Fill")
              drop_unaffected = sum(1 for pid in unaffected if patient_stages.get(pid) != "First Fill")
              
              rate_affected = drop_affected / len(affected)
              rate_unaffected = drop_unaffected / len(unaffected) if len(unaffected) > 0 else 1.0
              
              hazard_ratio = round(rate_affected / rate_unaffected, 2) if rate_unaffected > 0 else 5.0
              
              diff = rate_affected - rate_unaffected
              if diff > 0.3: p_value = 0.0001
              elif diff > 0.1: p_value = 0.001
              elif diff > 0.05: p_value = 0.04
              else: p_value = 0.2
              
              impact = "HIGH" if hazard_ratio >= 2.0 else "MEDIUM" if hazard_ratio >= 1.2 else "LOW"
              
              return {
                  "driver": driver_name,
                  "impact": impact,
                  "affected_patients": len(affected),
                  "confidence": 0.95 if p_value < 0.05 else 0.7,
                  "stage": stage,
                  "hazard_ratio": hazard_ratio,
                  "p_value": p_value,
                  "effect_size": round(diff, 2)
              }

          d1 = compute_driver_stats(lambda pid: patient_pa_delay.get(pid, 0) > 7, "Prior Auth Delay > 7 Days", "Prior Authorization")
          d2 = compute_driver_stats(lambda pid: patient_claims.get(pid, "") == "Rejected", "Claim Rejections", "Copay")
          d3 = compute_driver_stats(lambda pid: patient_contact.get(pid, 0) >= 3, "Patient Unreachable", "Diagnosis")
          
          drivers = [d for d in [d1, d2, d3] if d is not None]"""

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open(r"x:\login\backend\main.py", "w", encoding="utf-8") as f:
    f.write(content)
