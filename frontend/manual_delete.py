import sys

def delete_lines(file_path, start, end):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    new_lines = lines[:start-1] + lines[end:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

delete_lines('src/app/page.tsx', 274, 278)
delete_lines('src/app/leakage/page.tsx', 181, 185)

print("Done")
