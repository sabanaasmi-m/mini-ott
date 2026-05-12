from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import ChangePasswordView, UserViewSet, RegisterView, ProfileView

router = DefaultRouter()
router.register('users', UserViewSet)

urlpatterns = router.urls + [
    path('auth/register/', RegisterView.as_view()),
    path('auth/profile/', ProfileView.as_view()),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change-password'),
]