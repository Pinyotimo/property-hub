from django.shortcuts import render, redirect
from django.contrib import messages
from django.views.generic import TemplateView
from .forms import ContactForm   # ✅ now this will work
from properties.models import Property

class AboutView(TemplateView):
    template_name = 'pages/about.html'

def home(request):
    featured = Property.objects.filter(is_featured=True).order_by('-created_at')[:8]
    return render(request, 'pages/home.html', {'featured': featured})

def contact_view(request):
    if request.method == 'POST':
        form = ContactForm(request.POST)
        if form.is_valid():
            messages.success(request, 'Message sent successfully!')
            return redirect('pages:contact')
    else:
        form = ContactForm()
    return render(request, 'pages/contact.html', {'form': form})