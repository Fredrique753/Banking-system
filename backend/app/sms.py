import requests
import os

# Africa's Talking Configuration
AFRICASTALKING_API_KEY = os.getenv("AFRICASTALKING_API_KEY", "YOUR_API_KEY")
AFRICASTALKING_USERNAME = os.getenv("AFRICASTALKING_USERNAME", "YOUR_USERNAME")
AFRICASTALKING_SENDER = os.getenv("AFRICASTALKING_SENDER", "YOUR_SENDER_ID")

def send_sms(phone: str, message: str):
    """
    Send SMS using Africa's Talking API.
    If no API key is set, just print the message for testing.
    """
    if not phone:
        return {"status": "skipped", "reason": "No phone number"}
    
    # Remove any non-numeric characters from phone
    phone = ''.join(filter(str.isdigit, phone))
    if not phone.startswith('256'):
        phone = '256' + phone[-9:]
    
    # For testing without API key
    if AFRICASTALKING_API_KEY == "YOUR_API_KEY":
        print(f"[SMS TEST] To: {phone} | Message: {message[:50]}...")
        return {"status": "test", "phone": phone}
    
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
        response = requests.post(url, headers=headers, data=data)
        return response.json()
    except Exception as e:
        print(f"SMS Error: {e}")
        return {"status": "error", "message": str(e)}