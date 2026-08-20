import os
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

load_dotenv()
sender_email = os.getenv("SMTP_EMAIL", "dropoffanalytics@gmail.com")
sender_password = os.getenv("SMTP_PASSWORD", "")
to_email = "test@example.com" # Just testing connection

msg = MIMEMultipart()
msg['From'] = sender_email
msg['To'] = to_email
msg['Subject'] = "Test Email"
msg.attach(MIMEText("Test", 'plain'))

try:
    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.set_debuglevel(1)
    server.starttls()
    server.login(sender_email, sender_password)
    print("Login successful!")
    server.quit()
except Exception as e:
    print(f"Error: {e}")
