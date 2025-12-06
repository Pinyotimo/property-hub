# pages/forms.py
from django import forms

class ContactForm(forms.Form):
    name = forms.CharField(max_length=150, label="Your Name")
    email = forms.EmailField(label="Your Email")
    subject = forms.CharField(max_length=200, label="Subject")
    message = forms.CharField(widget=forms.Textarea(attrs={'rows': 6}), label="Message")