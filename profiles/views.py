from django.shortcuts import render
from .models import UserProfile

def profile_view(request):
    user_profile = UserProfile.objects.get(user=request.user)
    user_properties = user_profile.user.properties.all()
    return render(request, 'profiles/profile.html', {
        'profile': user_profile,
        'properties': user_properties
    })