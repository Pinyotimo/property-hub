# property-hub

Django 5.2 powers the backend and server-rendered pages. The `/app/` experience is a Vite + React frontend that builds into `static/frontend/`.

## Setup

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
cd frontend
npm install
```

## Test

```powershell
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py test
cd frontend
npm test
npm run build
```

## Production Settings

Set these environment variables before deploying:

```text
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=<long-random-secret>
DJANGO_ALLOWED_HOSTS=example.com,www.example.com
DJANGO_CSRF_TRUSTED_ORIGINS=https://example.com,https://www.example.com
```

With `DJANGO_DEBUG=False`, HTTPS redirect, secure cookies, and HSTS default on. Override the `DJANGO_SECURE_*` settings only when a proxy or hosting platform already handles that behavior.

## Framework Notes

Keep Django as the main framework for auth, listings, forms, and admin workflows. Keep React + Vite for the richer `/app/` UI. If the API grows beyond the current custom endpoints, add Django REST Framework before expanding hand-written API plumbing further.
