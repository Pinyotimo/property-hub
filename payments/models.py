from django.db import models
from django.contrib.auth import get_user_model
from properties.models import Property


# Create your models here.
User = get_user_model()

class Payment(models.Model):
    FEATURE_CHOICES = [
        ('featured', 'Featured Listing - $19.99'),
        ('premium', 'Premium Placement - $39.99'),
        ('spotlight', 'Spotlight Listing - $9.99'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='payments')
    feature = models.CharField(max_length=20, choices=FEATURE_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.feature} - ${self.amount}"

class Transaction(models.Model):
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name='transaction')
    transaction_id = models.CharField(max_length=255, unique=True)
    stripe_charge_id = models.CharField(max_length=255)
    receipt_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Transaction {self.transaction_id}"