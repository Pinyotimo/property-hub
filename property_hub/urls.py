from django.contrib import admin
from django.urls import path, include
<<<<<<< HEAD
from django.contrib.auth import views as auth_views
from listings import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.property_list, name='home'),
    path('listings/', include('listings.urls')),

    # include Django's built-in auth views (login, logout, password reset, etc.)
    path('accounts/', include('django.contrib.auth.urls')),
    path('profiles/', include('profiles.urls')),

    # logout redirects to login
    path('logout/', auth_views.LogoutView.as_view(next_page='login'), name='logout'),
=======
from django.conf import settings
from django.conf.urls.static import static
from pages import views as pages_views

urlpatterns = [
    path('', pages_views.home, name='home'),
    path('admin/', admin.site.urls),
    path('accounts/', include('accounts.urls')),  # include accounts app URLs
>>>>>>> 6058fdafe52cd00e0535946faf8957da920a390e
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)