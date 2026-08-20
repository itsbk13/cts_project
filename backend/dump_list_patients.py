import ast

with open('main.py', 'r') as f:
    code = f.read()

tree = ast.parse(code)
for node in tree.body:
    if isinstance(node, ast.FunctionDef) and node.name == 'list_patients':
        lines = code.split('\n')[node.lineno-1:node.end_lineno]
        print('\n'.join(lines))
