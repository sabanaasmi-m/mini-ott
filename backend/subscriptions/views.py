import razorpay
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum, Count
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, AllowAny, IsAuthenticated
from rest_framework import status

from .models import SubscriptionPlan, UserSubscription
from .serializers import SubscriptionPlanSerializer, UserSubscriptionSerializer


def _razorpay_client():
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


# ── Plan CRUD ────────────────────────────────────────────────────────────────

class SubscriptionPlanViewSet(ModelViewSet):
    serializer_class = SubscriptionPlanSerializer

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return SubscriptionPlan.objects.all().order_by('price')
        return SubscriptionPlan.objects.filter(is_active=True).order_by('price')

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUser()]


# ── Razorpay — Create Order ──────────────────────────────────────────────────

class CreateOrderView(APIView):
    """Step 1: Create a Razorpay order for a chosen plan."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        plan_id = request.data.get('plan_id')
        if not plan_id:
            return Response({'error': 'plan_id is required'}, status=400)

        try:
            plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            return Response({'error': 'Plan not found'}, status=404)

        if float(plan.price) == 0:
            return Response({'error': 'This plan is free — no payment needed'}, status=400)

        amount_paise = int(float(plan.price) * 100)  # Razorpay needs paise

        try:
            client = _razorpay_client()
            order = client.order.create({
                'amount': amount_paise,
                'currency': 'INR',
                'payment_capture': 1,
                'notes': {
                    'plan_id':   str(plan.id),
                    'user_id':   str(request.user.id),
                    'plan_name': plan.name,
                },
            })
            return Response({
                'order_id':  order['id'],
                'amount':    amount_paise,
                'currency':  'INR',
                'plan_name': plan.name,
                'plan_id':   plan.id,
                'key':       settings.RAZORPAY_KEY_ID,
            })
        except Exception as e:
            return Response({'error': f'Razorpay error: {str(e)}'}, status=500)


# ── Razorpay — Verify & Activate ────────────────────────────────────────────

class VerifyPaymentView(APIView):
    """Step 2: Verify Razorpay signature and activate subscription."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        payment_id = request.data.get('razorpay_payment_id')
        order_id   = request.data.get('razorpay_order_id')
        signature  = request.data.get('razorpay_signature')
        plan_id    = request.data.get('plan_id')

        if not all([payment_id, order_id, signature, plan_id]):
            return Response({'error': 'Missing required payment fields'}, status=400)

        # Verify HMAC-SHA256 signature
        try:
            client = _razorpay_client()
            client.utility.verify_payment_signature({
                'razorpay_payment_id': payment_id,
                'razorpay_order_id':   order_id,
                'razorpay_signature':  signature,
            })
        except razorpay.errors.SignatureVerificationError:
            return Response({'error': 'Payment signature verification failed'}, status=400)
        except Exception as e:
            return Response({'error': f'Verification error: {str(e)}'}, status=400)

        try:
            plan = SubscriptionPlan.objects.get(id=plan_id)
        except SubscriptionPlan.DoesNotExist:
            return Response({'error': 'Plan not found'}, status=404)

        # Create or renew subscription
        start = timezone.now()
        end   = start + timedelta(days=plan.duration_days)

        sub, created = UserSubscription.objects.update_or_create(
            user=request.user,
            defaults={
                'plan':                 plan,
                'start_date':           start,
                'end_date':             end,
                'is_active':            True,
                'razorpay_payment_id':  payment_id,
                'razorpay_order_id':    order_id,
                'razorpay_signature':   signature,
            },
        )

        return Response({
            'message':    'Subscription activated successfully!',
            'plan':       plan.name,
            'valid_till': end.strftime('%Y-%m-%d'),
            'days':       plan.duration_days,
        })


# ── My Subscription ──────────────────────────────────────────────────────────

class MySubscriptionView(APIView):
    """Current user's subscription status."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            sub = UserSubscription.objects.get(user=request.user)
            serializer = UserSubscriptionSerializer(sub)
            return Response(serializer.data)
        except UserSubscription.DoesNotExist:
            return Response({'subscribed': False})


# ── Admin: Subscriber List + Revenue ────────────────────────────────────────

class SubscriberListView(APIView):
    """Admin: all subscribers with revenue analytics."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        all_subs  = UserSubscription.objects.select_related('user', 'plan').all()
        active    = [s for s in all_subs if s.is_valid()]
        expired   = [s for s in all_subs if not s.is_valid()]

        total_revenue = sum(float(s.plan.price) for s in all_subs if s.plan and s.razorpay_payment_id)
        active_revenue = sum(float(s.plan.price) for s in active if s.plan and s.razorpay_payment_id)

        # Revenue by plan
        plan_revenue = {}
        for s in all_subs:
            if s.plan and s.razorpay_payment_id:
                name = s.plan.name
                plan_revenue[name] = plan_revenue.get(name, 0) + float(s.plan.price)

        subscribers = []
        for sub in all_subs:
            subscribers.append({
                'id':            sub.id,
                'username':      sub.user.username,
                'email':         sub.user.email,
                'plan':          sub.plan.name if sub.plan else '—',
                'plan_price':    float(sub.plan.price) if sub.plan else 0,
                'start_date':    sub.start_date,
                'end_date':      sub.end_date,
                'is_valid':      sub.is_valid(),
                'days_remaining': sub.days_remaining(),
                'payment_id':    sub.razorpay_payment_id or '—',
            })

        return Response({
            'subscribers':     subscribers,
            'total_count':     len(all_subs),
            'active_count':    len(active),
            'expired_count':   len(expired),
            'total_revenue':   total_revenue,
            'active_revenue':  active_revenue,
            'revenue_by_plan': [{'plan': k, 'revenue': v} for k, v in plan_revenue.items()],
        })


# ── Admin: Manual Subscription Grant ────────────────────────────────────────

class GrantSubscriptionView(APIView):
    """Admin: manually grant subscription to a user (without payment)."""
    permission_classes = [IsAdminUser]

    def post(self, request):
        from django.contrib.auth.models import User as DjangoUser
        user_id = request.data.get('user_id')
        plan_id = request.data.get('plan_id')

        try:
            user = DjangoUser.objects.get(id=user_id)
            plan = SubscriptionPlan.objects.get(id=plan_id)
        except Exception:
            return Response({'error': 'User or Plan not found'}, status=404)

        start = timezone.now()
        end   = start + timedelta(days=plan.duration_days)

        UserSubscription.objects.update_or_create(
            user=user,
            defaults={'plan': plan, 'start_date': start, 'end_date': end, 'is_active': True},
        )
        return Response({'message': f'Subscription granted to {user.username}'})