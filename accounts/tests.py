from django.contrib.auth import get_user_model
from django.test import TestCase


class AccountRoleFormTests(TestCase):
    def test_public_registration_does_not_offer_admin_role(self):
        from .forms import UserRegistrationForm

        offered_roles = [choice[0] for choice in UserRegistrationForm.base_fields["role"].choices]

        self.assertNotIn(get_user_model().Roles.ADMIN, offered_roles)

    def test_profile_update_cannot_change_role(self):
        from .forms import UserUpdateForm

        self.assertNotIn("role", UserUpdateForm.base_fields)


class AccountApiTests(TestCase):
    def test_logout_endpoint_clears_authenticated_session(self):
        User = get_user_model()
        user = User.objects.create_user(
            username="tester",
            email="tester@example.com",
            password="test-pass-123",
            role=User.Roles.BUYER,
        )
        self.client.force_login(user)

        response = self.client.post("/api/accounts/logout/", content_type="application/json")

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json()["user"])
        self.assertNotIn("_auth_user_id", self.client.session)
