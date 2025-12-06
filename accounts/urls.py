# accounts/urls.py
from django.urls import path
from django.contrib.auth import views as auth_views
from .views import (
    register_view,
    LoginPageView,
    profile_view,
    profile_edit_view,
)

# Namespace for reverse lookups
app_name = 'accounts'

urlpatterns = [
    # Authentication
    path('login/', LoginPageView.as_view(), name='login'),
    path(
        'logout/',
        auth_views.LogoutView.as_view(next_page='accounts:logout_confirmation'),
        name='logout'
    ),
    path(
        'logged-out/',
        auth_views.TemplateView.as_view(template_name='accounts/logout_confirmation.html'),
        name='logout_confirmation'
    ),

    # Registration
    path('register/', register_view, name='register'),

    # Profile
    path('profile/', profile_view, name='profile'),
    path('profile/edit/', profile_edit_view, name='profile_edit'),

    # Password change
    path(
        'password-change/',
        auth_views.PasswordChangeView.as_view(template_name='accounts/password_change.html'),
        name='password_change'
    ),
    path(
        'password-change/done/',
        auth_views.PasswordChangeDoneView.as_view(template_name='accounts/password_change_done.html'),
        name='password_change_done'
    ),
]