import re

with open(r"x:\login\backend\schemas.py", "r", encoding="utf-8") as f:
    content = f.read()

new_classes = """

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    patient_id: Optional[str] = None
"""

if "class ChatMessage" not in content:
    content += new_classes
    
    # ensure List, Optional are imported
    if "from typing import List, Optional" not in content:
        content = content.replace("from pydantic import BaseModel", "from pydantic import BaseModel\nfrom typing import List, Optional")

    with open(r"x:\login\backend\schemas.py", "w", encoding="utf-8") as f:
        f.write(content)
