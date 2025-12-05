import os
import sys

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if BASE not in sys.path:
    sys.path.insert(0, BASE)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'property_hub.settings')
import django
django.setup()

from listings.models import Property
from django.conf import settings

p = Property.objects.first()
if not p:
    print('No Property objects found in DB')
    sys.exit(0)

print('Property:', p.pk, p.title)
print('image field name:', repr(p.image.name))
if not p.image:
    print('No image set on this Property')
    sys.exit(0)

abs_path = os.path.join(settings.MEDIA_ROOT, p.image.name)
print('Expected file path:', abs_path)
if not os.path.exists(abs_path):
    print('File not found on disk')
    sys.exit(0)

st = os.stat(abs_path)
print('File size (bytes):', st.st_size)
print('Last modified:', st.st_mtime)
with open(abs_path, 'rb') as f:
    head = f.read(256)
print('First bytes (hex):', head[:32].hex())
print('Content-type guess:', 'jpeg' if head[:3]==b'\xff\xd8\xff' else 'png?' if head[:8].startswith(b'\x89PNG') else 'other')
