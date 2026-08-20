import sys

def delete_lines(file_path, start, end):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    new_lines = lines[:start-1] + lines[end:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

# Just run a custom regex or manual cleanup
def clean_drawer(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find "Why This Patient is Considered High Risk" container and remove it
    import re
    content = re.sub(
        r'<div\s*style=\{\{\s*padding:\s*"14px 16px".*?Why This Patient is Considered High Risk.*?</div>\s*</div>',
        '',
        content,
        flags=re.DOTALL
    )

    # Find "Recommended Business Action" container and remove it
    content = re.sub(
        r'<div>\s*<h3[^>]*>\s*Recommended Business Action\s*</h3>.*?</div>\s*</div>\s*</div>',
        '',
        content,
        flags=re.DOTALL
    )

    # Find "View Full SHAP Feature Importance Waterfall" and remove it
    content = re.sub(
        r'<Link\s*href="/shap".*?View Full SHAP Feature Importance Waterfall.*?</Link>',
        '',
        content,
        flags=re.DOTALL
    )

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

clean_drawer('src/components/risk/PatientRiskDrawer.tsx')
print("Cleaned PatientRiskDrawer")
