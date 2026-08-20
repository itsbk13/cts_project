import re

with open(r"x:\login\backend\main.py", "r", encoding="utf-8") as f:
    content = f.read()

import_statement = "import chatbot"
if import_statement not in content:
    content = content.replace("import llm_recommendation", "import llm_recommendation\nimport chatbot")

chat_route = """
@app.post("/api/chat")
def chat_endpoint(req: schemas.ChatRequest, hospital_id: str = Depends(get_hospital_id)):
    try:
        is_patient_context = bool(req.patient_id)
        if is_patient_context:
            context_data = analyze_patient(req.patient_id, hospital_id=hospital_id)
        else:
            context_data = get_analytics(hospital_id=hospital_id)
            
        answer = chatbot.generate_chat_response(req.messages, context_data, is_patient_context)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
"""

if "@app.post(\"/api/chat\")" not in content:
    content += chat_route
    with open(r"x:\login\backend\main.py", "w", encoding="utf-8") as f:
        f.write(content)
