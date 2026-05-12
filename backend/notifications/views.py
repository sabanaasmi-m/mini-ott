from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.viewsets import ModelViewSet
from django.db.models import Q
from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(ModelViewSet):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Notification.objects.all()
        return Notification.objects.filter(
            Q(user=user) | Q(is_global=True)
        )

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'partial_update', 'update']:
            return [IsAuthenticated()]
        return [IsAdminUser()]

    def perform_update(self, serializer):
        serializer.save()


class MarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        Notification.objects.filter(is_global=True, is_read=False).update(is_read=True)
        return Response({'message': 'All notifications marked as read'})