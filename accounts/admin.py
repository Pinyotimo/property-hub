from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


# Register your models here.
from django.contrib import admin

# Register the custom User model so it appears in the Admin Panel
class CustomUserAdmin(UserAdmin):
    model = User
    # Add our custom fields to the fieldsets to make them visible in admin
    fieldsets = UserAdmin.fieldsets + (
        ('Profile Info', {'fields': ('phone', 'bio', 'profile_picture')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Profile Info', {'fields': ('email', 'phone', 'bio', 'profile_picture')}),
    )

admin.site.register(User, CustomUserAdmin)