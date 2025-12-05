from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from .models import Property
from .forms import PropertyForm
from django.conf import settings
import os

def property_list(request):
    properties = Property.objects.all()
    return render(request, 'listings/property_list.html', {'properties': properties})

def property_detail(request, pk):
    property_obj = get_object_or_404(Property, pk=pk)
    return render(request, 'listings/property_detail.html', {'property': property_obj})

@login_required
def property_create(request):
    if request.method == 'POST':
        form = PropertyForm(request.POST, request.FILES)
        if form.is_valid():
            property_obj = form.save(commit=False)
            property_obj.owner = request.user
            property_obj.save()
            return redirect('property_detail', pk=property_obj.pk)
    else:
        form = PropertyForm()
    return render(request, 'listings/property_form.html', {'form': form})

@login_required
def property_update(request, pk):
    property_obj = get_object_or_404(Property, pk=pk, owner=request.user)
    if request.method == 'POST':
        form = PropertyForm(request.POST, request.FILES, instance=property_obj)
        if form.is_valid():
            form.save()
            return redirect('property_detail', pk=property_obj.pk)
    else:
        form = PropertyForm(instance=property_obj)
    return render(request, 'listings/property_form.html', {'form': form})

@login_required
def property_delete(request, pk):
    # Allow deletion by the owner, or by superusers/staff
    property_obj = get_object_or_404(Property, pk=pk)
    if not (request.user == property_obj.owner or request.user.is_superuser or request.user.is_staff):
        # Unauthorized to delete - redirect to detail
        return redirect('property_detail', pk=pk)

    if request.method == 'POST':
        property_obj.delete()
        return redirect('property_list')

    return render(request, 'listings/property_confirm_delete.html', {'property': property_obj})


@login_required
def property_choose_image(request, pk):
    """Allow the owner to pick an existing file from media/property_images
    and set it as the property's image field."""
    # Allow superusers to access any property; otherwise restrict to owner
    property_obj = get_object_or_404(Property, pk=pk)
    if property_obj.owner != request.user and not request.user.is_superuser:
        return redirect('property_detail', pk=pk)
    media_dir = os.path.join(settings.MEDIA_ROOT, 'property_images')
    try:
        entries = sorted([f for f in os.listdir(media_dir) if os.path.isfile(os.path.join(media_dir, f))])
    except Exception:
        entries = []

    if request.method == 'POST':
        selected = request.POST.get('selected_image')
        if selected and selected in entries:
            # set the ImageField to the relative path under MEDIA_ROOT
            property_obj.image.name = os.path.join('property_images', selected).replace('\\', '/')
            property_obj.save()
            return redirect('property_detail', pk=property_obj.pk)

    return render(request, 'listings/property_choose_image.html', {
        'property': property_obj,
        'images': entries,
    })
