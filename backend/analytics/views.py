from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import timedelta
from shortfilms.models import ShortFilm
from categories.models import Category

try:
    from comments.models import Comment
    COMMENTS_ENABLED = True
except ImportError:
    COMMENTS_ENABLED = False

try:
    from watchlist.models import WatchHistory
    WATCHLIST_ENABLED = True
except ImportError:
    WATCHLIST_ENABLED = False


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        now = timezone.now()
        last_month = now - timedelta(days=30)
        last_week = now - timedelta(days=7)

        total_films = ShortFilm.objects.count()
        total_users = User.objects.count()
        total_views = ShortFilm.objects.aggregate(total=Sum('views'))['total'] or 0
        pending_films = ShortFilm.objects.filter(status='PENDING').count()
        approved_films = ShortFilm.objects.filter(status='APPROVED').count()
        total_categories = Category.objects.count()

        new_users_this_month = User.objects.filter(date_joined__gte=last_month).count()
        new_films_this_week = ShortFilm.objects.filter(created_at__gte=last_week).count()

        # Top films by views
        top_films = ShortFilm.objects.filter(status='APPROVED').order_by('-views')[:5].values(
            'id', 'title', 'views', 'thumbnail_url'
        )

        # Films by category
        films_by_category = Category.objects.annotate(
            film_count=Count('shortfilm')
        ).values('name', 'film_count').order_by('-film_count')

        # Recent films
        recent_films = ShortFilm.objects.select_related('category', 'uploaded_by').order_by('-created_at')[:10].values(
            'id', 'title', 'status', 'views', 'created_at',
            'thumbnail_url', 'duration_minutes', 'category__name'
        )

        return Response({
            'total_films': total_films,
            'total_users': total_users,
            'total_views': total_views,
            'pending_films': pending_films,
            'approved_films': approved_films,
            'total_categories': total_categories,
            'new_users_this_month': new_users_this_month,
            'new_films_this_week': new_films_this_week,
            'top_films': list(top_films),
            'films_by_category': list(films_by_category),
            'recent_films': list(recent_films),
        })


class FilmApprovalView(APIView):
    """Admin: approve or reject a film"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, film_id):
        if not request.user.is_staff:
            return Response({'error': 'Admin only'}, status=403)
        
        action = request.data.get('action')  # 'approve' or 'reject'
        try:
            film = ShortFilm.objects.get(id=film_id)
        except ShortFilm.DoesNotExist:
            return Response({'error': 'Film not found'}, status=404)

        if action == 'approve':
            film.status = 'APPROVED'
        elif action == 'reject':
            film.status = 'REJECTED'
        else:
            return Response({'error': 'Invalid action'}, status=400)

        film.save()
        return Response({'status': film.status, 'film_id': film.id})


class UserStatsView(APIView):
    """Get stats for a specific user (for profile page)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        films_uploaded = ShortFilm.objects.filter(uploaded_by=user).count()
        
        stats = {
            'films_uploaded': films_uploaded,
        }

        if WATCHLIST_ENABLED:
            stats['watchlist_count'] = user.watchlist.count()
            stats['watched_count'] = user.watch_history.filter(completed=True).count()

        if COMMENTS_ENABLED:
            stats['comments_count'] = Comment.objects.filter(user=user).count()

        return Response(stats)
