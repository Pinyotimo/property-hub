import os
import sys
import django
import urllib.request
import http.cookiejar
import urllib.parse
import re

# Set up Django environment to find a Property PK
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'property_hub.settings')
django.setup()

from listings.models import Property

HOST = '127.0.0.1:8000'

def main():
    p = Property.objects.first()
    if not p:
        print('No Property objects found in DB.')
        return 2

    url = f'http://{HOST}/listings/property/{p.pk}/'
    print('Fetching (unauthenticated):', url)
    try:
        with urllib.request.urlopen(url, timeout=5) as r:
            html = r.read().decode('utf-8', errors='replace')
    except Exception as e:
        print('HTTP request failed:', e)
        return 3

    # Look for the delete link/button for this property
    delete_path = f'/listings/property/{p.pk}/delete/'
    has_delete_link = delete_path in html and 'btn' in html

    print('Found delete URL in page HTML (unauthenticated):' , has_delete_link)
    if has_delete_link:
        idx = html.find(delete_path)
        snippet = html[max(0, idx-60):idx+len(delete_path)+60]
        print('HTML snippet:', snippet)
        return 0

    # Try to perform HTTP login as dev_admin and re-check the page
    print('\nAttempting HTTP login as `dev_admin` and re-checking...')
    cj = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

    login_page = f'http://{HOST}/accounts/login/'
    try:
        with opener.open(login_page, timeout=5) as resp:
            login_html = resp.read().decode('utf-8', errors='replace')
    except Exception as e:
        print('Failed to fetch login page:', e)
        return 4

    # Extract CSRF token
    m = re.search(r"name=['\"]csrfmiddlewaretoken['\"] value=['\"]([^'\"]+)['\"]", login_html)
    csrf = m.group(1) if m else None
    if not csrf:
        print('Could not find CSRF token on login page; aborting HTTP login.')
        return 5

    post_data = urllib.parse.urlencode({
        'username': 'dev_admin',
        'password': 'password',
        'csrfmiddlewaretoken': csrf,
        'next': f'/listings/property/{p.pk}/'
    }).encode('utf-8')

    headers = {
        'Referer': login_page,
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    req = urllib.request.Request(login_page, data=post_data, headers=headers)
    try:
        with opener.open(req, timeout=5) as resp:
            resp_html = resp.read().decode('utf-8', errors='replace')
            # If login successful, often redirect; cookiejar stores sessionid
    except Exception as e:
        print('Login POST failed:', e)
        return 6

    # Now fetch the property page with the session cookie
    try:
        with opener.open(url, timeout=5) as r2:
            html2 = r2.read().decode('utf-8', errors='replace')
    except Exception as e:
        print('HTTP request (post-login) failed:', e)
        return 7

    has_delete_link2 = delete_path in html2 and 'btn' in html2
    print('Found delete URL after login:' , has_delete_link2)
    if has_delete_link2:
        idx = html2.find(delete_path)
        snippet = html2[max(0, idx-60):idx+len(delete_path)+60]
        print('HTML snippet:', snippet)
        return 0

    return 1

if __name__ == '__main__':
    exit(main())
