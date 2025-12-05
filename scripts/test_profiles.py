import os
import sys
# Ensure project root is on sys.path so Django settings module imports correctly
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'property_hub.settings')
import django
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model

ClientClass = Client
client = ClientClass()
client.defaults['HTTP_HOST'] = '127.0.0.1'

print('Requesting /profiles/ without auth...')
resp = client.get('/profiles/')
print('Status:', resp.status_code)
if resp.status_code in (301, 302):
    print('Redirect to:', resp.get('Location'))

User = get_user_model()
username = 'test_profile_user'
if not User.objects.filter(username=username).exists():
    print('Creating test user', username)
    user = User.objects.create_user(username=username, email='test@example.com', password='password123')
else:
    user = User.objects.get(username=username)

client.force_login(user)
print('Requesting /profiles/ with authenticated user...')
resp2 = client.get('/profiles/')
print('Status:', resp2.status_code)
print('Content snippet:')
print(resp2.content.decode('utf-8')[:800])
