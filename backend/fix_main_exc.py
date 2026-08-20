import os

with open('main.py', 'r') as f:
    content = f.read()

content = content.replace('except Exception as e:\n        raise HTTPException(status_code=500, detail=str(e))', 'except HTTPException:\n        raise\n    except Exception as e:\n        raise HTTPException(status_code=500, detail=str(e))')

with open('main.py', 'w') as f:
    f.write(content)

print('Fixed main.py exception handling')
