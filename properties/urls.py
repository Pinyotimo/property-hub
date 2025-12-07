from django.urls import path
from . import views

urlpatterns = [
    # Show all properties (list view)
    path('', views.property_list, name='property_list'),

    # Add a new property (form view)
    path('add/', views.add_property, name='add_property'),

    # Owner messages dashboard (view inquiries about their properties)
    path('messages/', views.owner_messages, name='owner_messages'),

    # Mark a specific message as read
    path('messages/<int:pk>/read/', views.mark_message_read, name='mark_message_read'),

    # Bulk mark all messages as read
    path('messages/read-all/', views.mark_all_messages_read, name='mark_all_messages_read'),

    # Edit property
    path('<slug:slug>/edit/', views.edit_property, name='edit_property'),

    # Delete property
    path('<slug:slug>/delete/', views.delete_property, name='delete_property'),

    # Property detail page (using slug for clean URLs)
    path('<slug:slug>/', views.property_detail, name='property_detail'),
]