from django.db import models
from django.contrib.auth import get_user_model
from properties.models import Property


# Create your models here.
User = get_user_model()

class Payment(models.Model):
    FEATURE_CHOICES = [
        ('featured', 'Featured Listing - KES 2000'),
        ('premium', 'Premium Placement - KES 4000'),
        ('spotlight', 'Spotlight Listing - KES 1000'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='payments')
    feature = models.CharField(max_length=20, choices=FEATURE_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    phone_number = models.CharField(max_length=15, help_text="Customer's M-Pesa phone number")
    merchant_request_id = models.CharField(max_length=255, blank=True)
    checkout_request_id = models.CharField(max_length=255, blank=True, unique=True)
    response_code = models.CharField(max_length=10, blank=True)
    response_description = models.TextField(blank=True)
    customer_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.feature} - KES {self.amount}"

class MpesaTransaction(models.Model):
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name='mpesa_transaction')
    mpesa_receipt_number = models.CharField(max_length=255, unique=True, help_text="M-Pesa receipt number")
    transaction_date = models.DateTimeField()
    phone_number = models.CharField(max_length=15)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    result_code = models.CharField(max_length=10)
    result_desc = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"M-Pesa Transaction {self.mpesa_receipt_number}"
