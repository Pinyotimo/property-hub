from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    # Custom Register View
    path('register/', views.register, name='register'),
    
    # Built-in Auth Views (Login/Logout/Password Reset)
    path('login/', auth_views.LoginView.as_view(template_name='accounts/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(template_name='accounts/logout.html'), name='logout'),
    
    # Profile View
    path('profile/', views.profile, name='profile'),
]