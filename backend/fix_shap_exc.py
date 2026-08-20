import os

with open('main.py', 'r') as f:
    content = f.read()

content = content.replace(
    'except Exception as err:\n        raise HTTPException(status_code=500, detail=f"Database query failed: {str(err)}")\n    finally:',
    'except HTTPException:\n        raise\n    except Exception as err:\n        raise HTTPException(status_code=500, detail=f"Database query failed: {str(err)}")\n    finally:'
)

with open('main.py', 'w') as f:
    f.write(content)

print('Fixed get_patient_shap exceptions')
