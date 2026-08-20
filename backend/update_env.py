import re

env_path = r"x:\login\backend\.env"
with open(env_path, "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(r"SMTP_EMAIL=.*", "SMTP_EMAIL=boopeshr2@gmail.com", content)
content = re.sub(r"SMTP_PASSWORD=.*", "SMTP_PASSWORD=vbpeowjjhyrogaar", content)

with open(env_path, "w", encoding="utf-8") as f:
    f.write(content)
