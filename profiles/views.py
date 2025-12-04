from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from .models import UserProfile

@login_required
def profile_view(request):
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    my_properties = profile.properties.all()
    return render(request, 'profiles/profile.html', {
        'profile': profile,
        'my_properties': my_properties
    })