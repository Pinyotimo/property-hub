from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

# ✅ Custom User Admin
class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ("username", "email", "role", "seller_approved", "is_staff")
    list_filter = UserAdmin.list_filter + ("role", "seller_approved")
    fieldsets = UserAdmin.fieldsets + (
        ('Profile Info', {'fields': ('phone', 'bio', 'profile_picture', 'role', 'seller_approved')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Profile Info', {'fields': ('email', 'phone', 'bio', 'profile_picture', 'role', 'seller_approved')}),
    )

admin.site.register(User, CustomUserAdmin)
