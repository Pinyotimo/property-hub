from django.urls import path
from . import views

urlpatterns = [
    path('', views.profile_view, name='profile'),  # handles /profiles/
    path('profile/', views.profile_view, name='profile_alt'),  # optional alias
    path('edit/', views.edit_profile, name='edit_profile'),
]