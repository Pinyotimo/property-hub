import os
import sys

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if BASE not in sys.path:
    sys.path.insert(0, BASE)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'property_hub.settings')
import django
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model

User = get_user_model()

USERNAME = 'dev_admin'
PASSWORD = 'password'

client = Client()
client.defaults['HTTP_HOST'] = '127.0.0.1'
print('Attempting client.login...')
ok = client.login(username=USERNAME, password=PASSWORD)
print('client.login returned:', ok)
if not ok:
    print('Attempting to reset password for existing user...')
    user = User.objects.filter(username=USERNAME).first()
    if user:
        user.set_password(PASSWORD)
        user.save()
        ok = client.login(username=USERNAME, password=PASSWORD)
        print('After reset, client.login returned:', ok)
    else:
        print('No such user found to reset')

if ok:
    resp = client.get('/admin/')
    print('GET /admin/ ->', resp.status_code)
    # check admin index content title
    if resp.status_code == 200 and b'Django administration' in resp.content:
        print('Admin login successful and admin index accessible')
    else:
        print('Unexpected admin response; length:', len(resp.content))
else:
    print('Failed to login programmatically. You can open /admin/ in the browser and log in manually using the credentials in scripts/create_dev_superuser.py')
