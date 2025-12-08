from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth import login as auth_login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm
from .forms import UserRegistrationForm, UserUpdateForm


def profile(request):
    """User profile page (requires login)."""
    return render(request, "accounts/profile.html")


def register(request):
    """User registration view with Buyer/Seller role selection."""
    if request.method == "POST":
        form = UserRegistrationForm(request.POST, request.FILES)
        if form.is_valid():
            user = form.save()
            # Automatically log in the user after registration
            auth_login(request, user)
            messages.success(
                request,
                f"Account created successfully as {user.role.capitalize()}! Welcome, {user.username}."
            )
            return redirect("profile")
    else:
        form = UserRegistrationForm()
    return render(request, "accounts/register.html", {"form": form})


@login_required
def edit_profile(request):
    """Edit user profile view."""
    if request.method == "POST":
        form = UserUpdateForm(request.POST, request.FILES, instance=request.user)
        if form.is_valid():
            form.save()
            messages.success(request, "Your profile has been updated successfully!")
            return redirect("profile")
    else:
        form = UserUpdateForm(instance=request.user)
    return render(request, "accounts/edit_profile.html", {"form": form})


def login_view(request):
    """Custom login view supporting email or username."""
    if request.method == "POST":
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            auth_login(request, user)
            messages.success(request, f"Welcome back, {user.username} ({user.role.capitalize()})!")
            return redirect("profile")
    else:
        form = AuthenticationForm()
    return render(request, "accounts/login.html", {"form": form})


def logout_confirmation(request):
    """Logout confirmation view."""
    messages.info(request, "You’ve been logged out successfully.")
    return render(request, "accounts/logout_confirmation.html")