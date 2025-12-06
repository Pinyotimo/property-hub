# accounts/views.py
from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.views import LoginView
from django.contrib.auth.decorators import login_required

from .forms import RegisterForm, LoginForm, ProfileForm


def register_view(request):
    """Handle user registration."""
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            messages.success(request, 'Account created successfully!')
            login(request, user)  # log the user in immediately
            return redirect('home')  # redirect to homepage
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = RegisterForm()
    return render(request, 'accounts/register.html', {'form': form})


class LoginPageView(LoginView):
    """Custom login view using Bootstrap form."""
    template_name = 'accounts/login.html'
    authentication_form = LoginForm


@login_required
def profile_view(request):
    """Display the logged-in user's profile."""
    return render(request, 'accounts/profile.html')


@login_required
def profile_edit_view(request):
    """Allow the logged-in user to edit their profile."""
    if request.method == 'POST':
        form = ProfileForm(request.POST, instance=request.user)
        if form.is_valid():
            form.save()
            messages.success(request, 'Profile updated successfully!')
            return redirect('accounts:profile')  # ✅ namespaced redirect
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = ProfileForm(instance=request.user)
    return render(request, 'accounts/profile_edit.html', {'form': form})