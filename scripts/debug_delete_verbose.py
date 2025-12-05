import os
import sys
import django

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'property_hub.settings')
django.setup()

from django.test import Client
from listings.models import Property
from listings.forms import PropertyForm
from django.contrib.auth import get_user_model

User = get_user_model()

client = Client()
client.defaults['HTTP_HOST'] = '127.0.0.1'

def ensure_user(username='dev_admin'):
    u = User.objects.filter(username=username).first()
    if not u:
        print(f'Creating user {username}')
        u = User.objects.create_user(username=username, email=f'{username}@example.com', password='password')
    else:
        u.set_password('password')
        u.save()
    return u

def create_property_for(owner):
    p = Property.objects.create(
        title='Debug Test Property',
        location='Debugville',
        price=100,
        bedrooms=1,
        bathrooms=1,
        property_type='SALE',
        owner=owner
    )
    print('Created property', p.pk)
    return p

def try_delete(as_user, prop):
    logged = client.login(username=as_user.username, password='password')
    print(f'Logged in as {as_user.username}:', logged)
    detail = client.get(f'/listings/property/{prop.pk}/')
    print('GET detail status:', detail.status_code)
    # fetch confirmation page
    conf = client.get(f'/listings/property/{prop.pk}/delete/')
    print('GET confirm status:', conf.status_code)
    if conf.status_code == 200:
        # perform POST
        resp = client.post(f'/listings/property/{prop.pk}/delete/', {})
        print('POST delete status:', resp.status_code)
        exists = Property.objects.filter(pk=prop.pk).exists()
        print('Exists after POST:', exists)
        return exists
    else:
        print('Could not access confirm page (likely not owner or not authenticated)')
        return Property.objects.filter(pk=prop.pk).exists()

def run():
    owner = ensure_user('owner_user')
    other = ensure_user('other_user')

    # create property owned by owner_user
    p = create_property_for(owner)

    print('\nAttempt delete as other_user (should NOT delete)')
    result_other = try_delete(other, p)

    print('\nAttempt delete as owner_user (should delete)')
    result_owner = try_delete(owner, p)

    print('\nSummary:')
    print('Exists after other_user attempt:', result_other)
    print('Exists after owner_user attempt:', result_owner)

if __name__ == "__main__":
    run()
