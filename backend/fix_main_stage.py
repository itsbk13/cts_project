import os

with open('main.py', 'r') as f:
    content = f.read()

content = content.replace(
    '            "current_stage": events[-1]["stage"] if events else "Diagnosis",',
    '            "current_stage": patient_master.iloc[0]["Final_Stage"] if not patient_master.empty and "Final_Stage" in patient_master.columns and pd.notna(patient_master.iloc[0]["Final_Stage"]) else "Diagnosis",'
)

with open('main.py', 'w') as f:
    f.write(content)

print("Updated get_patient_detail current_stage")
