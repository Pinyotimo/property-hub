import requests
import base64
import json
from datetime import datetime
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class MpesaAPI:
    def __init__(self):
        self.config = settings.MPESA_CONFIG
        self.base_url = self.config['BASE_URL']
        self.consumer_key = self.config['CONSUMER_KEY']
        self.consumer_secret = self.config['CONSUMER_SECRET']
        self.shortcode = self.config['SHORTCODE']
        self.passkey = self.config['PASSKEY']
        self.access_token = None

    def get_access_token(self):
        """Get OAuth access token from M-Pesa"""
        try:
            api_url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
            response = requests.get(api_url, auth=(self.consumer_key, self.consumer_secret))

            if response.status_code == 200:
                self.access_token = response.json()['access_token']
                logger.info("M-Pesa access token obtained successfully")
                return self.access_token
            else:
                logger.error(f"Failed to get access token: {response.text}")
                return None
        except Exception as e:
            logger.error(f"Error getting access token: {str(e)}")
            return None

    def generate_password(self):
        """Generate password for STK Push"""
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password_str = f"{self.shortcode}{self.passkey}{timestamp}"
        password = base64.b64encode(password_str.encode()).decode('utf-8')
        return password, timestamp

    def stk_push(self, phone_number, amount, account_reference, transaction_desc):
        """Initiate STK Push"""
        if not self.access_token:
            self.get_access_token()

        if not self.access_token:
            return {"error": "Failed to obtain access token"}

        # Format phone number (remove + and ensure it starts with 254)
        if phone_number.startswith('+'):
            phone_number = phone_number[1:]
        if phone_number.startswith('0'):
            phone_number = '254' + phone_number[1:]
        elif not phone_number.startswith('254'):
            phone_number = '254' + phone_number

        password, timestamp = self.generate_password()

        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(amount),
            "PartyA": phone_number,
            "PartyB": self.shortcode,
            "PhoneNumber": phone_number,
            "CallBackURL": self.config['CALLBACK_URL'],
            "AccountReference": account_reference,
            "TransactionDesc": transaction_desc
        }

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }

        try:
            api_url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"
            response = requests.post(api_url, json=payload, headers=headers)

            if response.status_code == 200:
                result = response.json()
                logger.info(f"STK Push initiated: {result}")
                return result
            else:
                logger.error(f"STK Push failed: {response.text}")
                return {"error": response.text}
        except Exception as e:
            logger.error(f"Error initiating STK Push: {str(e)}")
            return {"error": str(e)}

    def query_stk_push_status(self, checkout_request_id):
        """Query STK Push payment status"""
        if not self.access_token:
            self.get_access_token()

        if not self.access_token:
            return {"error": "Failed to obtain access token"}

        password, timestamp = self.generate_password()

        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "CheckoutRequestID": checkout_request_id
        }

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }

        try:
            api_url = f"{self.base_url}/mpesa/stkpushquery/v1/query"
            response = requests.post(api_url, json=payload, headers=headers)

            if response.status_code == 200:
                result = response.json()
                logger.info(f"STK Query result: {result}")
                return result
            else:
                logger.error(f"STK Query failed: {response.text}")
                return {"error": response.text}
        except Exception as e:
            logger.error(f"Error querying STK status: {str(e)}")
            return {"error": str(e)}


def format_phone_number(phone):
    """Format phone number for M-Pesa API"""
    if phone.startswith('+'):
        phone = phone[1:]
    if phone.startswith('0'):
        phone = '254' + phone[1:]
    elif not phone.startswith('254'):
        phone = '254' + phone
    return phone
