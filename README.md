# Property Hub

Property Hub is a full-stack web application for browsing and managing real estate listings. It features a Django backend for robust data management and authentication, paired with a modern React frontend built with Vite for a responsive user experience.

## Features

- **Property Listings**: Browse houses, apartments, land, commercial spaces, and rentals
- **Advanced Filtering**: Filter by property type, listing type (sale/rent), status, and search by title, location, or description
- **User Authentication**: Secure login and registration system
- **Seller Dashboard**: Add, edit, and manage property listings
- **Messaging System**: Contact property owners or view messages for your listings
- **Admin Panel**: Full Django admin interface for system management
- **Responsive Design**: Mobile-friendly interface with modern UI

## Tech Stack

- **Backend**: Django 5.2, Python 3.x
- **Frontend**: React 18, Vite, JSX
- **Database**: SQLite (development), PostgreSQL (production recommended)
- **Styling**: Custom CSS with modern design system
- **Authentication**: Django's built-in auth system
- **API**: Custom REST API endpoints

## Project Structure

```
property-hub/
├── property_hub/          # Django project settings
├── accounts/              # User authentication app
├── listings/              # Property listings app
├── profiles/              # User profiles app
├── payments/              # Payment processing (future)
├── billing/               # Billing management (future)
├── pages/                 # Static pages
├── frontend/              # React application
│   ├── src/
│   │   ├── main.jsx       # Main React app
│   │   └── styles.css     # Global styles
│   └── package.json
├── static/                # Static files
├── templates/             # Django templates
├── media/                 # User-uploaded files
└── scripts/               # Utility scripts
```

## Setup

### Prerequisites

- Python 3.8+
- Node.js 16+
- Git

### Backend Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd property-hub
   ```

2. Create and activate virtual environment:
   ```powershell
   python -m venv env
   .\env\Scripts\Activate.ps1  # Windows
   # or
   source env/bin/activate     # macOS/Linux
   ```

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run database migrations:
   ```bash
   python manage.py migrate
   ```

5. Create a superuser (optional, for admin access):
   ```bash
   python manage.py createsuperuser
   ```

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Build the frontend (for production) or start development server:
   ```bash
   npm run build  # Build for production
   # or
   npm run dev    # Development server
   ```

## Development

### Running the Application

1. Start the Django development server:
   ```bash
   python manage.py runserver
   ```

2. In another terminal, start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open your browser to `http://localhost:8000`

### Testing

Run backend tests:
```bash
python manage.py test
```

Run frontend tests:
```bash
cd frontend
npm test
```

### Code Quality

- Use Django's built-in testing framework for backend tests
- Use Jest for frontend component testing
- Follow PEP 8 for Python code style
- Use ESLint for JavaScript/React code quality

## Deployment

### Production Settings

Set these environment variables before deploying:

```bash
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=<long-random-secret-key>
DJANGO_ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DJANGO_CSRF_TRUSTED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

With `DJANGO_DEBUG=False`, the application automatically:
- Enables HTTPS redirects
- Sets secure cookies
- Enables HSTS headers

### Static Files

For production, collect static files:
```bash
python manage.py collectstatic
```

### Database

Use PostgreSQL in production. Update `DATABASES` in `settings.py`:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'property_hub',
        'USER': 'your_user',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

## API Documentation

The application provides REST API endpoints:

- `GET /api/listings/properties/` - List properties with filtering
- `POST /api/listings/properties/` - Create new property (sellers only)
- `GET /api/listings/properties/{id}/` - Get property details
- `PUT /api/listings/properties/{id}/` - Update property (owner only)
- `DELETE /api/listings/properties/{id}/` - Delete property (owner only)
- `GET /api/listings/properties/{id}/messages/` - Get property messages
- `POST /api/listings/properties/{id}/messages/` - Send message about property

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions or issues, please open an issue on GitHub or contact the development team.
