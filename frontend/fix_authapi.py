with open(r"x:\login\frontend\src\services\authApi.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("): Promise<{ message?: string }> {", "): Promise<{ message?: string, reset_code?: string }> {")
content = content.replace("return post<PasswordResetRequest, { message?: string }>(", "return post<PasswordResetRequest, { message?: string, reset_code?: string }>(")

with open(r"x:\login\frontend\src\services\authApi.ts", "w", encoding="utf-8") as f:
    f.write(content)
