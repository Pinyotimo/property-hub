import json

from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST

from .forms import UserRegistrationForm


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
        "isAdmin": user.is_admin,
        "isStaff": user.is_staff,
        "isSuperuser": user.is_superuser,
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
