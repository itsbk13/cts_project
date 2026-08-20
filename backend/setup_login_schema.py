import os
from databricks import sql
from dotenv import load_dotenv

load_dotenv('.env')

hostname  = os.getenv('DATABRICKS_SERVER_HOSTNAME')
http_path = os.getenv('DATABRICKS_HTTP_PATH')
token     = os.getenv('DATABRICKS_TOKEN')

conn   = sql.connect(server_hostname=hostname, http_path=http_path, access_token=token)
cursor = conn.cursor()

print('Creating Login_Crendencials schema and tables...')

# 1. Create catalog if needed (use hive_metastore or Unity Catalog default)
# We'll use the default catalog (usually hive_metastore or workspace)
cursor.execute('CREATE SCHEMA IF NOT EXISTS Login_Crendencials')
print('Schema Login_Crendencials: OK')

# 2. hospital_login table
cursor.execute('''
CREATE TABLE IF NOT EXISTS Login_Crendencials.hospital_login (
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

# 3. hospital_roles table
cursor.execute('''
CREATE TABLE IF NOT EXISTS Login_Crendencials.hospital_roles (
    hospital_id STRING NOT NULL,
    role        STRING
)
USING DELTA
''')
print('Table hospital_roles: OK')

cursor.close()
conn.close()
print('')
print('Done! Login_Crendencials schema is ready.')
