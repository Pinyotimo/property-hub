from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from pages import views as pages_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('app/', pages_views.react_app, name='react_app'),
    path('app/<path:path>/', pages_views.react_app, name='react_app_path'),
    path('api/accounts/', include('accounts.api_urls')),
    path('api/listings/', include('listings.api_urls')),
    path('', pages_views.react_app, name='home'),
    path('listings/', include('listings.urls')),
    path('accounts/', include('accounts.urls')),
    path('profiles/', include('profiles.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
