from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import User


class UserRegistrationForm(UserCreationForm):
    email = forms.EmailField(required=True)
    role = forms.ChoiceField(
        choices=[
            (User.Roles.BUYER, "Buyer"),
            (User.Roles.SELLER, "Seller"),
        ],
        help_text="Choose how you plan to use Property Hub.",
    )

    class Meta:
        model = User
        fields = ('first_name', 'last_name','username', 'email', 'phone', 'role', 'bio', 'profile_picture')

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError("This email is already in use.")
        return email


class UserUpdateForm(forms.ModelForm):
    class Meta:
        model = User
        fields = (
            'first_name',
            'last_name',
            'email',
            'phone',
            'bio',
            'profile_picture',
        )
