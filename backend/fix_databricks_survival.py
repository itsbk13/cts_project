import re

with open(r"x:\login\backend\main.py", "r", encoding="utf-8") as f:
    content = f.read()

bad_pattern = r"\s*# Survival\s*time_points = .*?curves\.append\(\{\"time\": t, \"survival_probability\": round\(surv/100, 2\), \"group\": ins\}\)\s*survival_obj = \{"

good_code = """
        # Survival Curve - Fetch from Databricks
        curves = []
        try:
            cursor.execute(f"SELECT * FROM patient_analytics.{hospital_id}.statistical_results WHERE Metric_Type = 'KaplanMeier_Curve'")
            stat_rows = cursor.fetchall()
            stat_cols = [desc[0] for desc in cursor.description]
            stat_df = pd.DataFrame(stat_rows, columns=stat_cols)
            
            if not stat_df.empty:
                # Convert Category back to float, sort it, and populate the curve
                stat_df["Category_Float"] = stat_df["Category"].astype(float)
                stat_df = stat_df.sort_values("Category_Float")
                
                for _, row in stat_df.iterrows():
                    curves.append({
                        "time": int(row["Category_Float"]),
                        "survival_probability": round(float(row["Value"]), 2),
                        "group": "Overall"
                    })
        except Exception as e:
            print(f"Failed to fetch survival curve: {e}")
            
        if not curves:
            curves = [{"time": 0, "survival_probability": 1.0, "group": "Overall"}]
            
        survival_obj = {"""

content = re.sub(bad_pattern, good_code, content, flags=re.DOTALL)

with open(r"x:\login\backend\main.py", "w", encoding="utf-8") as f:
    f.write(content)
