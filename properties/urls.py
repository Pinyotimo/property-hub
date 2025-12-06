# properties/urls.py
from django.urls import path
from . import views

app_name = 'properties'

urlpatterns = [
    path('', views.PropertyListView.as_view(), name='list'),
    path('mine/', views.MyListingsView.as_view(), name='my_listings'),
    path('create/', views.PropertyCreateView.as_view(), name='create'),
    path('<slug:slug>/', views.PropertyDetailView.as_view(), name='detail'),
    path('<slug:slug>/edit/', views.PropertyUpdateView.as_view(), name='update'),
    path('<slug:slug>/delete/', views.PropertyDeleteView.as_view(), name='delete'),
]