from django import forms
from .models import Message, Property


class PropertyForm(forms.ModelForm):
    class Meta:
        model = Property
        fields = [
            "title", "description", "location", "price",
            "address", "city", "state", "zip_code",
            "property_type", "listing_type",
            "bedrooms", "bathrooms", "square_feet",
            "has_parking", "has_pool", "has_gym", "has_garden",
            "status", "is_featured", "image"
        ]
        widgets = {
            "description": forms.Textarea(attrs={"rows": 4, "class": "form-control"}),
            "location": forms.TextInput(attrs={"class": "form-control"}),
            "address": forms.TextInput(attrs={"class": "form-control"}),
            "city": forms.TextInput(attrs={"class": "form-control"}),
            "state": forms.TextInput(attrs={"class": "form-control"}),
            "zip_code": forms.TextInput(attrs={"class": "form-control"}),
        }


class MessageForm(forms.ModelForm):
    class Meta:
        model = Message
        fields = ["message"]
        widgets = {
            "message": forms.Textarea(
                attrs={"rows": 4, "placeholder": "Enter your message here...", "class": "form-control"}
            ),
        }
