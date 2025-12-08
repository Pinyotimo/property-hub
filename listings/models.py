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

    title = models.CharField(max_length=200)
    location = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    bedrooms = models.PositiveIntegerField(blank=True, null=True)
    bathrooms = models.PositiveIntegerField(blank=True, null=True)
    property_type = models.CharField(max_length=20, choices=PROPERTY_TYPES)
    listed_date = models.DateTimeField(auto_now_add=True)

    # ✅ Unique related_name to avoid clash with properties.Property
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="listings_properties"  # unique
    )

    image = models.ImageField(upload_to="property_images/", blank=True, null=True)

    class Meta:
        ordering = ['-listed_date']

    def get_absolute_url(self):
        return reverse('property_detail', kwargs={'pk': self.pk})

    def __str__(self):
        return f"{self.title} - {self.location}"


class Message(models.Model):
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )

    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='messages'
    )

    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    # Reply support
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
        return f"Message from {self.sender} about {self.property.title}"
