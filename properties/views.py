from django.shortcuts import render, get_object_or_404, redirect
from .models import Property

def latest_property_view(request):
    if request.user.is_authenticated:
        latest = Property.objects.filter(owner=request.user).last()
        if latest:
            return redirect('property_detail', id=latest.id)
    # fallback if no property exists
    return render(request, 'no_property.html')

def my_properties(request):
    if request.user.is_authenticated:
        properties = Property.objects.filter(owner=request.user)
        return render(request, 'my_properties.html', {'properties': properties})
    return render(request, 'no_property.html')