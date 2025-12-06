from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from pages import views as pages_views

urlpatterns = [
    path('', pages_views.home, name='home'),  # Home page
    path('admin/', admin.site.urls),
    path('accounts/', include(('accounts.urls', 'accounts'), namespace='accounts')),      # ✅ Accounts app
    path('properties/', include(('properties.urls', 'properties'), namespace='properties')),
    path('pages/', include('pages.urls')),            # ✅ Pages app (about, contact)
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)