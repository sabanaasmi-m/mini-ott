from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import NotificationViewSet, MarkAllReadView

router = DefaultRouter()
router.register('notifications', NotificationViewSet, basename='notification')

urlpatterns = router.urls + [
    path('notifications/mark-all-read/', MarkAllReadView.as_view()),
]