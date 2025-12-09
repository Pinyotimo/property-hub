class PropertyForm(forms.ModelForm):
    class Meta:
        model = Property
        fields = [
            "title", "description", "price",
            "location",   # ✅ Added here
            "address", "city", "state", "zip_code",
            "property_type", "listing_type",
            "bedrooms", "bathrooms", "square_feet",
            "has_parking", "has_pool", "has_gym", "has_garden",
            "status", "is_featured", "image"
        ]
        exclude = ["owner"]

        widgets = {
            "description": forms.Textarea(attrs={"rows": 4, "class": "form-control"}),
            "location": forms.TextInput(attrs={"class": "form-control"}),  # ✅ Styled
            "address": forms.TextInput(attrs={"class": "form-control"}),
            "city": forms.TextInput(attrs={"class": "form-control"}),
            "state": forms.TextInput(attrs={"class": "form-control"}),
            "zip_code": forms.TextInput(attrs={"class": "form-control"}),
        }