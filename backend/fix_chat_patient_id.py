import re

with open(r"x:\login\backend\main.py", "r", encoding="utf-8") as f:
    content = f.read()

bad_route = r"@app.post\(\"/api/chat\"\)\ndef chat_endpoint.*?return \{\"answer\": answer\}\n    except Exception as e:\n        raise HTTPException\(status_code=500, detail=str\(e\)\)"

good_route = """@app.post("/api/chat")
def chat_endpoint(req: schemas.ChatRequest, hospital_id: str = Depends(get_hospital_id)):
    import re
    try:
        patient_id = req.patient_id
        
        # If no patient_id provided, try to extract it from the messages
        if not patient_id:
            for msg in reversed(req.messages):
                match = re.search(r'(PT-\d+|P\d{4,})', getattr(msg, "content", msg.get("content") if isinstance(msg, dict) else ""))
                if match:
                    patient_id = match.group(1)
                    break
        
        is_patient_context = bool(patient_id)
        if is_patient_context:
            try:
                context_data = analyze_patient(patient_id, hospital_id=hospital_id)
            except Exception:
                # Fallback to analytics if patient not found
                context_data = get_analytics(hospital_id=hospital_id)
                is_patient_context = False
        else:
            context_data = get_analytics(hospital_id=hospital_id)
            
        answer = chatbot.generate_chat_response(req.messages, context_data, is_patient_context)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))"""

content = re.sub(bad_route, good_route, content, flags=re.DOTALL)

with open(r"x:\login\backend\main.py", "w", encoding="utf-8") as f:
    f.write(content)
