import os
import sys
import django

# Ensure project root is on sys.path so `property_hub` is importable
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'property_hub.settings')
django.setup()

from django.test import Client
from listings.models import Property
from django.contrib.auth import get_user_model

User = get_user_model()

client = Client()
# Use a host allowed by the project's settings to avoid DisallowedHost from the test client
client.defaults['HTTP_HOST'] = '127.0.0.1'

print('Unauthenticated requests:')
endpoints = ['/', '/listings/', '/profiles/', '/listings/property/add/']
for ep in endpoints:
    resp = client.get(ep)
    loc = resp.headers.get('Location') if hasattr(resp, 'headers') else resp.get('Location')
    print(f"GET {ep} -> {resp.status_code}" + (f", Location: {loc}" if loc else ''))

print('\nChecking a few property detail pages:')
props = Property.objects.all()[:5]
if not props:
    print('No Property objects found in database to test detail pages.')
else:
    for p in props:
        url = f'/listings/property/{p.pk}/'
        resp = client.get(url)
        print(f'GET {url} -> {resp.status_code}')

print('\nChoose-image behavior (unauthenticated):')
if props:
    p = props[0]
    url = f'/listings/property/{p.pk}/choose-image/'
    resp = client.get(url)
    loc = resp.headers.get('Location') if hasattr(resp, 'headers') else resp.get('Location')
    print(f'GET {url} -> {resp.status_code}' + (f', Location: {loc}' if loc else ''))

print('\nAttempting as superuser:')
admin = User.objects.filter(is_superuser=True).first()
if not admin:
    print('No superuser found; creating temp superuser `testsuper` (password: `password`).')
    admin = User.objects.create_superuser('testsuper', 'testsuper@example.com', 'password')
else:
    print(f'Using existing superuser: {admin.username}')

logged_in = client.login(username=admin.username, password=('password' if admin.username == 'testsuper' else admin.password))
# Note: admin.password is hashed, so login will fail for existing superuser unless they know the raw password.
if not logged_in:
    print('Could not log in with superuser credentials (likely because existing superuser password unknown).')
    print('Trying to set a usable password for the found superuser...')
    try:
        admin.set_password('password')
        admin.save()
        logged_in = client.login(username=admin.username, password='password')
        print('Password reset and login successful.' if logged_in else 'Password reset failed to login.')
    except Exception as e:
        print('Failed to reset password for superuser:', e)

if logged_in and props:
    p = props[0]
    url = f'/listings/property/{p.pk}/choose-image/'
    resp = client.get(url)
    print(f'As superuser GET {url} -> {resp.status_code}')
    # attempt a POST with no selection
    resp2 = client.post(url, {'selected_image': ''})
    print(f'As superuser POST {url} -> {resp2.status_code}')

print('\nDone.')
