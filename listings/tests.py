from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from .models import Message, Property


class MessageAccessTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.owner = User.objects.create_user(
            username="owner",
            email="owner@example.com",
            password="test-pass-123",
            role=User.Roles.SELLER,
        )
        self.customer = User.objects.create_user(
            username="customer",
            email="customer@example.com",
            password="test-pass-123",
            role=User.Roles.BUYER,
        )
        self.other = User.objects.create_user(
            username="other",
            email="other@example.com",
            password="test-pass-123",
            role=User.Roles.BUYER,
        )
        self.admin = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="test-pass-123",
            role=User.Roles.ADMIN,
        )
        self.property = Property.objects.create(
            title="Test Home",
            price=Decimal("2500000.00"),
            location="Nairobi",
            property_type="house",
            listing_type="sale",
            owner=self.owner,
        )
        Message.objects.create(
            property=self.property,
            sender=self.customer,
            receiver=self.owner,
            message="Is this still available?",
        )

    def test_unrelated_user_cannot_view_property_conversation(self):
        self.client.force_login(self.other)

        response = self.client.get(reverse("view_messages", args=[self.property.pk]))

        self.assertEqual(response.status_code, 403)

    def test_owner_and_admin_can_view_property_conversation(self):
        url = reverse("view_messages", args=[self.property.pk])

        self.client.force_login(self.owner)
        self.assertEqual(self.client.get(url).status_code, 200)

        self.client.force_login(self.admin)
        self.assertEqual(self.client.get(url).status_code, 200)


class PropertyCreateTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.seller = User.objects.create_user(
            username="seller",
            email="seller@example.com",
            password="test-pass-123",
            role=User.Roles.SELLER,
        )
        self.buyer = User.objects.create_user(
            username="buyer",
            email="buyer@example.com",
            password="test-pass-123",
            role=User.Roles.BUYER,
        )

    def test_seller_can_create_property(self):
        self.client.force_login(self.seller)
        response = self.client.post(reverse("property_create"), {
            "title": "Sample Property",
            "description": "A great place to live.",
            "location": "Nairobi",
            "price": "1000000.00",
            "address": "123 Main St",
            "city": "Nairobi",
            "state": "Nairobi",
            "zip_code": "00100",
            "property_type": "house",
            "listing_type": "sale",
            "bedrooms": "3",
            "bathrooms": "2",
            "square_feet": "1200",
            "has_parking": "on",
            "has_pool": "on",
            "has_gym": "on",
            "has_garden": "on",
            "status": "available",
            "is_featured": "on",
        })

        self.assertEqual(response.status_code, 302)
        self.assertTrue(Property.objects.filter(owner=self.seller, title="Sample Property").exists())

    def test_buyer_cannot_access_property_create(self):
        self.client.force_login(self.buyer)
        response = self.client.get(reverse("property_create"))
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse("property_list"))
