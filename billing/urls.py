from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='billing_home'),
    path('stkpush/', views.stk_push, name='stk_push'),
    path('mpesa/callback/', views.mpesa_callback, name='mpesa_callback'),
]