import requests

def send_sms_textmagic(to_number, message):
    try:
        # Your TextMagic credentials
        username = "simonbarnett1"
        api_key = "Nbi5wHksJdtXSlrHCNk9kt7KXnPyjO"
        url = "https://rest.textmagic.com/api/v2/messages"
        
        # Payload with the phone number and message
        payload = {
            "text": message,
            "phones": to_number
        }
        
        # Headers with X-TM-Username and X-TM-Key
        headers = {
            "X-TM-Username": username,
            "X-TM-Key": api_key
        }
        
        # Send the request
        response = requests.post(url, data=payload, headers=headers)
        
        if response.status_code == 201:
            print("Message sent successfully!")
            print(f"Response: {response.json()}")
            return True
        else:
            print(f"Error: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"Error sending SMS: {str(e)}")
        return False

# Test the function
if __name__ == "__main__":
    recipient_number = "+447989389179"
    message_text = "Hello World!"
    send_sms_textmagic(recipient_number, message_text)