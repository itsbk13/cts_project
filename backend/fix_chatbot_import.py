import re

with open(r"x:\login\backend\main.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("from llm_recommendation import generate_recommendation", "from llm_recommendation import generate_recommendation\nimport chatbot")

with open(r"x:\login\backend\main.py", "w", encoding="utf-8") as f:
    f.write(content)
