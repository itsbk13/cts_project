import os
import re

file_path = r"c:\Data Engineering\CTS_PROJECT\backend\main.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace all occurrences of Patient_ID = '{patient_id}' with TRIM(Patient_ID) = '{patient_id.strip()}'
new_content = content.replace(
    "Patient_ID = '{patient_id}'", 
    "TRIM(Patient_ID) = '{patient_id.strip()}'"
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Replacement complete.")
