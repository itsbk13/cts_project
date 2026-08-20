import os

with open('main.py', 'r') as f:
    content = f.read()

content = content.replace(
    'pa_delay = row.get("PA_Delay_Days", 0)',
    'pa_delay = row.get("Max_PA_Delay_Days", 0)'
)
content = content.replace(
    'stockout = row.get("Stockout_Flag", 0)',
    'stockout = row.get("Stockout_Experienced", 0)'
)

with open('main.py', 'w') as f:
    f.write(content)

print("Fixed top_driver keys")
