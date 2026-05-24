import json

from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods, require_POST

from .forms import UserRegistrationForm
from .models import User


def _json_body(request):
    if not request.body:
        return {}
    try:
        return json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return {}


def _serialize_user(user):
    if not user.is_authenticated:
        return None
    return {
        "id": user.id,
        "username": user.username,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "fullName": user.get_full_name() or user.username,
        "email": user.email,
        "phone": user.phone,
        "bio": user.bio,
        "role": user.role,
        "isBuyer": user.is_buyer,
        "isSeller": user.is_seller,
        "isSellerApproved": user.seller_approved,
        "canPostListings": user.can_post_listings,
        "isAdmin": user.is_admin,
        "isStaff": user.is_staff,
        "isSuperuser": user.is_superuser,
    }


def _serialize_seller(user):
    return {
        "id": user.id,
        "username": user.username,
        "fullName": user.get_full_name() or user.username,
        "email": user.email,
        "phone": user.phone,
        "isSellerApproved": user.seller_approved,
        "dateJoined": user.date_joined.isoformat(),
    }


@ensure_csrf_cookie
def session_view(request):
    return JsonResponse({
        "csrfToken": get_token(request),
        "user": _serialize_user(request.user),
    })


@require_POST
def login_view(request):
    data = _json_body(request)
    email = data.get("email", "").strip()
    password = data.get("password", "")
    user = authenticate(request, username=email, password=password)
    if user is None:
        return JsonResponse({"error": "Invalid email or password."}, status=400)

    login(request, user)
    return JsonResponse({"user": _serialize_user(user)})


@require_POST
def logout_view(request):
    logout(request)
    return JsonResponse({"user": None})


@require_POST
def register_view(request):
    data = _json_body(request)
    form = UserRegistrationForm({
        "first_name": data.get("firstName", ""),
        "last_name": data.get("lastName", ""),
        "username": data.get("username", ""),
        "email": data.get("email", ""),
        "phone": data.get("phone", ""),
        "role": data.get("role", ""),
        "bio": data.get("bio", ""),
        "password1": data.get("password", ""),
        "password2": data.get("passwordConfirm", ""),
    })
    if not form.is_valid():
        return JsonResponse({"errors": form.errors}, status=400)

    user = form.save()
    login(request, user)
    return JsonResponse({"user": _serialize_user(user)}, status=201)


@require_http_methods(["GET"])
def sellers_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Login required."}, status=401)
    if not request.user.is_admin:
        return JsonResponse({"error": "Admin access required."}, status=403)

    sellers = User.objects.filter(role=User.Roles.SELLER).order_by("seller_approved", "-date_joined")
    return JsonResponse({"sellers": [_serialize_seller(seller) for seller in sellers]})


@require_POST
def seller_approval_view(request, user_id):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Login required."}, status=401)
    if not request.user.is_admin:
        return JsonResponse({"error": "Admin access required."}, status=403)

    try:
        seller = User.objects.get(pk=user_id, role=User.Roles.SELLER)
    except User.DoesNotExist:
        return JsonResponse({"error": "Seller not found."}, status=404)
    data = _json_body(request)
    seller.seller_approved = bool(data.get("approved", True))
    seller.save(update_fields=["seller_approved"])
    return JsonResponse({"seller": _serialize_seller(seller)})
