from django.db import models
from django.contrib.auth.models import User
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
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="properties")
    image = models.ImageField(upload_to="property_images/", blank=True, null=True)

    class Meta:
        ordering = ['-listed_date']

    def get_absolute_url(self):
        return reverse('property_detail', kwargs={'pk': self.pk})

    def __str__(self):
        return f"{self.title} - {self.location}"