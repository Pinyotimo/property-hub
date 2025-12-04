from django.urls import path
from .views import (
    property_list,
    property_detail,
    property_create,
    property_edit,
    property_delete,
)

urlpatterns = [
    path('', property_list, name='property_list'),
    path('<int:pk>/', property_detail, name='property_detail'),
    path('create/', property_create, name='property_create'),
    path('<int:pk>/edit/', property_edit, name='property_edit'),
    path('<int:pk>/delete/', property_delete, name='property_delete'),
]