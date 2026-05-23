from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.core.exceptions import ObjectDoesNotExist, PermissionDenied

from .api_views import _serialize_message
from .models import Message, Property
from .views import _conversation_receiver


class PropertyMessageConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.property_id = self.scope["url_route"]["kwargs"]["property_id"]
        self.user = self.scope["user"]
        self.group_name = self._group_name(self.property_id, self.user.id)

        if not self.user.is_authenticated:
            await self.close(code=4401)
            return

        can_join = await self._can_join_conversation()
        if not can_join:
            await self.close(code=4403)
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self.send_json({"type": "connection", "status": "connected"})

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        if content.get("type") != "message":
            return

        body = str(content.get("body", "")).strip()
        if not body:
            await self.send_json({"type": "error", "error": "Message is required."})
            return

        try:
            message = await self._create_message(body)
        except PermissionDenied as exc:
            await self.send_json({"type": "error", "error": str(exc)})
            return

        await self.channel_layer.group_send(
            self._group_name(self.property_id, message["sender"]["id"]),
            {
                "type": "chat.message",
                "message": message,
            },
        )
        if message.get("receiver"):
            await self.channel_layer.group_send(
                self._group_name(self.property_id, message["receiver"]["id"]),
                {
                    "type": "chat.message",
                    "message": message,
                },
            )

    async def chat_message(self, event):
        message = dict(event["message"])
        message["isMine"] = message.get("sender", {}).get("id") == self.user.id
        await self.send_json({"type": "message", "message": message})

    @database_sync_to_async
    def _can_join_conversation(self):
        try:
            property_obj = Property.objects.select_related("owner").get(pk=self.property_id)
        except ObjectDoesNotExist:
            return False
        return True

    @database_sync_to_async
    def _create_message(self, body):
        property_obj = Property.objects.select_related("owner").get(pk=self.property_id)
        conversation_messages = property_obj.messages.select_related("sender", "receiver", "replied_by").order_by("timestamp")

        receiver = _conversation_receiver(self.user, property_obj, conversation_messages)
        if not receiver:
            raise PermissionDenied("There is no customer conversation to reply to yet.")

        message = Message.objects.create(
            property=property_obj,
            sender=self.user,
            receiver=receiver,
            message=body,
        )
        message = Message.objects.select_related("sender", "receiver", "replied_by").get(pk=message.pk)
        return _serialize_message(message, self.user)

    @staticmethod
    def _group_name(property_id, user_id):
        return f"property_{property_id}_user_{user_id}_messages"
