from django.contrib import admin
from django.utils.html import format_html
from .models import Property, PropertyImage, Message

@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'location', 'formatted_price',
        'bedrooms', 'bathrooms', 'property_type',
        'status_badge', 'is_featured', 'listed_date', 'owner'
    )
    search_fields = ('title', 'location', 'owner__username')
    list_filter = ('status', 'property_type', 'is_featured')
    ordering = ('-listed_date', 'price')
    readonly_fields = ('listed_date',)

    def formatted_price(self, obj):
        return f"KES {obj.price:,.2f}"
    formatted_price.short_description = "Price"

    def status_badge(self, obj):
        color_map = {
            'available': 'green',
            'sold': 'red',
            'rented': 'orange',
            'pending': 'gray',
        }
        color = color_map.get(obj.status, 'black')
        return format_html(
            '<span style="color:{}; font-weight:bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'

@admin.register(PropertyImage)
class PropertyImageAdmin(admin.ModelAdmin):
    list_display = ('property', 'is_primary', 'uploaded_at')
    list_filter = ('is_primary',)

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('property', 'sender', 'receiver', 'timestamp')
    search_fields = ('message',)