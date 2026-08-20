import re

with open(r"x:\login\backend\main.py", "r", encoding="utf-8") as f:
    content = f.read()

pattern = r"# Cohorts\s+heatmap = \[\]\s+months = \[\"2026-05\".*?patient_count\": round\(r_total / len\(months\)\)\s+\}\)\s+"
new_cohorts = """# Cohorts - Acquisition Cohort Analysis
        heatmap_data = []
        if not event_df.empty and "event_date" in event_df.columns:
            # We copy event_df to avoid setting with copy warnings
            edf = event_df.copy()
            edf["event_date"] = pd.to_datetime(edf["event_date"], errors="coerce")
            edf = edf.dropna(subset=["event_date"])
            edf["month_str"] = edf["event_date"].dt.to_period("M")
            
            # 1. Determine cohort month per patient (earliest Event_Date)
            patient_cohorts = edf.groupby("patient_id")["month_str"].min().reset_index()
            patient_cohorts.rename(columns={"month_str": "cohort_month"}, inplace=True)
            
            # 2. Merge cohort month back to events
            events_merged = pd.merge(edf, patient_cohorts, on="patient_id")
            events_merged["month_idx"] = (events_merged["month_str"] - events_merged["cohort_month"]).apply(lambda x: x.n)
            events_merged = events_merged[events_merged["month_idx"] >= 0]
            
            # 3. Calculate cohort sizes
            cohort_sizes = patient_cohorts.groupby("cohort_month")["patient_id"].nunique().reset_index()
            cohort_sizes.rename(columns={"patient_id": "total_patients"}, inplace=True)
            
            # 4. Calculate retention per cohort & month_idx
            retention = events_merged.groupby(["cohort_month", "month_idx"])["patient_id"].nunique().reset_index()
            retention.rename(columns={"patient_id": "retained_patients"}, inplace=True)
            retention = pd.merge(retention, cohort_sizes, on="cohort_month")
            retention["retention_rate"] = (retention["retained_patients"] / retention["total_patients"]) * 100
            
            # 5. Build heatmap array
            for cohort, group in retention.groupby("cohort_month"):
                cohort_str = cohort.strftime("%B %Y")
                total = cohort_sizes[cohort_sizes["cohort_month"] == cohort]["total_patients"].values[0]
                
                max_idx = group["month_idx"].max()
                rates = []
                # Truncate at 12 months for UI layout
                for i in range(min(12, max_idx + 1)):
                    rate_row = group[group["month_idx"] == i]
                    if not rate_row.empty:
                        rates.append(round(rate_row["retention_rate"].values[0]))
                    else:
                        rates.append(0)
                        
                heatmap_data.append({
                    "cohort_month": cohort_str,
                    "total_patients": int(total),
                    "retention_rates": rates
                })
            
            # Sort chronologically
            heatmap_data = sorted(heatmap_data, key=lambda x: pd.to_datetime(x["cohort_month"], format="%B %Y"))
        
        heatmap = heatmap_data

        """

content = re.sub(pattern, new_cohorts, content, flags=re.DOTALL)

with open(r"x:\login\backend\main.py", "w", encoding="utf-8") as f:
    f.write(content)
