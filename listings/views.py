from django.contrib.auth.decorators import login_required
from django.contrib import messages as django_messages
from django.core.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from .forms import PropertyForm
from .models import Message, Property


def _can_manage_property(user, property_obj):
    return user == property_obj.owner or user.is_admin or user.is_staff or user.is_superuser


def _can_view_property_messages(user, property_obj):
    if _can_manage_property(user, property_obj):
        return True
    return property_obj.messages.filter(sender=user).exists() or property_obj.messages.filter(receiver=user).exists()


def _conversation_receiver(user, property_obj, messages_queryset):
    if _can_manage_property(user, property_obj):
        latest_customer_message = messages_queryset.exclude(sender=user).exclude(sender=property_obj.owner).order_by("-timestamp").first()
        return latest_customer_message.sender if latest_customer_message else None
    return property_obj.owner


def property_list(request):
    """Display all properties."""
    properties = Property.objects.select_related("owner").all()
    return render(request, "listings/property_list.html", {"properties": properties})


def property_detail(request, pk):
    """Display details of a single property."""
    property_obj = get_object_or_404(Property.objects.select_related("owner"), pk=pk)
    return render(request, "listings/property_detail.html", {"property": property_obj})


@login_required
def latest_property_view(request):
    """Redirect to the most recent property owned by the logged-in user."""
    if not request.user.can_post_listings:
        if request.user.is_seller:
            django_messages.warning(request, "Your seller account is waiting for admin approval.")
            return redirect("property_list")
        return redirect("property_list")

    latest = Property.objects.filter(owner=request.user).first()
    if latest:
        return redirect("property_detail", pk=latest.pk)
    return render(request, "listings/no_property.html")


@login_required
def property_create(request):
    """Create a new property owned by the logged-in user."""
    if not request.user.can_post_listings:
        if request.user.is_seller:
            django_messages.warning(request, "Your seller account is waiting for admin approval.")
        else:
            django_messages.warning(request, "You need an approved seller account to add a property.")
        return redirect("property_list")

    if request.method == "POST":
        form = PropertyForm(request.POST, request.FILES)
        if form.is_valid():
            property_obj = form.save(commit=False)
            property_obj.owner = request.user
            property_obj.save()
            django_messages.success(request, "Property added successfully.")
            return redirect("property_list")
    else:
        form = PropertyForm()

    return render(
        request,
        "listings/property_form.html",
        {"form": form, "title": "Add New Property"}
    )


@login_required
def property_update(request, pk):
    """Update an existing property."""
    property_obj = get_object_or_404(Property, pk=pk)
    if not _can_manage_property(request.user, property_obj):
        raise PermissionDenied("You can only edit properties you manage.")

    if request.method == "POST":
        form = PropertyForm(request.POST, request.FILES, instance=property_obj)
        if form.is_valid():
            property_obj = form.save(commit=False)
            property_obj.owner = property_obj.owner
            property_obj.save()
            return redirect("property_detail", pk=property_obj.pk)
    else:
        form = PropertyForm(instance=property_obj)

    return render(
        request,
        "listings/property_form.html",
        {"form": form, "title": "Edit Property"}
    )


@login_required
def property_delete(request, pk):
    """Delete a property."""
    property_obj = get_object_or_404(Property, pk=pk)
    if not _can_manage_property(request.user, property_obj):
        raise PermissionDenied("You can only delete properties you manage.")

    if request.method == "POST":
        property_obj.delete()
        return redirect("property_list")
    return render(request, "listings/property_confirm_delete.html", {"property": property_obj})


@login_required
def property_choose_image(request, pk):
    """Upload or change the image for a property."""
    property_obj = get_object_or_404(Property, pk=pk)
    if not _can_manage_property(request.user, property_obj):
        raise PermissionDenied("You can only update images for properties you manage.")

    if request.method == "POST" and request.FILES.get("image"):
        property_obj.image = request.FILES["image"]
        property_obj.save()
        return redirect("property_detail", pk=property_obj.pk)
    return render(request, "listings/property_choose_image.html", {"property": property_obj})


@login_required
def send_message(request, pk):
    """Send a message about a property."""
    property_obj = get_object_or_404(Property, pk=pk)

    if request.method == "POST":
        content = request.POST.get("message", "").strip()
        if content:
            if request.user == property_obj.owner:
                last_msg = property_obj.messages.exclude(sender=property_obj.owner).order_by("-timestamp").first()
                receiver = last_msg.sender if last_msg else None
            else:
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


@login_required
def view_messages(request, pk):
    """View all messages for a property, with reply support for both buyer and owner/admin."""
    property_obj = get_object_or_404(Property, pk=pk)
    if not _can_view_property_messages(request.user, property_obj):
        raise PermissionDenied("You can only view conversations you are part of.")

    conversation_messages = property_obj.messages.select_related("sender", "receiver", "replied_by").order_by("timestamp")

    is_owner_or_admin = _can_manage_property(request.user, property_obj)
    is_buyer = request.user.is_buyer

    if request.method == "POST":
        message_id = request.POST.get("message_id")
        reply_text = request.POST.get("reply", "").strip()
        message_text = request.POST.get("message", "").strip()

        if message_id and reply_text:
            msg = get_object_or_404(Message, id=message_id, property=property_obj)
            if not (is_owner_or_admin or msg.sender == request.user or msg.receiver == request.user):
                raise PermissionDenied("You can only reply to conversations you are part of.")
            msg.reply = reply_text
            msg.replied_by = request.user
            msg.reply_timestamp = timezone.now()
            msg.save()
            return redirect("view_messages", pk=pk)

        if message_text:
            receiver = _conversation_receiver(request.user, property_obj, conversation_messages)
            if not receiver:
                django_messages.warning(request, "There is no customer conversation to reply to yet.")
                return redirect("view_messages", pk=pk)

            Message.objects.create(
                property=property_obj,
                sender=request.user,
                receiver=receiver,
                message=message_text,
            )
            return redirect("view_messages", pk=pk)

    return render(request, "listings/view_messages.html", {
        "property": property_obj,
        "conversation_messages": conversation_messages,
        "is_owner_or_admin": is_owner_or_admin,
        "can_reply": is_owner_or_admin or is_buyer,
        "show_disclaimer": is_buyer
    })
