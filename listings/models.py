from django.db import models
from django.conf import settings
from django.urls import reverse


class Property(models.Model):
    PROPERTY_TYPES = [
        ('house', 'House'),
        ('apartment', 'Apartment'),
        ('land', 'Land'),
        ('commercial', 'Commercial'),
        ('rental', 'Rental'),
    ]

    LISTING_TYPES = [
        ('sale', 'For Sale'),
        ('rent', 'For Rent'),
    ]

    STATUS_CHOICES = [
        ('available', 'Available'),
        ('sold', 'Sold'),
        ('rented', 'Rented'),
        ('pending', 'Pending'),
    ]

    # Core fields
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)

    # Location fields
    address = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    zip_code = models.CharField(max_length=20, blank=True, null=True)
    location = models.CharField(max_length=200)  # keep for quick search

    # Property details
    property_type = models.CharField(max_length=20, choices=PROPERTY_TYPES)
    listing_type = models.CharField(max_length=20, choices=LISTING_TYPES, default='sale')
    bedrooms = models.PositiveIntegerField(blank=True, null=True)
    bathrooms = models.PositiveIntegerField(blank=True, null=True)
    square_feet = models.PositiveIntegerField(blank=True, null=True)
    

    # Features
    has_parking = models.BooleanField(default=False)
    has_pool = models.BooleanField(default=False)
    has_gym = models.BooleanField(default=False)
    has_garden = models.BooleanField(default=False)

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    is_featured = models.BooleanField(default=False)

    # Ownership
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="listings_properties"
    )

    # Media
    image = models.ImageField(upload_to="property_images/", blank=True, null=True)

    # Metadata
    listed_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-listed_date']
        verbose_name_plural = "Properties"

    def get_absolute_url(self):
        return reverse('property_detail', kwargs={'pk': self.pk})

    def __str__(self):
        return f"{self.title} - {self.location}"


class PropertyImage(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='property_images/')
    is_primary = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_primary', 'uploaded_at']

    def __str__(self):
        return f"Image for {self.property.title}"


class Message(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_messages',
        null=True,
        blank=True
    )
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    reply = models.TextField(blank=True, null=True)
    replied_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='replied_messages'
    )
    reply_timestamp = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"Message from {self.sender} to {self.receiver or 'N/A'} about {self.property.title}"