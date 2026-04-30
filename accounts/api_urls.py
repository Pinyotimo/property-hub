from django.urls import path

from . import api_views

urlpatterns = [
    path("session/", api_views.session_view, name="api_session"),
    path("login/", api_views.login_view, name="api_login"),
    path("logout/", api_views.logout_view, name="api_logout"),
    path("register/", api_views.register_view, name="api_register"),
]
