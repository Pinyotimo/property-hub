from django.urls import path

from . import api_views

urlpatterns = [
    path("properties/", api_views.property_list_view, name="api_property_list"),
    path("properties/<int:pk>/", api_views.property_detail_view, name="api_property_detail"),
    path("properties/<int:pk>/messages/", api_views.property_messages_view, name="api_property_messages"),
]
