from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    # Profile and registration
    path("profile/", views.profile, name="profile"),
    path("register/", views.register, name="register"),
    path("edit/", views.edit_profile, name="profile_edit"),

    # Login and logout
    path("login/", auth_views.LoginView.as_view(
        template_name="accounts/login.html"
    ), name="login"),
    path("logout/", auth_views.LogoutView.as_view(), name="logout"),
    path("logged-out/", views.logout_confirmation, name="logout_confirmation"),

    # Password change (for logged-in users)
    path("password-change/", auth_views.PasswordChangeView.as_view(
        template_name="accounts/password_change.html",
        success_url="/accounts/password-change/done/"
    ), name="password_change"),
    path("password-change/done/", auth_views.PasswordChangeDoneView.as_view(
        template_name="accounts/password_change_done.html"
    ), name="password_change_done"),
]