from rest_framework.routers import DefaultRouter
from .views import ShortFilmViewSet

router = DefaultRouter()
router.register('shortfilms', ShortFilmViewSet)

urlpatterns = router.urls
