from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

# Import Mpesa client from django-daraja
from django_daraja.mpesa.core import MpesaClient


# Landing page for billing app
def index(request):
    return HttpResponse("Billing app is working!")


# Trigger an STK Push request
def stk_push(request):
    cl = MpesaClient()
    phone_number = '2547XXXXXXXX'  # Replace with dynamic user phone number
    amount = 100  # Replace with dynamic amount
    account_reference = 'PropertyHub'
    transaction_desc = 'Payment for property listing'
    callback_url = 'https://yourdomain.com/billing/mpesa/callback/'  # Must be accessible publicly

    response = cl.stk_push(
        phone_number,
        amount,
        account_reference,
        transaction_desc,
        callback_url
    )
    return HttpResponse(response)


# Handle M-Pesa callback (Safaricom sends transaction result here)
@csrf_exempt
def mpesa_callback(request):
    if request.method == 'POST':
        data = json.loads(request.body.decode('utf-8'))
        # TODO: Save transaction details into your Transaction model
        # Example: status, amount, receipt number, etc.
        print("M-Pesa Callback Data:", data)

        # Respond to Safaricom that callback was received successfully
        return JsonResponse({"ResultCode": 0, "ResultDesc": "Accepted"})
    else:
        return JsonResponse({"ResultCode": 1, "ResultDesc": "Invalid request method"})