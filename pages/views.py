from django.conf import settings
from django.shortcuts import render


def react_app(request, path=""):
    """React single-page app shell."""
    return render(request, "react_app.html", {"use_vite": settings.DEBUG})
