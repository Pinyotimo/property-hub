import json
import logging
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.conf import settings
from properties.models import Property
from .models import Payment, MpesaTransaction
from .utils import MpesaAPI, format_phone_number

logger = logging.getLogger(__name__)


@login_required
def initiate_payment(request, property_id):
    """Initiate M-Pesa STK Push payment for property feature"""
    property_obj = get_object_or_404(Property, id=property_id)

    if request.method == 'POST':
        feature = request.POST.get('feature')
        phone_number = request.POST.get('phone_number')

        if not feature or not phone_number:
            messages.error(request, 'Please select a feature and provide a phone number.')
            return redirect('initiate_payment', property_id=property_id)

        # Validate feature choice
        valid_features = dict(Payment.FEATURE_CHOICES)
        if feature not in valid_features:
            messages.error(request, 'Invalid feature selected.')
            return redirect('initiate_payment', property_id=property_id)

        # Get amount based on feature
        amounts = {
            'spotlight': 1000,
            'featured': 2000,
            'premium': 4000,
        }
        amount = amounts.get(feature)

        if not amount:
            messages.error(request, 'Invalid feature amount.')
            return redirect('initiate_payment', property_id=property_id)

        # Format phone number
        formatted_phone = format_phone_number(phone_number)

        # Create payment record
        payment = Payment.objects.create(
            user=request.user,
            property=property_obj,
            feature=feature,
            amount=amount,
            phone_number=formatted_phone,
            status='pending'
        )

        # Initiate STK Push
        mpesa_api = MpesaAPI()
        account_reference = f"Property-{property_obj.id}-{payment.id}"
        transaction_desc = f"Payment for {valid_features[feature]}"

        stk_response = mpesa_api.stk_push(
            phone_number=formatted_phone,
            amount=amount,
            account_reference=account_reference,
            transaction_desc=transaction_desc
        )

        if 'error' in stk_response:
            payment.status = 'failed'
            payment.response_description = stk_response['error']
            payment.save()
            messages.error(request, f'Payment initiation failed: {stk_response["error"]}')
            return redirect('initiate_payment', property_id=property_id)

        # Update payment with STK response
        payment.merchant_request_id = stk_response.get('MerchantRequestID')
        payment.checkout_request_id = stk_response.get('CheckoutRequestID')
        payment.response_code = stk_response.get('ResponseCode')
        payment.response_description = stk_response.get('ResponseDescription')
        payment.customer_message = stk_response.get('CustomerMessage')
        payment.save()

        messages.success(request, 'Payment request sent to your phone. Please check your M-Pesa and authorize the payment.')
        return redirect('payment_status', payment_id=payment.id)

    # GET request - show payment form
    context = {
        'property': property_obj,
        'features': Payment.FEATURE_CHOICES,
    }
    return render(request, 'payments/initiate_payment.html', context)


@login_required
def payment_status(request, payment_id):
    """Check payment status"""
    payment = get_object_or_404(Payment, id=payment_id, user=request.user)

    # If payment is completed, redirect to success
    if payment.status == 'completed':
        return redirect('payment_success', payment_id=payment.id)

    # If payment failed, redirect to failure
    if payment.status == 'failed':
        return redirect('payment_failure', payment_id=payment.id)

    context = {
        'payment': payment,
    }
    return render(request, 'payments/payment_status.html', context)


@login_required
def payment_success(request, payment_id):
    """Payment success page"""
    payment = get_object_or_404(Payment, id=payment_id, user=request.user)
    transaction = payment.mpesa_transaction if hasattr(payment, 'mpesa_transaction') else None

    context = {
        'payment': payment,
        'transaction': transaction,
    }
    return render(request, 'payments/payment_success.html', context)


@login_required
def payment_failure(request, payment_id):
    """Payment failure page"""
    payment = get_object_or_404(Payment, id=payment_id, user=request.user)

    context = {
        'payment': payment,
    }
    return render(request, 'payments/payment_failure.html', context)


@csrf_exempt
@require_POST
def mpesa_callback(request):
    """Handle M-Pesa callback"""
    try:
        callback_data = json.loads(request.body)
        logger.info(f"M-Pesa Callback received: {callback_data}")

        # Extract callback data
        stk_callback = callback_data.get('Body', {}).get('stkCallback', {})

        if not stk_callback:
            logger.error("Invalid callback data structure")
            return JsonResponse({"ResultCode": 1, "ResultDesc": "Invalid callback data"})

        merchant_request_id = stk_callback.get('MerchantRequestID')
        checkout_request_id = stk_callback.get('CheckoutRequestID')
        result_code = stk_callback.get('ResultCode')
        result_desc = stk_callback.get('ResultDesc')
        callback_metadata = stk_callback.get('CallbackMetadata', {}).get('Item', [])

        # Find the payment
        try:
            payment = Payment.objects.get(
                merchant_request_id=merchant_request_id,
                checkout_request_id=checkout_request_id
            )
        except Payment.DoesNotExist:
            logger.error(f"Payment not found for MerchantRequestID: {merchant_request_id}")
            return JsonResponse({"ResultCode": 1, "ResultDesc": "Payment not found"})

        # Update payment status
        if result_code == 0:
            # Payment successful
            payment.status = 'completed'

            # Extract transaction details from callback metadata
            transaction_data = {}
            for item in callback_metadata:
                name = item.get('Name')
                value = item.get('Value')
                transaction_data[name] = value

            # Create MpesaTransaction record
            MpesaTransaction.objects.create(
                payment=payment,
                mpesa_receipt_number=transaction_data.get('MpesaReceiptNumber'),
                transaction_date=datetime.fromtimestamp(transaction_data.get('TransactionDate') / 1000) if transaction_data.get('TransactionDate') else None,
                phone_number=transaction_data.get('PhoneNumber'),
                amount=transaction_data.get('Amount'),
                result_code=str(result_code),
                result_desc=result_desc,
            )

            logger.info(f"Payment {payment.id} completed successfully")
        else:
            # Payment failed
            payment.status = 'failed'
            logger.info(f"Payment {payment.id} failed: {result_desc}")

        payment.save()

        return JsonResponse({"ResultCode": 0, "ResultDesc": "Callback processed successfully"})

    except Exception as e:
        logger.error(f"Error processing M-Pesa callback: {str(e)}")
        return JsonResponse({"ResultCode": 1, "ResultDesc": "Callback processing failed"})
