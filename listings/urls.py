from django.urls import path
from .views import (
    property_list,
    property_detail,
    property_create,
    property_update,
    property_delete,
    property_choose_image,
)

urlpatterns = [
    path('', property_list, name='property_list'),
    path('property/add/', property_create, name='property_create'),
    path('property/<int:pk>/', property_detail, name='property_detail'),
    path('property/<int:pk>/edit/', property_update, name='property_update'),
    path('property/<int:pk>/delete/', property_delete, name='property_delete'),
    path('property/<int:pk>/choose-image/', property_choose_image, name='property_choose_image'),
]