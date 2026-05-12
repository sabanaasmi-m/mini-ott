from rest_framework import serializers
from .models import Watchlist, WatchHistory
from shortfilms.serializers import ShortFilmSerializer


class WatchlistSerializer(serializers.ModelSerializer):
    film_detail = ShortFilmSerializer(source='film', read_only=True)

    class Meta:
        model = Watchlist
        fields = ['id', 'film', 'film_detail', 'added_at']
        read_only_fields = ['user']


class WatchHistorySerializer(serializers.ModelSerializer):
    film_detail = ShortFilmSerializer(source='film', read_only=True)

    class Meta:
        model = WatchHistory
        fields = ['id', 'film', 'film_detail', 'watched_at', 'watch_duration', 'completed']
        read_only_fields = ['user']