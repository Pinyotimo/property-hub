from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

# ✅ Custom User Admin
class CustomUserAdmin(UserAdmin):
    model = User
    fieldsets = UserAdmin.fieldsets + (
        ('Profile Info', {'fields': ('phone', 'bio', 'profile_picture')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Profile Info', {'fields': ('email', 'phone', 'bio', 'profile_picture')}),
    )

admin.site.register(User, CustomUserAdmin)