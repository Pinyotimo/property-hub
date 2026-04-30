import json

from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_http_methods

from .forms import PropertyForm
from .models import Message, Property
from .views import _can_manage_property, _can_view_property_messages, _conversation_receiver


def _json_body(request):
    if not request.body:
        return {}
    try:
        return json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return {}


def _absolute_url(request, field_file):
    if not field_file:
        return ""
    return request.build_absolute_uri(field_file.url)


def _choice_label(choices, value):
    return dict(choices).get(value, value)


def _serialize_owner(owner):
    return {
        "id": owner.id,
        "name": owner.get_full_name() or owner.username,
        "username": owner.username,
        "email": owner.email,
    }


def _serialize_property(request, property_obj):
    return {
        "id": property_obj.id,
        "title": property_obj.title,
        "description": property_obj.description or "",
        "price": float(property_obj.price),
        "location": property_obj.location,
        "address": property_obj.address or "",
        "city": property_obj.city or "",
        "state": property_obj.state or "",
        "zipCode": property_obj.zip_code or "",
        "propertyType": property_obj.property_type,
        "propertyTypeLabel": _choice_label(Property.PROPERTY_TYPES, property_obj.property_type),
        "listingType": property_obj.listing_type,
        "listingTypeLabel": _choice_label(Property.LISTING_TYPES, property_obj.listing_type),
        "bedrooms": property_obj.bedrooms,
        "bathrooms": property_obj.bathrooms,
        "squareFeet": property_obj.square_feet,
        "hasParking": property_obj.has_parking,
        "hasPool": property_obj.has_pool,
        "hasGym": property_obj.has_gym,
        "hasGarden": property_obj.has_garden,
        "status": property_obj.status,
        "statusLabel": _choice_label(Property.STATUS_CHOICES, property_obj.status),
        "isFeatured": property_obj.is_featured,
        "image": _absolute_url(request, property_obj.image),
        "listedDate": property_obj.listed_date.isoformat(),
        "owner": _serialize_owner(property_obj.owner),
    }


def _serialize_message(msg, current_user):
    return {
        "id": msg.id,
        "body": msg.message,
        "timestamp": msg.timestamp.isoformat(),
        "sender": _serialize_owner(msg.sender),
        "receiver": _serialize_owner(msg.receiver) if msg.receiver else None,
        "isMine": msg.sender_id == current_user.id,
        "reply": msg.reply or "",
        "replyTimestamp": msg.reply_timestamp.isoformat() if msg.reply_timestamp else "",
        "repliedBy": _serialize_owner(msg.replied_by) if msg.replied_by else None,
    }


def _form_data_from_payload(payload):
    return {
        "title": payload.get("title", ""),
        "description": payload.get("description", ""),
        "location": payload.get("location", ""),
        "price": payload.get("price", ""),
        "address": payload.get("address", ""),
        "city": payload.get("city", ""),
        "state": payload.get("state", ""),
        "zip_code": payload.get("zipCode", ""),
        "property_type": payload.get("propertyType", ""),
        "listing_type": payload.get("listingType", ""),
        "bedrooms": payload.get("bedrooms") or "",
        "bathrooms": payload.get("bathrooms") or "",
        "square_feet": payload.get("squareFeet") or "",
        "has_parking": payload.get("hasParking", False),
        "has_pool": payload.get("hasPool", False),
        "has_gym": payload.get("hasGym", False),
        "has_garden": payload.get("hasGarden", False),
        "status": payload.get("status", "available"),
        "is_featured": payload.get("isFeatured", False),
    }


@require_http_methods(["GET", "POST"])
def property_list_view(request):
    if request.method == "POST":
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Login required."}, status=401)
        if not (request.user.is_seller or request.user.is_admin):
            raise PermissionDenied("Only sellers and admins can create listings.")

        form = PropertyForm(_form_data_from_payload(_json_body(request)))
        if not form.is_valid():
            return JsonResponse({"errors": form.errors}, status=400)
        property_obj = form.save(commit=False)
        property_obj.owner = request.user
        property_obj.save()
        return JsonResponse({"property": _serialize_property(request, property_obj)}, status=201)

    properties = Property.objects.select_related("owner").all()
    query = request.GET.get("q", "").strip()
    property_type = request.GET.get("propertyType", "").strip()
    listing_type = request.GET.get("listingType", "").strip()
    status = request.GET.get("status", "").strip()

    if query:
        properties = properties.filter(
            Q(title__icontains=query) |
            Q(location__icontains=query) |
            Q(city__icontains=query) |
            Q(description__icontains=query)
        )
    if property_type:
        properties = properties.filter(property_type=property_type)
    if listing_type:
        properties = properties.filter(listing_type=listing_type)
    if status:
        properties = properties.filter(status=status)

    return JsonResponse({
        "properties": [_serialize_property(request, item) for item in properties],
        "choices": {
            "propertyTypes": Property.PROPERTY_TYPES,
            "listingTypes": Property.LISTING_TYPES,
            "statuses": Property.STATUS_CHOICES,
        },
    })


@require_http_methods(["GET", "PUT", "DELETE"])
def property_detail_view(request, pk):
    property_obj = get_object_or_404(Property.objects.select_related("owner"), pk=pk)

    if request.method == "GET":
        return JsonResponse({"property": _serialize_property(request, property_obj)})

    if not request.user.is_authenticated:
        return JsonResponse({"error": "Login required."}, status=401)
    if not _can_manage_property(request.user, property_obj):
        raise PermissionDenied("You can only manage properties you own or administer.")

    if request.method == "DELETE":
        property_obj.delete()
        return JsonResponse({"deleted": True})

    form = PropertyForm(_form_data_from_payload(_json_body(request)), instance=property_obj)
    if not form.is_valid():
        return JsonResponse({"errors": form.errors}, status=400)
    property_obj = form.save()
    return JsonResponse({"property": _serialize_property(request, property_obj)})


@login_required
@require_http_methods(["GET", "POST"])
def property_messages_view(request, pk):
    property_obj = get_object_or_404(Property.objects.select_related("owner"), pk=pk)
    conversation_messages = property_obj.messages.select_related("sender", "receiver", "replied_by").order_by("timestamp")

    if request.method == "GET":
        if not _can_view_property_messages(request.user, property_obj):
            raise PermissionDenied("You can only view conversations you are part of.")
        return JsonResponse({
            "messages": [_serialize_message(msg, request.user) for msg in conversation_messages],
            "canManage": _can_manage_property(request.user, property_obj),
        })

    body = _json_body(request).get("message", "").strip()
    if not body:
        return JsonResponse({"error": "Message is required."}, status=400)

    receiver = _conversation_receiver(request.user, property_obj, conversation_messages)
    if not receiver:
        return JsonResponse({"error": "There is no customer conversation to reply to yet."}, status=400)

    message = Message.objects.create(
        property=property_obj,
        sender=request.user,
        receiver=receiver,
        message=body,
    )
    return JsonResponse({"message": _serialize_message(message, request.user)}, status=201)
