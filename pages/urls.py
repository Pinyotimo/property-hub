# pages/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('about/', views.AboutView.as_view(), name='about'),
    path('contact/', views.contact_view, name='contact'),
]