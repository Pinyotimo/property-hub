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
    latest_property_view,   # ✅ import the view
)

urlpatterns = [
    path('', property_list, name='property_list'),
    path('property/add/', property_create, name='property_create'),
    path('property/<int:pk>/', property_detail, name='property_detail'),
    path('property/<int:pk>/edit/', property_update, name='property_update'),
    path('property/<int:pk>/delete/', property_delete, name='property_delete'),
    path('property/<int:pk>/choose-image/', property_choose_image, name='property_choose_image'),
    path('property/<int:pk>/send-message/', send_message, name='send_message'),
    path('property/<int:pk>/messages/', view_messages, name='view_messages'),
    path('property/latest/', latest_property_view, name='latest_property'),
    path('login/', auth_views.LoginView.as_view(), name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='login'), name='logout'),
]