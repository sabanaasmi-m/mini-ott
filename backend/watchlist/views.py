from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Watchlist, WatchHistory
from .serializers import WatchlistSerializer, WatchHistorySerializer
from shortfilms.models import ShortFilm


class WatchlistViewSet(ModelViewSet):
    serializer_class = WatchlistSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete']

    def get_queryset(self):
        return Watchlist.objects.filter(user=self.request.user).select_related('film')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def toggle(self, request):
        film_id = request.data.get('film_id')
        try:
            film = ShortFilm.objects.get(id=film_id)
        except ShortFilm.DoesNotExist:
            return Response({'error': 'Film not found'}, status=status.HTTP_404_NOT_FOUND)

        item, created = Watchlist.objects.get_or_create(user=request.user, film=film)
        if not created:
            item.delete()
            return Response({'in_watchlist': False})
        return Response({'in_watchlist': True})

    @action(detail=False, methods=['get'])
    def check(self, request):
        film_id = request.query_params.get('film_id')
        in_watchlist = Watchlist.objects.filter(user=request.user, film_id=film_id).exists()
        return Response({'in_watchlist': in_watchlist})


class WatchHistoryViewSet(ModelViewSet):
    serializer_class = WatchHistorySerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'put', 'patch']

    def get_queryset(self):
        return WatchHistory.objects.filter(user=self.request.user).select_related('film')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def record(self, request):
        """Record or update watch progress"""
        film_id = request.data.get('film_id')
        watch_duration = request.data.get('watch_duration', 0)
        completed = request.data.get('completed', False)

        try:
            film = ShortFilm.objects.get(id=film_id)
        except ShortFilm.DoesNotExist:
            return Response({'error': 'Film not found'}, status=status.HTTP_404_NOT_FOUND)

        history, created = WatchHistory.objects.update_or_create(
            user=request.user,
            film=film,
            defaults={'watch_duration': watch_duration, 'completed': completed}
        )

        # Increment film views on first watch
        if created:
            film.views += 1
            film.save(update_fields=['views'])

        return Response(WatchHistorySerializer(history).data)
