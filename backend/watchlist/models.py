from django.db import models
from django.contrib.auth.models import User
from shortfilms.models import ShortFilm


class Watchlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='watchlist')
    film = models.ForeignKey(ShortFilm, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'film']
        ordering = ['-added_at']

    def __str__(self):
        return f"{self.user.username} - {self.film.title}"


class WatchHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='watch_history')
    film = models.ForeignKey(ShortFilm, on_delete=models.CASCADE)
    watched_at = models.DateTimeField(auto_now=True)
    watch_duration = models.IntegerField(default=0, help_text="Seconds watched")
    completed = models.BooleanField(default=False)

    class Meta:
        unique_together = ['user', 'film']
        ordering = ['-watched_at']

    def __str__(self):
        return f"{self.user.username} watched {self.film.title}"
