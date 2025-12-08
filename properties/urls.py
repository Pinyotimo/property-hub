from django.urls import path
from listings import views

urlpatterns = [
    # Show the latest property for the logged-in user
    path('properties/latest/', views.latest_property_view, name='latest_property'),

    # Or show all properties owned by the user
    path('properties/mine/', views.my_properties, name='my_properties'),
]