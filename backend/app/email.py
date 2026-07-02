"""
Email Notification Module
Supports SMTP email sending with graceful fallback to simulation mode.
"""

import os
import sys

# Try to import smtplib (should always be available in Python)
try:
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    SMTP_AVAILABLE = True
except ImportError:
    SMTP_AVAILABLE = False

# Email Configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER)

def send_email(to: str, subject: str, body: str, html: str = None) -> dict:
    """
    Send an email using SMTP.
    
    Args:
        to: Recipient email address
        subject: Email subject
        body: Plain text body
        html: Optional HTML body
    
    Returns:
        dict: Status of the email send attempt
    """
    # Skip empty email addresses
    if not to:
        return {"status": "skipped", "reason": "No email address provided"}
    
    # --- SIMULATION MODE (No SMTP credentials) ---
    if not SMTP_USER or SMTP_USER == "":
        print(f"[EMAIL SIMULATION] To: {to} | Subject: {subject}")
        print(f"[EMAIL SIMULATION] Body: {body[:200]}...")
        return {
            "status": "simulated",
            "to": to,
            "subject": subject,
            "note": "Set SMTP_USER and SMTP_PASSWORD to enable real emails"
        }
    
    if not SMTP_AVAILABLE:
        print("[ERROR] smtplib not available")
        return {"status": "error", "reason": "smtplib not available"}
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = FROM_EMAIL or SMTP_USER
        msg['To'] = to
        msg['Subject'] = subject
        
        # Attach plain text body
        msg.attach(MIMEText(body, 'plain'))
        
        # Attach HTML body if provided
        if html:
            msg.attach(MIMEText(html, 'html'))
        
        # Send email
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
        return {
            "status": "sent",
            "to": to,
            "subject": subject
        }
    
    except smtplib.SMTPAuthenticationError:
        print(f"[EMAIL ERROR] Authentication failed for {SMTP_USER}")
        return {"status": "error", "reason": "Authentication failed"}
    
    except smtplib.SMTPRecipientsRefused:
        print(f"[EMAIL ERROR] Recipient refused: {to}")
        return {"status": "error", "reason": "Recipient refused"}
    
    except smtplib.SMTPException as e:
        print(f"[EMAIL ERROR] {e}")
        return {"status": "error", "reason": str(e)}
    
    except Exception as e:
        print(f"[EMAIL ERROR] Unexpected error: {e}")
        return {"status": "error", "reason": str(e)}

def send_loan_notification_email(to: str, client_name: str, loan_id: int, amount: float, status: str) -> dict:
    """
    Send a loan-specific email notification.
    
    Args:
        to: Client's email address
        client_name: Client's full name
        loan_id: Loan ID
        amount: Loan amount in UGX
        status: Loan status (approved, rejected, disbursed)
    """
    messages = {
        "approved": {
            "subject": f"🎉 Loan Approved - #{loan_id}",
            "body": f"Dear {client_name},\n\nYour loan of UGX {amount:,.0f} has been APPROVED!\n\nPlease visit our office to complete the disbursement process.\n\nThank you for choosing us.",
            "html": f"""
            <h2>🎉 Loan Approved!</h2>
            <p>Dear <strong>{client_name}</strong>,</p>
            <p>Your loan of <strong>UGX {amount:,.0f}</strong> has been <strong style="color:green;">APPROVED</strong>!</p>
            <p>Please visit our office to complete the disbursement process.</p>
            <p>Thank you for choosing us.</p>
            """
        },
        "rejected": {
            "subject": f"Loan Application Update - #{loan_id}",
            "body": f"Dear {client_name},\n\nYour loan application #{loan_id} for UGX {amount:,.0f} has been reviewed and not approved at this time.\n\nPlease contact us for more details.\n\nThank you for your interest.",
            "html": f"""
            <h2>Loan Application Update</h2>
            <p>Dear <strong>{client_name}</strong>,</p>
            <p>Your loan application #{loan_id} for <strong>UGX {amount:,.0f}</strong> has been reviewed and <strong style="color:red;">not approved</strong> at this time.</p>
            <p>Please contact us for more details.</p>
            <p>Thank you for your interest.</p>
            """
        },
        "disbursed": {
            "subject": f"💰 Loan Disbursed - #{loan_id}",
            "body": f"Dear {client_name},\n\nYour loan of UGX {amount:,.0f} has been DISBURSED!\n\nYour first payment is due in 30 days.\n\nThank you for choosing us.",
            "html": f"""
            <h2>💰 Loan Disbursed!</h2>
            <p>Dear <strong>{client_name}</strong>,</p>
            <p>Your loan of <strong>UGX {amount:,.0f}</strong> has been <strong style="color:blue;">DISBURSED</strong>!</p>
            <p>Your first payment is due in 30 days.</p>
            <p>Thank you for choosing us.</p>
            """
        }
    }
    
    template = messages.get(status)
    if not template:
        return send_email(to, f"Loan #{loan_id} Update", f"Your loan #{loan_id} status has been updated to {status}.")
    
    return send_email(to, template["subject"], template["body"], template.get("html"))