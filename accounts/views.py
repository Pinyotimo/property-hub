
from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from .forms import UserRegistrationForm, UserUpdateForm

def profile(request):
    return render(request, "accounts/profile.html")

def register(request):
    if request.method == "POST":
        form = UserRegistrationForm(request.POST)
        if form.is_valid():
            form.save()
            username = form.cleaned_data.get('username')
            messages.success(request, f"Account created successfully for {username}! You can now login.")
            return redirect("login")
    else:
        form = UserRegistrationForm()
    return render(request, "accounts/register.html", {"form": form})

@login_required
def edit_profile(request):
    if request.method == "POST":
        form = UserUpdateForm(request.POST, request.FILES, instance=request.user)
        if form.is_valid():
            form.save()
            messages.success(request, "Your profile has been updated successfully!")
            return redirect("profile")
    else:
        form = UserUpdateForm(instance=request.user)
    return render(request, "accounts/edit_profile.html", {"form": form})

def logout(request):
    messages.info(request, "You’ve been logged out successfully.")
    return render(request, "accounts/logout.html")

# ✅ Place your logout confirmation view here
def logout_confirmation(request):
    messages.info(request, "You’ve been logged out successfully.")
    return render(request, "accounts/logout_confirmation.html")