from django.urls import path
from . import views

urlpatterns = [
    path('', views.stk_push, name='billing_home'),          # default route
    path('stkpush/', views.stk_push, name='stk_push'),      # explicit STK Push route
    path('mpesa/callback/', views.mpesa_callback, name='mpesa_callback'),
]