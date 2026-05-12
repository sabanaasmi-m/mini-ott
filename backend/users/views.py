from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAdminUser, AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.models import User
from .serializers import UserSerializer
from rest_framework import status


class UserViewSet(ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]


class RegisterView(APIView):
    """Public registration — creates VIEWER accounts by default.
    Pass role=CREATOR in request body to register as a creator.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data.copy()

        # BUG FIX 4: Allow creators to self-register
        # Accept role=CREATOR, but never allow ADMIN self-registration
        requested_role = str(data.get('role', 'VIEWER')).upper()
        if requested_role == 'ADMIN':
            requested_role = 'VIEWER'  # Block self-promotion to admin
        data['role'] = requested_role
        data['is_active'] = True

        serializer = UserSerializer(data=data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': requested_role,
            }, status=201)
        return Response(serializer.errors, status=400)


class ProfileView(APIView):
    """Get / update logged-in user's profile."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # BUG FIX 2: Check is_active on every profile fetch
        if not user.is_active:
            return Response(
                {'detail': 'Your account has been deactivated. Please contact support.'},
                status=403
            )

        profile = getattr(user, 'userprofile', None)

        # Subscription info
        is_subscribed = False
        plan_name = None
        days_remaining = None
        try:
            from subscriptions.models import UserSubscription
            from django.utils import timezone
            sub = UserSubscription.objects.get(user=user, is_active=True)
            if sub.end_date >= timezone.now():
                is_subscribed = True
                plan_name = sub.plan.name if sub.plan else None
                diff = sub.end_date - timezone.now()
                days_remaining = max(0, diff.days)
        except Exception:
            pass

        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': profile.role if profile else 'VIEWER',
            'date_joined': user.date_joined,
            'is_subscribed': is_subscribed,
            'plan_name': plan_name,
            'days_remaining': days_remaining,
        })

    def patch(self, request):
        user = request.user
        data = request.data

        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'email' in data:
            user.email = data['email']
        user.save()

        profile = getattr(user, 'userprofile', None)
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': profile.role if profile else 'VIEWER',
        })


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        current_password = (
            request.data.get('current_password') or
            request.data.get('old_password')
        )
        new_password = request.data.get('new_password')

        if not current_password or not new_password:
            return Response(
                {'detail': 'Both current password and new password are required.'},
                status=400
            )

        if not user.check_password(current_password):
            return Response(
                {'detail': 'Current password is incorrect.'},
                status=400
            )

        if len(new_password) < 6:
            return Response(
                {'detail': 'Password must be at least 6 characters.'},
                status=400
            )

        user.set_password(new_password)
        user.save()
        return Response({'detail': 'Password changed successfully.'})