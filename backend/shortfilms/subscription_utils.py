from subscriptions.models import UserSubscription
from django.utils import timezone

def user_has_active_subscription(user):
    try:
        subscription = UserSubscription.objects.get(user=user, is_active=True)
        return subscription.end_date >= timezone.now()
    except UserSubscription.DoesNotExist:
        return False
