import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

# Email Configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "your_email@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "your_app_password")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER)

def send_email(to: str, subject: str, body: str):
    """
    Send email using SMTP.
    If no credentials are set, just print for testing.
    """
    if not to:
        return {"status": "skipped", "reason": "No email address"}
    
    if SMTP_USER == "your_email@gmail.com":
        print(f"[EMAIL TEST] To: {to} | Subject: {subject}")
        return {"status": "test", "to": to}
    
    try:
        msg = MIMEMultipart()
        msg['From'] = FROM_EMAIL
        msg['To'] = to
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body, 'plain'))
        
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
        return {"status": "sent"}
    except Exception as e:
        print(f"Email Error: {e}")
        return {"status": "error", "message": str(e)}