import os
from groq import Groq
import json

client = Groq(api_key=os.getenv("GROQ_API_KEY", "dummy_key"))
MODEL_NAME = "openai/gpt-oss-20b"

SYSTEM_PROMPT = """You are an expert Clinical Operations Data Analyst and Patient Journey Assistant.
Your role is to help case managers, nurses, and doctors understand patient access barriers, drop-off risks, and population-level trends.

You will be provided with a JSON context block containing data from the hospital's Databricks clusters.

STRICT RULES:
1. Answer the user's question directly, clearly, and concisely based ONLY on the provided context.
2. Format your reply to dynamically adapt to the prompt using markdown (bolding, lists, etc.) to make it highly readable.
3. Do NOT use a rigid or predefined structure (no forced headers like "BUSINESS IMPACT" or "RECOMMENDED ACTION" unless it naturally fits the answer).
4. Act as a natural conversational AI assistant.
"""

def generate_chat_response(messages: list, context_data: dict, is_patient_context: bool) -> str:
    # Reduce payload size if population context
    if not is_patient_context and isinstance(context_data, dict):
        last_msg = str(messages[-1].get("content", "") if isinstance(messages[-1], dict) else getattr(messages[-1], "content", "")).lower()
        
        reduced_context = {}
        if "overview" in context_data: reduced_context["overview"] = context_data["overview"]
        
        # Selectively include massive arrays based on keywords
        if "cohort" in last_msg or "retention" in last_msg or "month" in last_msg:
            if "cohorts" in context_data: reduced_context["cohorts"] = context_data["cohorts"]
        
        if "surviv" in last_msg or "median" in last_msg or "time" in last_msg or "day" in last_msg or "drop" in last_msg:
            if "survival" in context_data: reduced_context["survival"] = context_data["survival"]
            
        if "leak" in last_msg or "driver" in last_msg or "factor" in last_msg:
            if "leakage" in context_data: reduced_context["leakage"] = context_data["leakage"]
            if "stage_leakage" in context_data: reduced_context["stage_leakage"] = context_data["stage_leakage"]
            
        if "funnel" in last_msg or "stage" in last_msg:
            if "funnel" in context_data: reduced_context["funnel"] = context_data["funnel"]
            
        # If none matched, just include a bit of everything but truncated
        if len(reduced_context) == 1: # only overview
            reduced_context = context_data # fallback to all, hope it fits
            
        context_data = reduced_context
        
    context_str = json.dumps(context_data, default=str)
    
    # safeguard against crazy lengths
    if len(context_str) > 12000:
        context_str = context_str[:12000] + "... [TRUNCATED]"
    
    context_message = f"CONTEXT DATA:\n{context_str}\n\nUse this data to answer the user's question naturally and dynamically."
    
    groq_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    groq_messages.append({"role": "system", "content": context_message})
    
    for msg in messages:
        role = getattr(msg, "role", msg.get("role") if isinstance(msg, dict) else "user")
        content = getattr(msg, "content", msg.get("content") if isinstance(msg, dict) else "")
        groq_messages.append({"role": role, "content": content})

    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=groq_messages,
            temperature=0.3,
            max_completion_tokens=1000
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"[LLM ERROR] {e}")
        return "I am currently unable to process your request. " + str(e)
