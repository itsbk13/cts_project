import re

with open(r"x:\login\frontend\src\store\analyticsData.ts", "r", encoding="utf-8") as f:
    content = f.read()

pattern = r"export const cohortHeatmap.*?\];"
replacement = """export const cohortHeatmap: any[] = [
  { cohort_month: "January 2024", total_patients: 24, retention_rates: [92, 88, 79, 79, 79, 71, 71, 63, 63, 67, 63, 58] },
  { cohort_month: "February 2024", total_patients: 27, retention_rates: [93, 85, 81, 81, 81, 81, 81, 81, 78, 78, 70] },
  { cohort_month: "March 2024", total_patients: 40, retention_rates: [98, 90, 83, 80, 78, 75, 73, 73, 68, 68] },
  { cohort_month: "April 2024", total_patients: 30, retention_rates: [97, 83, 77, 77, 73, 70, 67, 50, 47] },
  { cohort_month: "May 2024", total_patients: 34, retention_rates: [94, 82, 82, 79, 74, 71, 65, 59] },
  { cohort_month: "June 2024", total_patients: 23, retention_rates: [100, 91, 91, 83, 87, 87, 78] },
  { cohort_month: "July 2024", total_patients: 34, retention_rates: [97, 94, 91, 85, 76, 71] },
  { cohort_month: "August 2024", total_patients: 26, retention_rates: [100, 85, 81, 69, 69] },
  { cohort_month: "September 2024", total_patients: 18, retention_rates: [100, 100, 94, 89] },
  { cohort_month: "October 2024", total_patients: 24, retention_rates: [100, 88, 88] },
  { cohort_month: "November 2024", total_patients: 31, retention_rates: [100, 87] },
  { cohort_month: "December 2024", total_patients: 29, retention_rates: [100] }
];"""

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open(r"x:\login\frontend\src\store\analyticsData.ts", "w", encoding="utf-8") as f:
    f.write(content)
