from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views 

from django.conf import settings
from django.conf.urls.static import static
from pages import views as pages_views
from django.contrib.auth import views as auth_views 
urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # Home page (choose which one you want as default)
    path('', pages_views.home, name='home'),  # pages app home
    # path('', listings_views.property_list, name='home'),  # listings home (optional)

    # Listings app
    path('listings/', include('listings.urls')),

    # Accounts (custom + Django auth)
    path('accounts/', include('accounts.urls')),                 # your custom accounts app
    path('accounts/', include('django.contrib.auth.urls')),     # login, logout, password reset

    # Profiles app
    path('profiles/', include('profiles.urls')),
    path('logout/', auth_views.LogoutView.as_view(next_page='login'), name='logout'),

]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)