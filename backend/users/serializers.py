from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile

class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(write_only=True)
    is_active = serializers.BooleanField(write_only=True)
    role_display = serializers.CharField(source='userprofile.role', read_only=True)
    active = serializers.BooleanField(source='userprofile.is_active', read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'password',
            'role',
            'is_active',
            'role_display',
            'active'
        ]
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        role = validated_data.pop('role')
        is_active = validated_data.pop('is_active')

        user = User.objects.create_user(**validated_data)
        user.userprofile.role = role
        user.userprofile.is_active = is_active
        user.userprofile.save()
        return user

    def update(self, instance, validated_data):
        role = validated_data.pop('role', None)
        is_active = validated_data.pop('is_active', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if role:
            instance.userprofile.role = role
        if is_active is not None:
            instance.userprofile.is_active = is_active

        instance.userprofile.save()
        return instance
