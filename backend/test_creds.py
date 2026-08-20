import requests, time
from databricks import sql
import os
from dotenv import load_dotenv

load_dotenv('.env')

hostname = os.getenv('DATABRICKS_SERVER_HOSTNAME')
http_path = os.getenv('DATABRICKS_HTTP_PATH')
token = os.getenv('DATABRICKS_TOKEN')
serving_url = os.getenv('DATABRICKS_SERVING_URL')

print('Testing new Databricks credentials...')
print(f'Hostname: {hostname}')

try:
    conn = sql.connect(server_hostname=hostname, http_path=http_path, access_token=token)
    cursor = conn.cursor()
    cursor.execute('SELECT 1 as ping')
    result = cursor.fetchone()
    print(f'SQL Warehouse connection: OK (ping={result[0]})')
    cursor.close()
    conn.close()
except Exception as e:
    print(f'SQL Warehouse connection FAILED: {e}')

print(f'Model Serving URL: {serving_url}')
print('Done.')
