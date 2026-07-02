"""
SMS Notification Module
Supports Africa's Talking API with graceful fallback to simulation mode.
"""

import os
import sys

# Try to import requests, but fall back to simulation if not installed
try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    requests = None

# Africa's Talking Configuration
AFRICASTALKING_API_KEY = os.getenv("AFRICASTALKING_API_KEY", "")
AFRICASTALKING_USERNAME = os.getenv("AFRICASTALKING_USERNAME", "sandbox")
AFRICASTALKING_SENDER = os.getenv("AFRICASTALKING_SENDER", "AFRICASTKNG")

def send_sms(phone: str, message: str) -> dict:
    """
    Send SMS using Africa's Talking API.
    
    Args:
        phone: Phone number (will be formatted to Ugandan format if needed)
        message: SMS content (max 160 characters per segment)
    
    Returns:
        dict: Status of the SMS send attempt
    """
    # Skip empty phone numbers
    if not phone:
        return {"status": "skipped", "reason": "No phone number provided"}
    
    # Format phone number to Ugandan format (256)
    phone = ''.join(filter(str.isdigit, phone))
    if not phone.startswith('256'):
        # If it starts with 0, remove it and add 256
        if phone.startswith('0'):
            phone = '256' + phone[1:]
        else:
            phone = '256' + phone
    
    # Ensure phone is at least 12 digits (256 + 9 digits)
    if len(phone) < 12:
        return {"status": "error", "reason": f"Invalid phone number: {phone}"}
    
    # --- SIMULATION MODE (No API Key) ---
    if not AFRICASTALKING_API_KEY or AFRICASTALKING_API_KEY == "":
        print(f"[SMS SIMULATION] To: {phone} | Message: {message[:100]}...")
        return {
            "status": "simulated",
            "phone": phone,
            "message": message[:100] + ("..." if len(message) > 100 else ""),
            "note": "Set AFRICASTALKING_API_KEY to enable real SMS"
        }
    
    # --- REAL SMS SEND ---
    if not REQUESTS_AVAILABLE:
        print("[ERROR] requests library not installed. Install with: pip install requests")
        return {"status": "error", "reason": "requests library not available"}
    
    try:
        url = "https://api.africastalking.com/version1/messaging"
        headers = {
            "apiKey": AFRICASTALKING_API_KEY,
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = {
            "username": AFRICASTALKING_USERNAME,
            "to": phone,
            "message": message,
            "from": AFRICASTALKING_SENDER
        }
        
        response = requests.post(url, headers=headers, data=data, timeout=10)
        response.raise_for_status()
        
        result = response.json()
        return {
            "status": "sent",
            "phone": phone,
            "response": result
        }
    
    except requests.exceptions.Timeout:
        print(f"[SMS ERROR] Timeout sending to {phone}")
        return {"status": "error", "reason": "Timeout"}
    
    except requests.exceptions.RequestException as e:
        print(f"[SMS ERROR] {e}")
        return {"status": "error", "reason": str(e)}
    
    except Exception as e:
        print(f"[SMS ERROR] Unexpected error: {e}")
        return {"status": "error", "reason": str(e)}

def send_loan_notification(phone: str, loan_id: int, amount: float, status: str) -> dict:
    """
    Send a loan-specific notification.
    
    Args:
        phone: Client's phone number
        loan_id: Loan ID
        amount: Loan amount in UGX
        status: Loan status (approved, rejected, disbursed)
    """
    messages = {
        "approved": f"🎉 Your loan of UGX {amount:,.0f} has been APPROVED! Please visit our office for disbursement.",
        "rejected": f"❌ Your loan application #{loan_id} has been reviewed and not approved at this time. Please contact us for more details.",
        "disbursed": f"💰 Your loan of UGX {amount:,.0f} has been DISBURSED. Your first payment is due in 30 days.",
        "pending": f"📋 Your loan application #{loan_id} for UGX {amount:,.0f} has been received. We will notify you once reviewed."
    }
    
    message = messages.get(status, f"Loan #{loan_id} status updated to {status}.")
    return send_sms(phone, message)