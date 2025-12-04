from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views  # ✅ import logout view
from listings import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.property_list, name='home'),
    path('listings/', include('listings.urls')),
    path('profiles/', include('profiles.urls')),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),  # ✅ add this line
]