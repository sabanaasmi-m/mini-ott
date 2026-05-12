from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    SubscriptionPlanViewSet,
    CreateOrderView,
    VerifyPaymentView,
    MySubscriptionView,
    SubscriberListView,
    GrantSubscriptionView,
)

router = DefaultRouter()
router.register('subscriptions/plans', SubscriptionPlanViewSet, basename='subscription-plan')

urlpatterns = router.urls + [
    path('subscriptions/create-order/',    CreateOrderView.as_view()),
    path('subscriptions/verify-payment/',  VerifyPaymentView.as_view()),
    path('subscriptions/my-subscription/', MySubscriptionView.as_view()),
    path('subscriptions/subscribers/',     SubscriberListView.as_view()),
    path('subscriptions/grant/',           GrantSubscriptionView.as_view()),
]