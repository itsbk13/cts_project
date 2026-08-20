with open(r"x:\login\backend\main.py", "r", encoding="utf-8") as f:
    content = f.read()

start_str = "@app.post(\"/api/chat\")\ndef chat_endpoint(req: schemas.ChatRequest, hospital_id: str = Depends(get_hospital_id)):"
end_str = "    except Exception as e:\n        raise HTTPException(status_code=500, detail=str(e))"

start_idx = content.find(start_str)
end_idx = content.find(end_str, start_idx) + len(end_str)

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
                context_data = get_analytics(hospital_id=hospital_id)
                is_patient_context = False
        else:
            context_data = get_analytics(hospital_id=hospital_id)
            
        answer = chatbot.generate_chat_response(req.messages, context_data, is_patient_context)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))"""

if start_idx != -1:
    content = content[:start_idx] + good_route + content[end_idx:]
    with open(r"x:\login\backend\main.py", "w", encoding="utf-8") as f:
        f.write(content)
else:
    print("Could not find the block to replace!")
