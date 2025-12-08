from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.
    Uses email as the unique identifier and adds extra profile fields.
    """

    ROLE_CHOICES = (
        ('buyer', 'Buyer'),
        ('seller', 'Seller'),
    )

    email = models.EmailField(
        _('email address'),
        unique=True,
        help_text='Required. Unique email address.'
    )
    phone = models.CharField(
        max_length=15,
        blank=True,
        help_text='Contact phone number.'
    )
    bio = models.TextField(
        blank=True,
        help_text='Short bio for the profile.'
    )
    profile_picture = models.ImageField(
        upload_to='profiles/',
        blank=True,
        null=True,
        help_text='Profile picture.'
    )

    # Role field for access control (Buyer or Seller)
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='buyer',
        help_text='Select Buyer or Seller during registration.'
    )

    # Use email as the primary login field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']  # username is still required for admin compatibility

    def __str__(self):
        return f"{self.email} ({self.role})"