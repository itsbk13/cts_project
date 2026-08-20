import os
from databricks import sql
from dotenv import load_dotenv

load_dotenv('.env')

hostname  = os.getenv('DATABRICKS_SERVER_HOSTNAME')
http_path = os.getenv('DATABRICKS_HTTP_PATH')
token     = os.getenv('DATABRICKS_TOKEN')

conn   = sql.connect(server_hostname=hostname, http_path=http_path, access_token=token)
cursor = conn.cursor()

print('Creating patient_analytics schema and prototype tables...')

# 1. Create the patient_analytics schema
cursor.execute('CREATE SCHEMA IF NOT EXISTS patient_analytics')
print('Schema patient_analytics: OK')

# 2. Create the journey prototype schema (used as LIKE template for hospital schemas)
cursor.execute('CREATE SCHEMA IF NOT EXISTS patient_analytics.journey')
print('Schema patient_analytics.journey: OK')

# 3. Prototype patients table
cursor.execute('''
CREATE TABLE IF NOT EXISTS patient_analytics.journey.patients (
    Patient_ID       STRING NOT NULL,
    Age              INT,
    Region           STRING,
    Diagnosis        STRING,
    Therapy          STRING,
    Diagnosis_Date   DATE,
    Prescription_Date DATE,
    Insurance_Type   STRING,
    Payer            STRING,
    Copay_Amount     DOUBLE,
    Prior_Authorization INT,
    Pharmacy_Type    STRING,
    created_at       TIMESTAMP
)
USING DELTA
''')
print('Prototype table patients: OK')

# 4. Prototype journey_events table
cursor.execute('''
CREATE TABLE IF NOT EXISTS patient_analytics.journey.journey_events (
    Journey_Event_ID STRING NOT NULL,
    Patient_ID       STRING NOT NULL,
    Current_Stage    STRING,
    Event_Date       DATE,
    PA_Delay_Days    INT,
    Stockout_Flag    INT,
    Processing_Date  DATE,
    Outcome          STRING,
    Contact_Attempts INT,
    Support_Enrollment INT,
    Claim_Status     STRING,
    Notes            STRING,
    created_at       TIMESTAMP
)
USING DELTA
''')
print('Prototype table journey_events: OK')

# 5. Prototype journey_outcomes table
cursor.execute('''
CREATE TABLE IF NOT EXISTS patient_analytics.journey.journey_outcomes (
    Outcome_ID  STRING NOT NULL,
    Patient_ID  STRING NOT NULL,
    Outcome     STRING,
    Outcome_Date DATE,
    created_at  TIMESTAMP
)
USING DELTA
''')
print('Prototype table journey_outcomes: OK')

# 6. Prototype statistical_results table
cursor.execute('''
CREATE TABLE IF NOT EXISTS patient_analytics.journey.statistical_results (
    Result_ID   STRING NOT NULL,
    Metric_Type STRING,
    Metric_Name STRING,
    Metric_Value DOUBLE,
    Run_Date    DATE,
    created_at  TIMESTAMP
)
USING DELTA
''')
print('Prototype table statistical_results: OK')

cursor.close()
conn.close()
print('')
print('Done! All patient_analytics tables are ready.')
