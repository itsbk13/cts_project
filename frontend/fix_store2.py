import sys
import re

with open('src/store/datasetStore.ts', 'r') as f:
    content = f.read()

# Replace default metadata block
old_meta = '''  metadata: {
    filename: "CTS_Patient_Journey_5000.xlsx",
    patient_count: 5000,
    column_count: 18,
    status: "Active (Demo)",
    last_updated: "Just now",
    isCustom: false,
  },'''

new_meta = '''  metadata: {
    filename: "Databricks Connected",
    patient_count: 0, // This will be visually hidden or dynamically updated if we wanted
    column_count: 24,
    status: "Live Database",
    last_updated: "Real-time",
    isCustom: true,
  },'''

content = content.replace(old_meta, new_meta)

old_reset = '''      metadata: {
        filename: "CTS_Patient_Journey_5000.xlsx",
        patient_count: 5000,
        column_count: 18,
        status: "Active (Demo)",
        last_updated: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isCustom: false,
      },'''

new_reset = '''      metadata: {
        filename: "Databricks Connected",
        patient_count: 0,
        column_count: 24,
        status: "Live Database",
        last_updated: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isCustom: true,
      },'''

content = content.replace(old_reset, new_reset)

with open('src/store/datasetStore.ts', 'w') as f:
    f.write(content)

print("Updated datasetStore.ts metadata.")
