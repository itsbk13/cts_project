import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_database():
    try:
        # Connect to the default database
        connection = psycopg2.connect(
            user="postgres",
            password="boopesh@2046",
            host="localhost",
            port="5432"
        )
        connection.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = connection.cursor()
        
        # Check if database exists
        cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'hospital_db'")
        exists = cursor.fetchone()
        
        if not exists:
            cursor.execute("CREATE DATABASE hospital_db")
            print("Database 'hospital_db' created successfully.")
        else:
            print("Database 'hospital_db' already exists.")
            
    except Exception as e:
        print(f"Error while connecting to PostgreSQL: {e}")
    finally:
        if 'connection' in locals() and connection:
            cursor.close()
            connection.close()

if __name__ == "__main__":
    create_database()
