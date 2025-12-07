from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from .models import Property, Message, PropertyImage
from .forms import PropertyForm, PropertyImageForm

@login_required
def property_list(request):
    """Show all properties, only for authenticated users."""
    properties = Property.objects.all()
    return render(request, 'properties/property_list.html', {
        'properties': properties,
    })

@login_required
def property_detail(request, slug):
    """Show details of a single property, only for authenticated users.
       Also handle message submission for the property owner.
    """
    property_obj = get_object_or_404(Property, slug=slug)

    if request.method == "POST" and "message" in request.POST:
        content = request.POST.get("message")
        if content:
            Message.objects.create(
                property=property_obj,
                sender=request.user if request.user.is_authenticated else None,
                content=content
            )
            return redirect("property_detail", slug=property_obj.slug)

    return render(request, 'properties/property_detail.html', {
        'property': property_obj,
    })

@login_required
def add_property(request):
    """Allow authenticated users to add a new property with an image."""
    if request.method == "POST":
        form = PropertyForm(request.POST)
        image_form = PropertyImageForm(request.POST, request.FILES)

        if form.is_valid() and image_form.is_valid():
            property_obj = form.save(commit=False)
            property_obj.owner = request.user
            property_obj.save()

            property_image = image_form.save(commit=False)
            property_image.property = property_obj
            property_image.save()

            return redirect("property_detail", slug=property_obj.slug)
    else:
        form = PropertyForm()
        image_form = PropertyImageForm()

    return render(request, "properties/add_property.html", {
        "form": form,
        "image_form": image_form
    })

@login_required
def edit_property(request, slug):
    """Allow the owner to edit their property details."""
    property_obj = get_object_or_404(Property, slug=slug, owner=request.user)

    if request.method == "POST":
        form = PropertyForm(request.POST, instance=property_obj)
        # Currently supports editing only the first image
        image_form = PropertyImageForm(
            request.POST, request.FILES,
            instance=property_obj.images.first() if property_obj.images.exists() else None
        )

        if form.is_valid() and image_form.is_valid():
            form.save()
            if image_form.cleaned_data.get("image"):
                property_image = image_form.save(commit=False)
                property_image.property = property_obj
                property_image.save()
            return redirect("property_detail", slug=property_obj.slug)
    else:
        form = PropertyForm(instance=property_obj)
        image_form = PropertyImageForm(
            instance=property_obj.images.first() if property_obj.images.exists() else None
        )

    return render(request, "properties/edit_property.html", {
        "form": form,
        "image_form": image_form,
        "property": property_obj,
    })

@login_required
def delete_property(request, slug):
    """Allow the owner to delete their property."""
    property_obj = get_object_or_404(Property, slug=slug, owner=request.user)

    if request.method == "POST":
        property_obj.delete()
        return redirect("property_list")

    return render(request, "properties/delete_property.html", {"property": property_obj})

@login_required
def owner_messages(request):
    """Dashboard for owners to view messages about their properties."""
    messages = Message.objects.filter(property__owner=request.user).order_by("-created_at")
    return render(request, "properties/owner_messages.html", {"messages": messages})

@login_required
def mark_message_read(request, pk):
    """Mark a specific message as read."""
    msg = get_object_or_404(Message, pk=pk, property__owner=request.user)
    msg.is_read = True
    msg.save()
    return redirect("owner_messages")

@login_required
def mark_all_messages_read(request):
    """Mark all messages for the logged-in owner as read."""
    Message.objects.filter(property__owner=request.user, is_read=False).update(is_read=True)
    return redirect("owner_messages")