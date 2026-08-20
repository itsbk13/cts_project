import sys

def delete_lines(file_path, start, end):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    new_lines = lines[:start-1] + lines[end:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

# This is getting tedious, I will just write a function to delete the block containing the keyword.
def delete_div_block(file_path, keyword):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    new_lines = []
    
    i = 0
    while i < len(lines):
        if keyword in lines[i]:
            # find the preceding <div or <KPICard
            start = i
            while start >= 0 and '<div' not in lines[start] and '<KPICard' not in lines[start] and '<span' not in lines[start]:
                start -= 1
            # find the closing </div> or />
            end = i
            while end < len(lines) and '</div>' not in lines[end] and '/>' not in lines[end]:
                end += 1
            
            # just remove this whole block
            del lines[start:end+1]
            i = start
        else:
            i += 1
            
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

delete_div_block('src/app/page.tsx', 'Revenue at Risk')
delete_div_block('src/app/funnel/page.tsx', 'PA Revenue Risk')
delete_div_block('src/app/leakage/page.tsx', 'Revenue Risk')
delete_div_block('src/components/leakage/LeakageDrawer.tsx', 'Estimated Revenue at Risk')
delete_div_block('src/components/risk/PatientRiskDrawer.tsx', 'Estimated Revenue at Risk')

print("Brute forced Revenue at risk.")
