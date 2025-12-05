from django.contrib import admin
from .models import Transaction

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('user', 'amount', 'status', 'receipt_number', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__username', 'receipt_number')