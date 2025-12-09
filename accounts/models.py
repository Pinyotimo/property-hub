from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.
    Adds email as a unique identifier, role, and extra profile fields.
    """

    class Roles(models.TextChoices):
        ADMIN = 'admin', _('Admin')
        BUYER = 'buyer', _('Buyer')
        SELLER = 'seller', _('Seller')

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
    role = models.CharField(
        max_length=10,
        choices=Roles.choices,
        default=Roles.BUYER,
        help_text='Role of the user.'
    )

    # first_name, last_name, username, and password are inherited from AbstractUser

    # Use email as the primary login field (optional, keep username too)
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'first_name', 'last_name']

    def __str__(self):
        return self.username

    # Convenience methods for role checks
    def is_buyer(self):
        return self.role == self.Roles.BUYER

    def is_seller(self):
        return self.role == self.Roles.SELLER

    def is_admin(self):
        return self.role == self.Roles.ADMIN