import os
from databricks import sql

def init_databricks_auth():
    print("\n--- Initializing Databricks Authentication Schema ---")
    host = os.getenv("DATABRICKS_SERVER_HOSTNAME")
    path = os.getenv("DATABRICKS_HTTP_PATH")
    token = os.getenv("DATABRICKS_TOKEN")
    
    if not all([host, path, token]):
        print("Error: Missing Databricks credentials in environment variables.")
        return

    try:
        connection = sql.connect(
            server_hostname=host,
            http_path=path,
            access_token=token
        )
        cursor = connection.cursor()
        
        # 1. Create Schema
        cursor.execute("CREATE SCHEMA IF NOT EXISTS Login_Crendencials")
        
        # 2. Create hospital_login table
        login_table_query = """
        CREATE TABLE IF NOT EXISTS Login_Crendencials.hospital_login (
            hospital_id STRING NOT NULL,
            user_name STRING,
            hospital_name STRING,
            email STRING,
            hashed_password STRING,
            reset_code STRING,
            created_at TIMESTAMP
        )
        """
        # Primary Key syntax is generally supported via constraints or just letting it be managed in Delta, 
        # but Delta supports table constraints. Since we just need the table structure:
        # Databricks allows constraints, but simpler to omit for delta unless explicitly needed:
        # "ALTER TABLE Login_Crendencials.hospital_login ADD CONSTRAINT pk_hospital_id PRIMARY KEY (hospital_id)"
        
        cursor.execute(login_table_query)
        
        # 3. Create hospital_roles table
        roles_table_query = """
        CREATE TABLE IF NOT EXISTS Login_Crendencials.hospital_roles (
            hospital_id STRING NOT NULL,
            role STRING
        )
        """
        cursor.execute(roles_table_query)
        
        print("Login_Crendencials schema and tables successfully verified/created!")
        
        cursor.close()
        connection.close()
    except Exception as e:
        print(f"Failed to initialize Databricks auth tables: {str(e)}")

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    init_databricks_auth()
