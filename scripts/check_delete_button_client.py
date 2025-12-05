import os
import sys
import django

# Ensure project root is on sys.path
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

def main():
    p = Property.objects.first()
    if not p:
        print('No Property objects found in DB.')
        return 2

    admin = User.objects.filter(username='dev_admin').first()
    if not admin:
        print('Creating dev_admin superuser.')
        admin = User.objects.create_superuser('dev_admin', 'dev_admin@example.com', 'password')
    else:
        admin.set_password('password')
        admin.save()

    logged_in = client.login(username='dev_admin', password='password')
    print('Logged in as dev_admin:', logged_in)

    detail_url = f'/listings/property/{p.pk}/'
    resp = client.get(detail_url)
    print('GET', detail_url, '->', resp.status_code)
    html = resp.content.decode('utf-8', errors='replace')
    delete_path = f'/listings/property/{p.pk}/delete/'
    has_delete = delete_path in html and 'btn' in html
    print('Delete link present in rendered HTML:', has_delete)
    if has_delete:
        idx = html.find(delete_path)
        print('Snippet:', html[max(0, idx-60):idx+len(delete_path)+60])
    return 0 if has_delete else 1

if __name__ == '__main__':
    exit(main())
