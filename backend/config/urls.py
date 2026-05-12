from django.contrib import admin
from django.urls import path, include
# BUG FIX 2: Use custom token view that blocks inactive users
from users.token_views import ActiveUserTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    # BUG FIX 2: replaced TokenObtainPairView with ActiveUserTokenObtainPairView
    path('api/auth/login/', ActiveUserTokenObtainPairView.as_view()),
    path('api/auth/refresh/', TokenRefreshView.as_view()),
    path('api/', include('categories.urls')),
    path('api/', include('users.urls')),
    path('api/', include('subscriptions.urls')),
    path('api/', include('shortfilms.urls')),
    path('api/', include('comments.urls')),
    path('api/', include('watchlist.urls')),
    path('api/', include('analytics.urls')),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)