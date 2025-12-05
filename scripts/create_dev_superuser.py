import os
import sys

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if BASE not in sys.path:
    sys.path.insert(0, BASE)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'property_hub.settings')
import django
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

USERNAME = 'dev_admin'
EMAIL = 'dev_admin@example.com'
PASSWORD = 'password'

user = User.objects.filter(username=USERNAME).first()
if user:
    print(f"User '{USERNAME}' exists — making superuser and resetting password")
    user.is_staff = True
    user.is_superuser = True
    user.set_password(PASSWORD)
    user.email = EMAIL
    user.save()
else:
    print(f"Creating superuser '{USERNAME}'")
    user = User.objects.create_superuser(USERNAME, EMAIL, PASSWORD)

print('Done. You can log in at /admin/ with:')
print(f'  username: {USERNAME}')
print(f'  password: {PASSWORD}')
