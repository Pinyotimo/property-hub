import os, sys
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'property_hub.settings')
import django
django.setup()
from listings.models import Property

for p in Property.objects.all():
    print('Property', p.pk, p.title)
    print(' image field:', p.image.name)
    try:
        print(' image url:', p.image.url)
    except Exception as e:
        print(' image url error:', e)
    print(' exists on disk:', os.path.exists(os.path.join(BASE_DIR, 'media', p.image.name)) if p.image.name else 'no image')
    print('---')
