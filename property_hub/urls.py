from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views  # ✅ import logout view
from listings import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.property_list, name='home'),
    path('listings/', include('listings.urls')),
    # include Django's built-in auth views (login, password reset, etc.)
    path('accounts/', include('django.contrib.auth.urls')),
    path('profiles/', include('profiles.urls')),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),  # ✅ add this line
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)