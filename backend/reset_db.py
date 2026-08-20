import database
import models

# Drop all tables and recreate them
print("Dropping tables...")
models.Base.metadata.drop_all(bind=database.engine)
print("Creating tables...")
models.Base.metadata.create_all(bind=database.engine)
print("Database reset successfully.")
