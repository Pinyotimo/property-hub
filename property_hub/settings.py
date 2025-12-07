"""
Django settings for property_hub project.
"""
from pathlib import Path
import os
from decouple import config

MPESA_EXPRESS_SHORTCODE = config("MPESA_EXPRESS_SHORTCODE")

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-&su5gxe3$t$(4y1zxlczh)pa+9bu1zj$-_k78-*_j34rrk(4nu'
DEBUG = True
ALLOWED_HOSTS = ["127.0.0.1", "localhost"]

INSTALLED_APPS = [
    # Django core apps
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party apps
    'crispy_forms',
    'crispy_bootstrap5',
    'django_daraja',

    # Local apps
    'accounts',
    'properties',
    'payments',
    'pages',
    'billing',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'property_hub.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'property_hub.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Nairobi'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static')]
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

CRISPY_TEMPLATE_PACK = 'bootstrap5'

AUTH_USER_MODEL = 'accounts.User'

LOGIN_REDIRECT_URL = 'profile'
LOGIN_URL = 'login'
LOGIN_REDIRECT_URL = 'property_list'
LOGOUT_REDIRECT_URL = 'logout_confirmation'
LOGOUT_REDIRECT_URL = 'home'  # or 'login' or 'property_list'
# M-Pesa Configuration
MPESA_ENVIRONMENT = 'sandbox'
MPESA_CONSUMER_KEY = 'Bk7j0gv0nJNiYhwX7X8WAqQqPBs9xLQX7VwkvvAAtsFAkYCm'
MPESA_CONSUMER_SECRET = 'QzYuC1FJ2GlxgHPjv8uRjr9j1SNVsQNl7uZlvRDe1ntl26YOAuXrNqkvgY5rsAq3'
MPESA_SHORTCODE = '174379'
MPESA_PASSKEY = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'
MPESA_CALLBACK_URL = 'https://your-ngrok-url/billing/mpesa/callback/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'