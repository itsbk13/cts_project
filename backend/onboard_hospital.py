# =============================================================
# HOSPITAL ONBOARDING  AUTO SCHEMA SETUP
# =============================================================
# PURPOSE:
#   When a new hospital registers on your platform, your FastAPI
#   backend calls `onboard_hospital(hospital_id)` from this file.
#   It automatically creates the dedicated Databricks schema and
#   all required Delta Tables for that hospital.
#
#   No one needs to manually run SQL in Databricks ever again.
#
# WHERE TO CALL THIS:
#   In your FastAPI backend, call `onboard_hospital(hospital_id)`
#   inside the endpoint that creates a new hospital account.
#
#   Example:
#       @router.post("/admin/hospitals")
#       def create_hospital(data: HospitalCreate):
#           ...save hospital to your auth DB...
#           onboard_hospital(data.hospital_id)   <-- add this line
#           return {"status": "created"}
#
# REQUIREMENTS:
#   pip install databricks-sql-connector python-dotenv
# =============================================================

import os
from databricks import sql
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

DATABRICKS_SERVER_HOSTNAME = os.getenv("DATABRICKS_SERVER_HOSTNAME")
DATABRICKS_HTTP_PATH       = os.getenv("DATABRICKS_HTTP_PATH")
DATABRICKS_TOKEN           = os.getenv("DATABRICKS_TOKEN")

# The catalog all hospitals share
CATALOG = "patient_analytics"

# The prototype schema to copy table structures from
PROTOTYPE_SCHEMA = "journey"


def onboard_hospital(hospital_id: str):
    """
    Automatically creates a dedicated Databricks schema and all
    Delta Tables for a new hospital. Safe to call multiple times
    (uses IF NOT EXISTS so it never breaks if run again).

    Args:
        hospital_id (str): Unique slug for the hospital, e.g. "hosp_mumbai_01"
    """
    print(f" Onboarding hospital: {hospital_id}...")

    connection = sql.connect(
        server_hostname=DATABRICKS_SERVER_HOSTNAME,
        http_path=DATABRICKS_HTTP_PATH,
        access_token=DATABRICKS_TOKEN
    )
    cursor = connection.cursor()

    try:
        # 1. Create the hospital's schema
        cursor.execute(f"CREATE SCHEMA IF NOT EXISTS {CATALOG}.{hospital_id}")
        print(f"   Schema created: {CATALOG}.{hospital_id}")

        # 2. Create all tables by copying structure from the prototype schema
        tables = ["patients", "journey_events", "journey_outcomes", "statistical_results"]
        for table in tables:
            cursor.execute(f"""
                CREATE TABLE IF NOT EXISTS {CATALOG}.{hospital_id}.{table}
                LIKE {CATALOG}.{PROTOTYPE_SCHEMA}.{table}
            """)
            print(f"   Table created: {CATALOG}.{hospital_id}.{table}")

        # 3. Grant access to the hospital's backend service account
        # (uncomment when you have per-hospital service principals set up)
        # cursor.execute(f"""
        #     GRANT USE SCHEMA ON SCHEMA {CATALOG}.{hospital_id}
        #     TO `{hospital_id}_backend_user`
        # """)

        print(f"\n Hospital '{hospital_id}' is fully onboarded and ready!")

    except Exception as e:
        print(f" Onboarding failed for {hospital_id}: {e}")
        raise e

    finally:
        cursor.close()
        connection.close()


# =============================================================
# Quick manual test  run this file directly to onboard a
# single hospital without going through the API:
#
#   python backend/onboard_hospital.py
# =============================================================
if __name__ == "__main__":
    TEST_HOSPITAL_ID = "hosp_mumbai_01"
    onboard_hospital(TEST_HOSPITAL_ID)

