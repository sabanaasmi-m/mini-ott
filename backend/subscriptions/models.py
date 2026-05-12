from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User


class SubscriptionPlan(models.Model):
    PLAN_TYPE_CHOICES = (
        ('FREE',    'Free'),
        ('MONTHLY', 'Monthly'),
        ('YEARLY',  'Yearly'),
        ('CUSTOM',  'Custom'),
    )

    name            = models.CharField(max_length=100)
    plan_type       = models.CharField(max_length=20, choices=PLAN_TYPE_CHOICES)
    price           = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    duration_days   = models.IntegerField(help_text='Validity in days')
    description     = models.TextField(blank=True)
    is_active       = models.BooleanField(default=True)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['price']

    def __str__(self):
        return f'{self.name} (₹{self.price}/{self.duration_days}d)'


class UserSubscription(models.Model):
    user                  = models.OneToOneField(User, on_delete=models.CASCADE)
    plan                  = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True)
    start_date            = models.DateTimeField(default=timezone.now)
    end_date              = models.DateTimeField()
    is_active             = models.BooleanField(default=True)
    # Razorpay payment tracking
    razorpay_payment_id   = models.CharField(max_length=100, blank=True)
    razorpay_order_id     = models.CharField(max_length=100, blank=True)
    razorpay_signature    = models.CharField(max_length=200, blank=True)
    created_at            = models.DateTimeField(auto_now_add=True)
    updated_at            = models.DateTimeField(auto_now=True)

    def is_valid(self):
        return self.is_active and self.end_date >= timezone.now()

    def days_remaining(self):
        if not self.is_valid():
            return 0
        return (self.end_date - timezone.now()).days

    def __str__(self):
        return f'{self.user.username} — {self.plan.name if self.plan else "No Plan"}'