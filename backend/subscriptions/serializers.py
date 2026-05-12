from rest_framework import serializers
from .models import SubscriptionPlan, UserSubscription


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'


class UserSubscriptionSerializer(serializers.ModelSerializer):
    plan_name  = serializers.CharField(source='plan.name',          read_only=True)
    plan_price = serializers.DecimalField(source='plan.price',      max_digits=8, decimal_places=2, read_only=True)
    username   = serializers.CharField(source='user.username',      read_only=True)
    email      = serializers.CharField(source='user.email',         read_only=True)
    is_valid   = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()

    class Meta:
        model  = UserSubscription
        fields = [
            'id', 'username', 'email', 'plan', 'plan_name', 'plan_price',
            'start_date', 'end_date', 'is_active', 'is_valid', 'days_remaining',
            'razorpay_payment_id', 'razorpay_order_id', 'created_at',
        ]
        read_only_fields = ['user', 'razorpay_payment_id', 'razorpay_order_id']

    def get_is_valid(self, obj):
        return obj.is_valid()

    def get_days_remaining(self, obj):
        return obj.days_remaining()