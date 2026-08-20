import sys

with open("src/app/page.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    new_lines.append(line)

# Let's just fix it by manually crafting the correct structure. 
# We'll re-parse the file and completely strip out Card 4.

with open("src/app/page.tsx", "w", encoding="utf-8") as f:
    # write up to Card 4
    start_c4 = -1
    for i, l in enumerate(lines):
        if "Card 4: Business Impact" in l:
            start_c4 = i
            break
            
    if start_c4 != -1:
        # write lines before Card 4
        f.writelines(lines[:start_c4])
        # Find Card 5
        start_c5 = -1
        for i in range(start_c4, len(lines)):
            if "Card 5: Active Journey" in lines[i]:
                start_c5 = i
                break
        if start_c5 != -1:
            f.writelines(lines[start_c5:])
        else:
            f.writelines(lines[start_c4:])
    else:
        f.writelines(lines)
