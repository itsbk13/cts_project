import re

# -- 1. src/app/page.tsx -----------------------------------
with open("src/app/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace(
    'import { getOverview, getLeakage, getRiskOverview, getFunnel, getLeakageDrawer } from "@/lib/api";',
    'import { getOverview, getLeakage, getRiskOverview, getFunnel } from "@/lib/api";'
)
c = c.replace('import { LeakageDrawer } from "@/components/leakage/LeakageDrawer";\n', "")
c = c.replace(", LeakageDrawerData", "")
c = re.sub(r"  // Leakage Drawer\n  const \[drawerOpen.*?\n\n", "\n", c, flags=re.DOTALL)
c = re.sub(r"  const handleInvestigate = async.*?};\n\n", "", c, flags=re.DOTALL)
c = re.sub(r"\s+\{/\*.*?Leakage Investigation Drawer.*?\*/\}\s+<LeakageDrawer[\s\S]*?/>\n", "\n", c, flags=re.DOTALL)

with open("src/app/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)
print("page.tsx done")

# -- 2. src/app/funnel/page.tsx ----------------------------
with open("src/app/funnel/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace(
    'import { getFunnel, getLeakageDrawer } from "@/lib/api";',
    'import { getFunnel } from "@/lib/api";'
)
c = c.replace('import type { LeakageDrawerData } from "@/types/analytics";\n', "")
c = c.replace('import { LeakageDrawer } from "@/components/leakage/LeakageDrawer";\n', "")
c = c.replace("  Search,\n", "")
c = re.sub(r"  // Drawer state\n  const \[drawerOpen.*?\n\n", "\n", c, flags=re.DOTALL)
c = re.sub(r"  const handleInvestigate = useCallback[\s\S]*?\}, \[\]\);\n\n", "", c, flags=re.DOTALL)
c = re.sub(r"\s+\{/\*.*?Leakage Investigation Drawer.*?\*/\}\s+<LeakageDrawer[\s\S]*?/>\n", "\n", c, flags=re.DOTALL)

with open("src/app/funnel/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)
print("funnel/page.tsx done")

# -- 3. PatientFunnel.tsx - remove openLeakageDrawer -------
with open("src/components/overview/PatientFunnel.tsx", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("  const { openLeakageDrawer } = useUIStore();\n", "")
c = c.replace("    } else if (interactive) {\n      openLeakageDrawer(stageName);\n    }\n", "    }\n")

with open("src/components/overview/PatientFunnel.tsx", "w", encoding="utf-8") as f:
    f.write(c)
print("PatientFunnel.tsx done")
