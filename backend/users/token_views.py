"""
Custom JWT login view that checks user is_active status.
Place this in users/views.py or a new file users/token_views.py
and update config/urls.py to use it instead of TokenObtainPairView.
"""

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers


class ActiveUserTokenSerializer(TokenObtainPairSerializer):
    """BUG FIX 2: Block inactive users from logging in."""

    def validate(self, attrs):
        data = super().validate(attrs)

        # Check if the user account is active
        user = self.user
        if not user.is_active:
            raise serializers.ValidationError(
                {'detail': 'Your account has been deactivated. Please contact support.'}
            )

        return data


class ActiveUserTokenObtainPairView(TokenObtainPairView):
    serializer_class = ActiveUserTokenSerializer