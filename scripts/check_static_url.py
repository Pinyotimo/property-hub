import urllib.request
url = 'http://127.0.0.1:8000/static/images/default-property.jpg'
req = urllib.request.Request(url, method='HEAD')
try:
    with urllib.request.urlopen(req, timeout=5) as resp:
        print('Status:', resp.status)
        print('Content-Type:', resp.getheader('Content-Type'))
        print('Content-Length:', resp.getheader('Content-Length'))
except Exception as e:
    print('Error:', e)
