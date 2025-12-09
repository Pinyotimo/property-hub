from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from django.core.exceptions import PermissionDenied
from .models import Property, Message
from .forms import PropertyForm


# List all properties (buyers can view, sellers/admins can also view/manage)
def property_list(request):
    """Display all properties."""
    properties = Property.objects.all()
    return render(request, "listings/property_list.html", {"properties": properties})


# Show details of a single property
def property_detail(request, pk):
    """Display details of a single property."""
    property_obj = get_object_or_404(Property, pk=pk)
    return render(request, "listings/property_detail.html", {"property": property_obj})


# Show the latest property for the logged-in user
@login_required
def latest_property_view(request):
    """Redirect to the most recent property owned by the logged-in user."""
    if not (request.user.is_seller or request.user.is_admin):
        return redirect("property_list")

    latest = Property.objects.filter(owner=request.user).last()
    if latest:
        return redirect("property_detail", pk=latest.pk)
    return render(request, "listings/no_property.html")


# Create a new property (seller/admin only)
@login_required
def property_create(request):
    """Create a new property owned by the logged-in user."""
    if not (request.user.is_seller or request.user.is_admin):
        return redirect("property_list")

    if request.method == "POST":
        form = PropertyForm(request.POST, request.FILES)
        if form.is_valid():
            property_obj = form.save(commit=False)
            property_obj.owner = request.user
            property_obj.save()
            return redirect("property_list")
        else:
            # ✅ Show errors if form is invalid
            return render(
                request,
                "listings/property_form.html",
                {"form": form, "title": "Add New Property"}
            )
    else:
        form = PropertyForm()

    return render(
        request,
        "listings/property_form.html",
        {"form": form, "title": "Add New Property"}
    )


# Update an existing property (seller/admin only, must be owner)
@login_required
def property_update(request, pk):
    """Update an existing property."""
    property_obj = get_object_or_404(Property, pk=pk)
    if request.user != property_obj.owner:
        raise PermissionDenied("You can only edit your own properties.")

    if request.method == "POST":
        form = PropertyForm(request.POST, request.FILES, instance=property_obj)
        if form.is_valid():
            property_obj = form.save(commit=False)
            property_obj.owner = request.user  # ✅ keep owner consistent
            property_obj.save()
            return redirect("property_detail", pk=property_obj.pk)
        else:
            return render(
                request,
                "listings/property_form.html",
                {"form": form, "title": "Edit Property"}
            )
    else:
        form = PropertyForm(instance=property_obj)

    return render(
        request,
        "listings/property_form.html",
        {"form": form, "title": "Edit Property"}
    )


# Delete a property (seller/admin only, must be owner)
@login_required
def property_delete(request, pk):
    """Delete a property."""
    property_obj = get_object_or_404(Property, pk=pk)
    if request.user != property_obj.owner:
        raise PermissionDenied("You can only delete your own properties.")

    if request.method == "POST":
        property_obj.delete()
        return redirect("property_list")
    return render(request, "listings/property_confirm_delete.html", {"property": property_obj})


# Choose an image for a property (seller/admin only, must be owner)
@login_required
def property_choose_image(request, pk):
    """Upload or change the image for a property."""
    property_obj = get_object_or_404(Property, pk=pk)
    if request.user != property_obj.owner:
        raise PermissionDenied("You can only update images for your own properties.")

    if request.method == "POST" and request.FILES.get("image"):
        property_obj.image = request.FILES["image"]
        property_obj.save()
        return redirect("property_detail", pk=property_obj.pk)
    return render(request, "listings/property_choose_image.html", {"property": property_obj})


# Send a message about a property (two-way: buyer ↔ seller)
@login_required
def send_message(request, pk):
    """Send a message about a property (two-way communication)."""
    property_obj = get_object_or_404(Property, pk=pk)

    if request.method == "POST":
        content = request.POST.get("message")
        if content:
            # Decide receiver dynamically
            if request.user == property_obj.owner:
                # Seller sending → reply to the latest buyer in thread
                last_msg = property_obj.messages.order_by("timestamp").first()
                receiver = last_msg.sender if last_msg else None
            else:
                # Buyer sending → receiver is property owner
                receiver = property_obj.owner

            if receiver:
                Message.objects.create(
                    property=property_obj,
                    sender=request.user,
                    receiver=receiver,
                    message=content
                )
            return redirect("view_messages", pk=property_obj.pk)

    return render(request, "listings/send_message.html", {"property": property_obj})


# View all messages for a property
@login_required
def view_messages(request, pk):
    """View all messages for a property, with reply support for both buyer and owner/admin."""
    property_obj = get_object_or_404(Property, pk=pk)
    messages = property_obj.messages.all().order_by("timestamp")

    is_owner_or_admin = request.user == property_obj.owner or request.user.is_superuser or request.user.is_staff
    is_buyer = hasattr(request.user, "is_buyer") and request.user.is_buyer

    if request.method == "POST":
        message_id = request.POST.get("message_id")
        reply_text = request.POST.get("reply")

        if message_id and reply_text:
            msg = get_object_or_404(Message, id=message_id, property=property_obj)
            msg.reply = reply_text
            msg.replied_by = request.user
            msg.reply_timestamp = timezone.now()
            msg.save()
            return redirect("view_messages", pk=pk)

    return render(request, "listings/view_messages.html", {
        "property": property_obj,
        "messages": messages,
        "can_reply": is_owner_or_admin or is_buyer,
        "show_disclaimer": is_buyer
    })