import os

with open('main.py', 'r') as f:
    content = f.read()

content = content.replace(
    'except Exception as e:\n        raise HTTPException(status_code=500, detail=str(e))',
    'except Exception as e:\n        import traceback\n        traceback.print_exc()\n        raise HTTPException(status_code=500, detail=str(e))'
)

with open('main.py', 'w') as f:
    f.write(content)

print('Added traceback to main.py')
