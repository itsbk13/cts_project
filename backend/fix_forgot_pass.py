with open(r"x:\login\backend\main.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("return {\"message\": \"Reset code sent\"}", "return {\"message\": \"Reset code sent\", \"reset_code\": code}")

with open(r"x:\login\backend\main.py", "w", encoding="utf-8") as f:
    f.write(content)
