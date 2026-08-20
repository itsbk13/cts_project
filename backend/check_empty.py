import os
from databricks import sql
from dotenv import load_dotenv

load_dotenv('.env')

hostname  = os.getenv('DATABRICKS_SERVER_HOSTNAME')
http_path = os.getenv('DATABRICKS_HTTP_PATH')
token     = os.getenv('DATABRICKS_TOKEN')

conn   = sql.connect(server_hostname=hostname, http_path=http_path, access_token=token)
cursor = conn.cursor()

cursor.execute('SHOW SCHEMAS IN patient_analytics')
schemas = [row[0] for row in cursor.fetchall() if row[0].startswith('hosp_')]

total_patients = 0
for schema in schemas:
    try:
        cursor.execute(f'SELECT COUNT(*) FROM patient_analytics.{schema}.patients')
        count = cursor.fetchone()[0]
        total_patients += count
    except:
        pass

print(f"Total patients across all hospital schemas: {total_patients}")
