from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from .models import Property, Message
from .forms import PropertyForm

# List all properties
def property_list(request):
    properties = Property.objects.all()
    return render(request, "listings/property_list.html", {"properties": properties})

# Show details of a single property
def property_detail(request, pk):
    property_obj = get_object_or_404(Property, pk=pk)
    return render(request, "listings/property_detail.html", {"property": property_obj})

# Create a new property
@login_required
def property_create(request):
    if request.method == "POST":
        form = PropertyForm(request.POST, request.FILES)
        if form.is_valid():
            property_obj = form.save(commit=False)
            property_obj.owner = request.user
            property_obj.save()
            return redirect("property_list")
    else:
        form = PropertyForm()
    return render(request, "listings/property_form.html", {"form": form, "title": "Add New Property"})

# Update an existing property
@login_required
def property_update(request, pk):
    property_obj = get_object_or_404(Property, pk=pk)
    if request.method == "POST":
        form = PropertyForm(request.POST, request.FILES, instance=property_obj)
        if form.is_valid():
            form.save()
            return redirect("property_detail", pk=property_obj.pk)
    else:
        form = PropertyForm(instance=property_obj)
    return render(request, "listings/property_form.html", {"form": form, "title": "Edit Property"})

# Delete a property
@login_required
def property_delete(request, pk):
    property_obj = get_object_or_404(Property, pk=pk)
    if request.method == "POST":
        property_obj.delete()
        return redirect("property_list")
    return render(request, "listings/property_confirm_delete.html", {"property": property_obj})

# Choose an image for a property
@login_required
def property_choose_image(request, pk):
    property_obj = get_object_or_404(Property, pk=pk)
    if request.method == "POST" and request.FILES.get("image"):
        property_obj.image = request.FILES["image"]
        property_obj.save()
        return redirect("property_detail", pk=property_obj.pk)
    return render(request, "listings/property_choose_image.html", {"property": property_obj})

# Send a message about a property
@login_required
def send_message(request, pk):
    property_obj = get_object_or_404(Property, pk=pk)
    if request.method == "POST":
        content = request.POST.get("message")
        if content:
            Message.objects.create(
                sender=request.user,
                property=property_obj,
                message=content
            )
            return redirect("view_messages", pk=property_obj.pk)
    return render(request, "listings/send_message.html", {"property": property_obj})

# View all messages for a property (with reply support)
@login_required
def view_messages(request, pk):
    property_obj = get_object_or_404(Property, pk=pk)
    messages = property_obj.messages.all()

    # Handle replies from owner
    if request.method == "POST" and request.user == property_obj.owner:
        message_id = request.POST.get("message_id")
        reply_text = request.POST.get("reply")
        msg = get_object_or_404(Message, id=message_id, property=property_obj)
        msg.reply = reply_text
        msg.replied_by = request.user
        msg.reply_timestamp = timezone.now()
        msg.save()
        return redirect("view_messages", pk=pk)

    return render(request, "listings/view_messages.html", {
        "property": property_obj,
        "messages": messages
    })