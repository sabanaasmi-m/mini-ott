# ─────────────────────────────────────────────────────────────────────────────
# backend/notifications/models.py
# ─────────────────────────────────────────────────────────────────────────────
from django.db import models
from django.contrib.auth.models import User


class Notification(models.Model):
    TYPE_CHOICES = [
        ('INFO',    'Info'),
        ('SUCCESS', 'Success'),
        ('WARNING', 'Warning'),
        ('PROMO',   'Promotion'),
    ]

    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    title       = models.CharField(max_length=200)
    message     = models.TextField()
    notif_type  = models.CharField(max_length=20, choices=TYPE_CHOICES, default='INFO')
    is_read     = models.BooleanField(default=False)
    is_global   = models.BooleanField(default=False, help_text='If True, shown to ALL users')
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.notif_type}] {self.title}'


# ─────────────────────────────────────────────────────────────────────────────
# backend/notifications/serializers.py
# ─────────────────────────────────────────────────────────────────────────────
# from rest_framework import serializers
# from .models import Notification
#
# class NotificationSerializer(serializers.ModelSerializer):
#     class Meta:
#         model  = Notification
#         fields = '__all__'


# ─────────────────────────────────────────────────────────────────────────────
# backend/notifications/views.py
# ─────────────────────────────────────────────────────────────────────────────
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework.permissions import IsAuthenticated, IsAdminUser
# from rest_framework.viewsets import ModelViewSet
# from .models import Notification
# from .serializers import NotificationSerializer
#
# class NotificationViewSet(ModelViewSet):
#     serializer_class = NotificationSerializer
#
#     def get_queryset(self):
#         user = self.request.user
#         if user.is_staff:
#             return Notification.objects.all()
#         return Notification.objects.filter(
#             models.Q(user=user) | models.Q(is_global=True)
#         )
#
#     def get_permissions(self):
#         if self.action in ['list', 'retrieve']:
#             return [IsAuthenticated()]
#         return [IsAdminUser()]
#
#     def perform_update(self, serializer):
#         # Allow users to mark their own notifications as read
#         serializer.save()
#
# class MarkAllReadView(APIView):
#     permission_classes = [IsAuthenticated]
#     def post(self, request):
#         Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
#         Notification.objects.filter(is_global=True, is_read=False).update(is_read=True)
#         return Response({'message': 'All notifications marked as read'})