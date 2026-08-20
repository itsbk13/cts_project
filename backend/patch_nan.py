with open('main.py', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace('\"data\": features.values.tolist()', '\"data\": features.fillna(0).values.tolist()')

with open('main.py', 'w', encoding='utf-8') as f:
    f.write(code)

print('Patch applied successfully.')
