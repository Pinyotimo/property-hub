# properties/views.py
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView, TemplateView
from django.urls import reverse_lazy
from django.db.models import Q
from django.contrib import messages
from .models import Property
from .forms import PropertyForm, PropertyImageFormSet

class PropertyListView(ListView):
    model = Property
    template_name = 'properties/property_list.html'
    context_object_name = 'properties'
    paginate_by = 12

    def get_queryset(self):
        qs = Property.objects.all()
        q = self.request.GET.get('q')
        city = self.request.GET.get('city')
        ptype = self.request.GET.get('ptype')
        ltype = self.request.GET.get('ltype')
        status = self.request.GET.get('status')
        min_price = self.request.GET.get('min')
        max_price = self.request.GET.get('max')

        if q:
            qs = qs.filter(
                Q(title__icontains=q) |
                Q(description__icontains=q) |
                Q(address__icontains=q) |
                Q(city__icontains=q) |
                Q(state__icontains=q)
            )
        if city:
            qs = qs.filter(city__icontains=city)
        if ptype:
            qs = qs.filter(property_type=ptype)
        if ltype:
            qs = qs.filter(listing_type=ltype)
        if status:
            qs = qs.filter(status=status)
        if min_price:
            qs = qs.filter(price__gte=min_price)
        if max_price:
            qs = qs.filter(price__lte=max_price)
        return qs.order_by('-created_at')

class PropertyDetailView(DetailView):
    model = Property
    template_name = 'properties/property_detail.html'
    context_object_name = 'property'
    slug_field = 'slug'
    slug_url_kwarg = 'slug'

class OwnerRequiredMixin(UserPassesTestMixin):
    def test_func(self):
        obj = self.get_object()
        return self.request.user.is_authenticated and obj.owner_id == self.request.user.id

class PropertyCreateView(LoginRequiredMixin, CreateView):
    model = Property
    form_class = PropertyForm
    template_name = 'properties/property_form.html'

    def form_valid(self, form):
        form.instance.owner = self.request.user
        response = super().form_valid(form)
        formset = PropertyImageFormSet(self.object, self.request.POST, self.request.FILES)
        if formset.is_valid():
            self._normalize_primary(formset)
            formset.save()
            messages.success(self.request, 'Property created successfully.')
        else:
            messages.warning(self.request, 'Property was created, but image form had errors.')
        return response

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        if self.request.method == 'POST':
            ctx['formset'] = PropertyImageFormSet(self.object, self.request.POST, self.request.FILES)
        else:
            ctx['formset'] = PropertyImageFormSet()
        ctx['action'] = 'Create'
        return ctx

    @staticmethod
    def _normalize_primary(formset):
        # ensure at most one primary
        primaries = [f for f in formset.forms if f.cleaned_data.get('is_primary') and not f.cleaned_data.get('DELETE')]
        if len(primaries) > 1:
            # keep the first primary, unset others
            for f in primaries[1:]:
                f.cleaned_data['is_primary'] = False

class PropertyUpdateView(LoginRequiredMixin, OwnerRequiredMixin, UpdateView):
    model = Property
    form_class = PropertyForm
    template_name = 'properties/property_form.html'
    slug_field = 'slug'
    slug_url_kwarg = 'slug'

    def form_valid(self, form):
        response = super().form_valid(form)
        formset = PropertyImageFormSet(self.object, self.request.POST, self.request.FILES)
        if formset.is_valid():
            PropertyCreateView._normalize_primary(formset)
            formset.save()
            messages.success(self.request, 'Property updated successfully.')
        else:
            messages.warning(self.request, 'Property updated, but image form had errors.')
        return response

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        if self.request.method == 'POST':
            ctx['formset'] = PropertyImageFormSet(self.object, self.request.POST, self.request.FILES)
        else:
            ctx['formset'] = PropertyImageFormSet(self.object)
        ctx['action'] = 'Update'
        return ctx

class PropertyDeleteView(LoginRequiredMixin, OwnerRequiredMixin, DeleteView):
    model = Property
    template_name = 'properties/property_confirm_delete.html'
    slug_field = 'slug'
    slug_url_kwarg = 'slug'
    success_url = reverse_lazy('properties:list')

    def delete(self, request, *args, **kwargs):
        messages.success(self.request, 'Property deleted successfully.')
        return super().delete(request, *args, **kwargs)

class MyListingsView(LoginRequiredMixin, TemplateView):
    template_name = 'properties/my_listings.html'
    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx['properties'] = self.request.user.properties.all()
        return ctx