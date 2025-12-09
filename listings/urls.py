from django.urls import path
from django.contrib.auth import views as auth_views
from .views import (
    property_list,
    property_detail,
    property_create,
    property_update,
    property_delete,
    property_choose_image,
    send_message,
    view_messages,
    latest_property_view,
)

urlpatterns = [
    # Property browsing
    path("", property_list, name="property_list"),
    path("property/<int:pk>/", property_detail, name="property_detail"),
    path("property/latest/", latest_property_view, name="latest_property"),

    # Property management (seller/admin only)
    path("property/add/", property_create, name="property_create"),
    path("property/<int:pk>/edit/", property_update, name="property_update"),
    path("property/<int:pk>/delete/", property_delete, name="property_delete"),
    path("property/<int:pk>/choose-image/", property_choose_image, name="property_choose_image"),

    # Messaging (two-way: buyer ↔ seller)
    path("property/<int:pk>/messages/", view_messages, name="view_messages"),
    path("property/<int:pk>/send-message/", send_message, name="send_message"),
    
    # Messaging (two-way: buyer ↔ seller)
path("property/<int:pk>/messages/", view_messages, name="view_messages"),
path("property/<int:pk>/send-message/", send_message, name="send_message"),

    # Authentication
    path("login/", auth_views.LoginView.as_view(template_name="accounts/login.html"), name="login"),
    path("logout/", auth_views.LogoutView.as_view(next_page="login"), name="logout"),
]