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
client.defaults['HTTP_HOST'] = '127.0.0.1'

def find_property():
    return Property.objects.first()

def ensure_dev_superuser():
    admin = User.objects.filter(username='dev_admin').first()
    if not admin:
        print('Creating dev_admin superuser with password `password`')
        admin = User.objects.create_superuser('dev_admin', 'dev_admin@example.com', 'password')
    else:
        # ensure a known password
        admin.set_password('password')
        admin.save()
        print('Ensured dev_admin exists and password set to `password`')
    return admin

def run():
    p = find_property()
    if not p:
        print('No Property found in DB — cannot run delete flow test.')
        return 1

    admin = ensure_dev_superuser()

    logged_in = client.login(username=admin.username, password='password')
    if not logged_in:
        print('Failed to log in as dev_admin')
        return 2

    detail_url = f'/listings/property/{p.pk}/'
    delete_url = f'/listings/property/{p.pk}/delete/'

    print(f'Visiting detail page: GET {detail_url}')
    resp = client.get(detail_url)
    print('Status:', resp.status_code)

    print(f'Visiting delete confirmation page: GET {delete_url}')
    resp = client.get(delete_url)
    print('Status:', resp.status_code)
    if resp.status_code != 200:
        print('Delete confirmation page did not return 200; aborting.')
        return 3

    print('Posting delete confirmation (POST to delete URL)')
    resp2 = client.post(delete_url, {})
    print('POST status:', resp2.status_code)

    exists = Property.objects.filter(pk=p.pk).exists()
    print('Property still exists after delete?' , exists)
    return 0 if not exists else 4

if __name__ == '__main__':
    exit(run())
