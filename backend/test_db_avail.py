import os
from databricks import sql
from dotenv import load_dotenv
import json

load_dotenv()

conn = sql.connect(
    server_hostname=os.getenv('DATABRICKS_SERVER_HOSTNAME'),
    http_path=os.getenv('DATABRICKS_HTTP_PATH'),
    access_token=os.getenv('DATABRICKS_TOKEN')
)
cursor = conn.cursor()

# Check patient P003777
cursor.execute("SELECT * FROM patient_analytics.hosp_335078.patients WHERE Patient_ID = 'P003777'")
print("Patient rows:", len(cursor.fetchall()))

# Check get_analytics survival
cursor.execute("SELECT * FROM patient_analytics.hosp_335078.statistical_results WHERE Metric_Type = 'KaplanMeier_Curve'")
print("Survival rows:", len(cursor.fetchall()))
