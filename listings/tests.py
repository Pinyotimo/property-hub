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
