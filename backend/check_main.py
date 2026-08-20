import ast
import traceback

with open('main.py', 'r') as f:
    code = f.read()

try:
    ast.parse(code)
    print("No syntax errors in main.py")
except Exception as e:
    print("Syntax Error:", traceback.format_exc())
