from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.
    Uses email as the unique identifier and adds role + profile fields.
    """

    class Roles(models.TextChoices):
        ADMIN = 'admin', _('Admin')
        BUYER = 'buyer', _('Buyer')
        SELLER = 'seller', _('Seller')

    email = models.EmailField(
        _('email address'),
        unique=True,
        help_text=_('Required. Unique email address.')
    )
    phone = models.CharField(
        max_length=15,
        blank=True,
        help_text=_('Contact phone number.')
    )
    bio = models.TextField(
        blank=True,
        help_text=_('Short bio for the profile.')
    )
    profile_picture = models.ImageField(
        upload_to='profiles/',
        blank=True,
        null=True,
        help_text=_('Profile picture.')
    )
    role = models.CharField(
        max_length=10,
        choices=Roles.choices,
        default=Roles.BUYER,
        help_text=_('Role of the user.')
    )

    # Use email as the primary login field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    def __str__(self):
        # Prefer showing email if username is blank
        return self.username if self.username else self.email

    # ✅ Convenience properties for role checks
    @property
    def is_buyer(self):
        return self.role == self.Roles.BUYER

    @property
    def is_seller(self):
        return self.role == self.Roles.SELLER

    @property
    def is_admin(self):
        return self.role == self.Roles.ADMIN or self.is_superuser