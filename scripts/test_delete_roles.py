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
from django.contrib.auth import get_user_model

User = get_user_model()

client = Client()
client.defaults['HTTP_HOST'] = '127.0.0.1'


def ensure_users():
    owner = User.objects.filter(username='owner_user').first()
    if not owner:
        owner = User.objects.create_user('owner_user', 'owner@example.com', 'password')
    else:
        owner.set_password('password'); owner.save()

    superu = User.objects.filter(username='super_user').first()
    if not superu:
        superu = User.objects.create_superuser('super_user', 'super@example.com', 'password')
    else:
        superu.set_password('password'); superu.save()

    staff = User.objects.filter(username='staff_user').first()
    if not staff:
        staff = User.objects.create_user('staff_user', 'staff@example.com', 'password')
        staff.is_staff = True
        staff.save()
    else:
        staff.set_password('password'); staff.is_staff=True; staff.save()

    return owner, superu, staff


def create_property(owner):
    p = Property.objects.create(
        title='Role Test',
        location='Test',
        price=1,
        bedrooms=1,
        bathrooms=1,
        property_type='SALE',
        owner=owner
    )
    return p


def attempt_delete(user, prop):
    logged = client.login(username=user.username, password='password')
    print(f'Logged in as {user.username}:', logged)
    conf = client.get(f'/listings/property/{prop.pk}/delete/')
    print('GET confirm:', conf.status_code)
    if conf.status_code == 200:
        post = client.post(f'/listings/property/{prop.pk}/delete/', {})
        print('POST delete status:', post.status_code)
        exists = Property.objects.filter(pk=prop.pk).exists()
        print('Exists after POST:', exists)
        return exists
    else:
        print('Cannot access confirm page')
        return Property.objects.filter(pk=prop.pk).exists()


def run():
    owner, superu, staff = ensure_users()
    p = create_property(owner)
    print('Property created:', p.pk)

    print('\nTry delete as superuser:')
    res_super = attempt_delete(superu, p)
    if not res_super:
        print('Superuser deleted the property (OK)')
        # recreate for next test
        p = create_property(owner)
    else:
        print('Superuser could not delete the property (NOT OK)')

    print('\nTry delete as staff:')
    res_staff = attempt_delete(staff, p)
    if not res_staff:
        print('Staff deleted the property (OK)')
    else:
        print('Staff could not delete the property (NOT OK)')

if __name__ == '__main__':
    run()
