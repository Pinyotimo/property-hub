from django.contrib import admin
from .models import Property, PropertyImage

class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 1

@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'price', 'city', 'status', 'is_featured', 'created_at')
    list_filter = ('status', 'property_type', 'listing_type', 'city', 'is_featured')
    search_fields = ('title', 'description', 'city', 'state', 'zip_code')
    prepopulated_fields = {'slug': ('title',)}
    inlines = [PropertyImageInline]
    date_hierarchy = 'created_at'
    ordering = ['-created_at']

@admin.register(PropertyImage)
class PropertyImageAdmin(admin.ModelAdmin):
    list_display = ('property', 'is_primary', 'uploaded_at')
    list_filter = ('is_primary',)