import os
import re

directory = 'src/app'

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith('page.tsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Remove lastUpdated from dependency arrays
            new_content = re.sub(r',\s*lastUpdated\b', '', content)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Fixed {filepath}")
