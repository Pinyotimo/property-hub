from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.
    Adds email as a unique identifier and extra profile fields.
    """
    email = models.EmailField(unique=True, help_text='Required. unique email address.')
    phone = models.CharField(max_length=15, blank=True, help_text='Contact phone number.')
    bio = models.TextField(blank=True, help_text='Short bio for the profile.')
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True, help_text='Profile picture.')

    # We want to use email to log in, not username, but Django requires username by default.
    # We can keep username or strictly enforce email. For simplicity, we keep username 
    # but make email mandatory and unique.

    def __str__(self):
        return self.username