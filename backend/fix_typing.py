import re

with open(r"x:\login\backend\schemas.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("from typing import List, Optional, EmailStr", "from typing import List, Optional\nfrom pydantic import EmailStr")

with open(r"x:\login\backend\schemas.py", "w", encoding="utf-8") as f:
    f.write(content)
