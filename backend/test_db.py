import os
import databricks.sql
from dotenv import load_dotenv

load_dotenv('.env.local')

conn = databricks.sql.connect(
    server_hostname=os.getenv('DATABRICKS_SERVER_HOSTNAME'),
    http_path=os.getenv('DATABRICKS_HTTP_PATH'),
    access_token=os.getenv('DATABRICKS_TOKEN')
)
cursor = conn.cursor()
cursor.execute('SHOW SCHEMAS IN patient_analytics')
schemas = cursor.fetchall()
for schema in schemas:
    print(schema[0])
