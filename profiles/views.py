from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from .models import UserProfile
from .forms import UserProfileForm
from listings.models import Property  # ✅ import Property model to query user properties

@login_required
def profile_view(request):
    # Ensure the user has a profile
    user_profile, created = UserProfile.objects.get_or_create(user=request.user)

    # Fetch properties owned by the logged-in user
    user_properties = Property.objects.filter(owner=request.user)

    return render(request, 'profiles/profile.html', {
        'profile': user_profile,
        'my_properties': user_properties
    })


@login_required
def edit_profile(request):
    # Get or create the user profile
    user_profile, created = UserProfile.objects.get_or_create(user=request.user)

    if request.method == 'POST':
        form = UserProfileForm(request.POST, instance=user_profile)
        if form.is_valid():
            form.save()
            messages.success(request, 'Your profile has been updated successfully!')
            return redirect('profile')
    else:
        form = UserProfileForm(instance=user_profile)

    return render(request, 'profiles/edit_profile.html', {
        'form': form
    })