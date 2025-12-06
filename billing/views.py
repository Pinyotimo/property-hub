from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import json

# Mpesa client
from django_daraja.mpesa.core import MpesaClient

# Import your Transaction model
from .models import Transaction


# Landing page for billing app
def index(request):
    return HttpResponse("Billing app is working!")


# Trigger an STK Push request (with form input)
@csrf_exempt
def stk_push(request):
    if request.method == 'POST':
        phone_number = request.POST.get('phone_number')
        amount = int(request.POST.get('amount'))

        cl = MpesaClient()
        account_reference = 'PropertyHub'
        transaction_desc = 'Payment for property listing'
        callback_url = 'https://your-ngrok-url/billing/mpesa/callback/'  # must be public

        response = cl.stk_push(
            phone_number,
            amount,
            account_reference,
            transaction_desc,
            callback_url
        )

        # Save initial transaction (pending)
        Transaction.objects.create(
            user=request.user if request.user.is_authenticated else None,
            phone_number=phone_number,
            amount=amount,
            reference=account_reference,
            status="pending"
        )

        return HttpResponse(response)

    # Show form if GET request
    return render(request, 'billing/stk_form.html')


# Handle M-Pesa callback (Safaricom sends transaction result here)
@csrf_exempt
def mpesa_callback(request):
    if request.method == 'POST':
        data = json.loads(request.body.decode('utf-8'))
        print("M-Pesa Callback Data:", data)

        # Parse callback
        body = data.get("Body", {})
        stk_callback = body.get("stkCallback", {})
        result_code = stk_callback.get("ResultCode")
        result_desc = stk_callback.get("ResultDesc")

        if result_code == 0:  # success
            metadata = stk_callback.get("CallbackMetadata", {}).get("Item", [])
            receipt = next((item["Value"] for item in metadata if item["Name"] == "MpesaReceiptNumber"), None)
            amount = next((item["Value"] for item in metadata if item["Name"] == "Amount"), None)
            phone = next((item["Value"] for item in metadata if item["Name"] == "PhoneNumber"), None)

            # Update transaction
            Transaction.objects.filter(phone_number=phone, status="pending").update(
                status="success",
                receipt_number=receipt,
                amount=amount
            )
        else:
            # Mark failed
            Transaction.objects.filter(status="pending").update(status="failed")

        return JsonResponse({"ResultCode": 0, "ResultDesc": "Accepted"})
    return JsonResponse({"ResultCode": 1, "ResultDesc": "Invalid request"})