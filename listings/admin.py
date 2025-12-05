from django.contrib import admin
from .models import Property

@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'location', 'formatted_price',
        'bedrooms', 'bathrooms',
        'property_type', 'listed_date',
        'owner', 'image_preview', 'choose_image_link'
    )
    search_fields = ('title', 'location', 'owner__username')
    list_filter = ('property_type', 'bedrooms', 'bathrooms')
    ordering = ('-listed_date', 'price')
    readonly_fields = ('listed_date', 'image_preview')

    def formatted_price(self, obj):
        return f"${obj.price:,.2f}"
    formatted_price.short_description = "Price"

    def image_preview(self, obj):
        if obj.image:
            return f'<img src="{obj.image.url}" style="max-height:100px; max-width:150px;" />'
        return "No Image"
    image_preview.short_description = "Preview"

    def choose_image_link(self, obj):
        """Show a link in the admin change list to open the frontend chooser."""
        from django.utils.html import format_html
        if obj.pk:
            url = f"/listings/property/{obj.pk}/choose-image/"
            return format_html('<a class="button" href="{}" target="_blank">Choose Image</a>', url)
        return '-'
    choose_image_link.short_description = 'Choose Image'
    image_preview.short_description = "Preview"