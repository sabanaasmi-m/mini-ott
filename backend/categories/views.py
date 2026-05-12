from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from .models import Category
from .serializers import CategorySerializer


class CategoryViewSet(ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        # Anyone can browse categories (needed by OTT site)
        if self.action in ['list', 'retrieve']:
            permission_classes = [AllowAny]
        else:
            # Only admins can create / update / delete categories
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]