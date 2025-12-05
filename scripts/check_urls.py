import os
import sys

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'property_hub.settings')
import django
from django.urls import reverse, NoReverseMatch

django.setup()

try:
    print('reverse(login) ->', reverse('login'))
except NoReverseMatch as e:
    print('NoReverseMatch for login:', e)

try:
    print('reverse(logout) ->', reverse('logout'))
except Exception as e:
    print('reverse(logout) error:', e)

# list all urlpatterns names
from django.urls import get_resolver
resolver = get_resolver()
all_names = sorted([name for name in resolver.reverse_dict.keys() if isinstance(name, str)])
print('Registered URL names (sample):', all_names[:30])
