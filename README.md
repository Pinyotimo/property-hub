# Property Hub

Property Hub is a full-stack real estate marketplace that combines a Django backend with a React + Vite frontend. It supports property browsing, seller CRUD actions, admin approvals, and a messaging flow for listings.

## Highlights

- Browse listings with search and category filters
- Create, edit, and delete listings from the seller experience
- View and manage messages associated with properties
- Use the Django admin panel for approvals and management
- Run the app locally with a shared Vite proxy for `/api`, `/media`, `/static`, `/admin`, and `/ws`

## Tech Stack

- **Backend:** Django 5.2.9, Django Channels, Python 3.14
- **Frontend:** React 19, Vite 7, Vitest
- **Database:** SQLite for development
- **Styling:** Custom CSS
- **Authentication:** Django auth with a custom user model

## Project Structure

```text
property-hub/
├── accounts/              # Authentication and user account logic
├── listings/              # Listings, messages, and WebSocket routing
├── pages/                 # Static pages and view helpers
├── payments/              # Payment-related app
├── profiles/              # Profile models and views
├── properties/            # Property models and related logic
├── property_hub/          # Django settings, URLs, ASGI/WSGI entrypoints
├── frontend/              # React + Vite frontend
│   ├── src/               # React app source
│   ├── package.json       # Frontend scripts and dependencies
│   └── vite.config.js    # Dev server proxy and build output
├── templates/             # Django templates
├── static/                # Static assets for Django
├── media/                 # Uploaded images and user files
├── scripts/               # Utility scripts and local checks
└── db.sqlite3             # Local development database
```

## Prerequisites

- Python 3.8+
- Node.js 18+
- Git

## Local Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd property-hub
```

### 2. Create and activate a virtual environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

For macOS/Linux:

```bash
python -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
cd frontend
npm install
cd ..
```

### 4. Apply database migrations

```bash
python manage.py migrate
```

### 5. Create an optional superuser

```bash
python manage.py createsuperuser
```

## Run the app locally

### Backend

Start the Django development server on port `8001`:

```bash
python manage.py runserver 127.0.0.1:8001
```

### Frontend

In a second terminal, start the Vite development server:

```bash
cd frontend
npm run dev
```

### Open the app

- Django UI and API: `http://127.0.0.1:8001`
- React frontend: `http://127.0.0.1:5173`

> The frontend dev server proxies `/api`, `/media`, `/static`, `/admin`, and `/ws` to `http://127.0.0.1:8001`, so the React app can talk to Django directly during development.

> If port `8000` is already occupied, keep using `8001` for Django. The frontend proxy is already configured for that port.

## Environment variables

The current Django settings read the following environment variables:

```bash
DJANGO_DEBUG=True
DJANGO_SECRET_KEY=<long-random-secret-key>
DJANGO_ALLOWED_HOSTS=<comma-separated-hostnames>
DJANGO_CSRF_TRUSTED_ORIGINS=http://127.0.0.1:5173,http://localhost:5173
```

For local development, the defaults are already suitable. For production, set `DJANGO_DEBUG=False` and provide real values for `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, and `DJANGO_CSRF_TRUSTED_ORIGINS`.

## Testing

Run the backend tests:

```bash
.\.venv\Scripts\python manage.py test
```

Run the frontend tests:

```bash
cd frontend
npm test
```

### Verified test results

- **Django:** `10` tests passed
- **Frontend:** `1` test file passed, `9` tests passed

## Production build

Build the frontend for production:

```bash
cd frontend
npm run build
```

Collect Django static files for deployment:

```bash
python manage.py collectstatic
```

## API overview

The app exposes a custom API for listing management and messaging:

- `GET /api/listings/properties/` - List properties
- `POST /api/listings/properties/` - Create a property (seller only)
- `GET /api/listings/properties/{id}/` - Retrieve a property
- `PUT /api/listings/properties/{id}/` - Update a property
- `DELETE /api/listings/properties/{id}/` - Delete a property
- `GET /api/listings/properties/{id}/messages/` - View property messages
- `POST /api/listings/properties/{id}/messages/` - Send a message about a property

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add or update tests when you change behavior
5. Run the backend and frontend test suites
6. Open a pull request

## License

This project is licensed under the MIT License.

## Support

If you need help, open an issue or reach out to the project maintainers.
