# properties/forms.py
from django import forms
from django.forms import inlineformset_factory
from .models import Property, PropertyImage

class PropertyForm(forms.ModelForm):
    class Meta:
        model = Property
        fields = [
            'title', 'description', 'price',
            'address', 'city', 'state', 'zip_code',
            'property_type', 'listing_type',
            'bedrooms', 'bathrooms', 'square_feet',
            'has_parking', 'has_pool', 'has_gym', 'has_garden',
            'status', 'is_featured'
        ]
        widgets = {
            'description': forms.Textarea(attrs={'rows': 5}),
            'property_type': forms.Select(attrs={'class': 'form-select'}),
            'listing_type': forms.Select(attrs={'class': 'form-select'}),
            'status': forms.Select(attrs={'class': 'form-select'}),
        }

class PropertyImageForm(forms.ModelForm):
    class Meta:
        model = PropertyImage
        fields = ['image', 'is_primary']
        widgets = {
            'is_primary': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }

PropertyImageFormSet = inlineformset_factory(
    Property,
    PropertyImage,
    form=PropertyImageForm,
    extra=3,
    can_delete=True
)