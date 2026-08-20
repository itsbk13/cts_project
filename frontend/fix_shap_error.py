import sys
import re

with open('src/app/shap/page.tsx', 'r') as f:
    content = f.read()

old_err = '''  if (error) return <ErrorState onRetry={load} />;'''

new_err = '''  if (error) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-muted)" }}>
        <h2 style={{ fontSize: 18, color: "var(--color-navy)", marginBottom: 10 }}>Patient Does Not Exist</h2>
        <p>The patient ID "{selectedPatientId}" could not be found in the system. Please try a valid patient ID.</p>
        <button onClick={() => { setError(false); setSearchInput(""); setSelectedPatientId(""); }} className="btn-primary" style={{ marginTop: 20 }}>
          Clear Search
        </button>
      </div>
    );
  }'''

content = content.replace(old_err, new_err)

with open('src/app/shap/page.tsx', 'w') as f:
    f.write(content)

print("Updated SHAP error state")
