import bcrypt
import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = os.getenv("SECRET_KEY", "my_secret_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 1 day

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password):
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def generate_user_id():
    prefix = "USER"
    random_digits = ''.join(random.choices(string.digits, k=6))
    return f"{prefix}-{random_digits}"

def send_registration_email(to_email: str, user_id: str):
    sender_email = os.getenv("SMTP_EMAIL", "dropoffanalytics@gmail.com")
    sender_password = os.getenv("SMTP_PASSWORD", "")
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    
    if not sender_password or sender_password == "your_app_password_here":
        print(f"\n[WARNING] Email not sent to {to_email}. Please configure SMTP_PASSWORD in .env file.")
        return
        
    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = to_email
    msg['Subject'] = "Welcome! Your User ID for Hospital Portal"
    
    body = f"Hello,\n\nYour account has been created successfully.\nYour User ID for login is: {user_id}\n\nPlease keep this secure."
    msg.attach(MIMEText(body, 'plain'))
    
    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        print(f"Successfully sent email to {to_email}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")

def generate_reset_code():
    return ''.join(random.choices(string.digits, k=6))

def send_reset_code_email(to_email: str, code: str):
    sender_email = os.getenv("SMTP_EMAIL", "dropoffanalytics@gmail.com")
    sender_password = os.getenv("SMTP_PASSWORD", "")
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    
    if not sender_password or sender_password == "your_app_password_here":
        print(f"\n[WARNING] Reset Email not sent to {to_email}. Please configure SMTP_PASSWORD in .env file.")
        return
        
    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = to_email
    msg['Subject'] = "Password Reset Code for Hospital Portal"
    
    body = f"Hello,\n\nYou have requested to reset your password.\nYour 6-digit verification code is: {code}\n\nIf you did not request this, please ignore this email."
    msg.attach(MIMEText(body, 'plain'))
    
    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        print(f"Successfully sent reset email to {to_email}")
    except Exception as e:
        print(f"Failed to send reset email to {to_email}: {e}")
