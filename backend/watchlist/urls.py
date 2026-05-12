from rest_framework.routers import DefaultRouter
from .views import WatchlistViewSet, WatchHistoryViewSet

router = DefaultRouter()
router.register('watchlist', WatchlistViewSet, basename='watchlist')
router.register('watch-history', WatchHistoryViewSet, basename='watch-history')

urlpatterns = router.urls
