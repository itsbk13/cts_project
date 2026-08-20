import os
from databricks import sql
from dotenv import load_dotenv

load_dotenv('.env')

hostname  = os.getenv('DATABRICKS_SERVER_HOSTNAME')
http_path = os.getenv('DATABRICKS_HTTP_PATH')
token     = os.getenv('DATABRICKS_TOKEN')

conn   = sql.connect(server_hostname=hostname, http_path=http_path, access_token=token)
cursor = conn.cursor()

print('Creating login_credential schema under patient_analytics catalog...')

cursor.execute('CREATE SCHEMA IF NOT EXISTS patient_analytics.login_credential')
print('Schema patient_analytics.login_credential: OK')

cursor.execute('''
CREATE TABLE IF NOT EXISTS patient_analytics.login_credential.hospital_login (
    hospital_id     STRING NOT NULL,
    user_name       STRING,
    hospital_name   STRING,
    email           STRING,
    hashed_password STRING,
    reset_code      STRING,
    created_at      STRING
)
USING DELTA
''')
print('Table hospital_login: OK')

cursor.execute('''
CREATE TABLE IF NOT EXISTS patient_analytics.login_credential.hospital_roles (
    hospital_id STRING NOT NULL,
    role        STRING
)
USING DELTA
''')
print('Table hospital_roles: OK')

cursor.close()
conn.close()
print('')
print('Done! patient_analytics.login_credential is ready.')
