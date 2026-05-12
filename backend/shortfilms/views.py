from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ShortFilm
from .serializers import ShortFilmSerializer
from .permissions import IsAdmin, IsAdminOrCreator
from .subscription_utils import user_has_active_subscription


class ShortFilmViewSet(ModelViewSet):
    queryset = ShortFilm.objects.all()
    serializer_class = ShortFilmSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            # OTT site + anyone can browse approved films
            permission_classes = [AllowAny]
        elif self.action == 'create':
            # Only admins/creators can upload
            permission_classes = [IsAdminOrCreator]
        elif self.action in ['update', 'partial_update', 'destroy']:
            # Only admins can edit/delete
            permission_classes = [IsAdmin]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user

        # --- Anonymous user ---
        if not user.is_authenticated:
            queryset = ShortFilm.objects.filter(status='APPROVED')
            return self._apply_filters(queryset)

        # --- Logged-in user ---
        try:
            role = user.userprofile.role
        except Exception:
            role = 'VIEWER'

        if role == 'ADMIN':
            # Admin sees all films (any status)
            queryset = ShortFilm.objects.all()
        elif role == 'CREATOR':
            # Creator sees own films (any status) + all approved films
            queryset = ShortFilm.objects.filter(status='APPROVED') | \
                       ShortFilm.objects.filter(uploaded_by=user)
        else:
            # Viewer: all approved films (premium gate is enforced in the Player)
            queryset = ShortFilm.objects.filter(status='APPROVED')

        return self._apply_filters(queryset)

    def _apply_filters(self, queryset):
        """Apply query-param filters shared across all user types."""
        params = self.request.query_params

        status = params.get('status')
        if status:
            queryset = queryset.filter(status=status)

        category = params.get('category')
        if category:
            queryset = queryset.filter(category_id=category)

        language = params.get('language')
        if language:
            queryset = queryset.filter(language=language)

        is_premium = params.get('is_premium')
        if is_premium is not None:
            queryset = queryset.filter(is_premium=is_premium.lower() == 'true')

        search = params.get('search')
        if search:
            queryset = queryset.filter(title__icontains=search) | \
                       queryset.filter(language__icontains=search)

        uploaded_by = params.get('uploaded_by')
        if uploaded_by:
            queryset = queryset.filter(uploaded_by_id=uploaded_by)

        ordering = params.get('ordering', '-created_at')
        allowed_orderings = [
            'title', '-title', 'views', '-views',
            'created_at', '-created_at', 'duration_minutes', '-duration_minutes',
        ]
        if ordering in allowed_orderings:
            queryset = queryset.order_by(ordering)

        return queryset.distinct()

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

    @action(detail=True, methods=['post'])
    def view(self, request, pk=None):
        """Increment view count — called by the Player page."""
        try:
            film = self.get_object()
            film.views += 1
            film.save(update_fields=['views'])
            return Response({'views': film.views})
        except Exception:
            return Response({'views': 0})