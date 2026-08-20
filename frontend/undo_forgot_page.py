with open(r"x:\login\frontend\src\app\forgot-password\page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

bad_block = """      try {
        const res = await requestPasswordReset(email.trim());
        if (res.reset_code) {
          alert(`[Hackathon Fallback] Email quota exceeded.\nYour Verification Code is: ${res.reset_code}`);
        }
        // Navigate to verify code page, passing email as route state
        router.push(`/verify-code?email=${encodeURIComponent(email.trim())}`);
      } catch (err) {"""

good_block = """      try {
        await requestPasswordReset(email.trim());
        // Navigate to verify code page, passing email as route state
        router.push(`/verify-code?email=${encodeURIComponent(email.trim())}`);
      } catch (err) {"""

content = content.replace(bad_block, good_block)

with open(r"x:\login\frontend\src\app\forgot-password\page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
