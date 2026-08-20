from sqlalchemy import Column, String, DateTime
from database import Base
import datetime

class Hospital(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, index=True)
    user_name = Column(String, index=True)
    hospital_name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    role = Column(String)
    hashed_password = Column(String)
    reset_code = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
