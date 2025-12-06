#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'property_hub.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=yBk7j0gv0nJNiYhwX7X8WAqQqPBs9xLQX7VwkvvAAtsFAkYCmMPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_EXPRESS_SHORTCODE=174379  # or your actual shortcode
MPESA_INITIATOR_NAME=your_initiator_name
MPESA_INITIATOR_PASSWORD=your_initiator_password