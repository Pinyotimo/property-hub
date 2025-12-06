from django import forms
from .models import Property, Message

class PropertyForm(forms.ModelForm):
    class Meta:
        model = Property
        exclude = ['owner']  # owner will be set in the view

class MessageForm(forms.ModelForm):
    class Meta:
        model = Message
        fields = ['message']
        widgets = {
            'message': forms.Textarea(attrs={'rows': 4, 'placeholder': 'Enter your message here...'}),
        }
