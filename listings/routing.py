from django.urls import re_path

from . import consumers


websocket_urlpatterns = [
    re_path(r"^ws/properties/(?P<property_id>\d+)/messages/$", consumers.PropertyMessageConsumer.as_asgi()),
]
