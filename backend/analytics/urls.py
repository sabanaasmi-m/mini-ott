from django.urls import path
from .views import DashboardStatsView, FilmApprovalView, UserStatsView

urlpatterns = [
    path('analytics/dashboard/', DashboardStatsView.as_view()),
    path('analytics/user-stats/', UserStatsView.as_view()),
    path('shortfilms/<int:film_id>/approval/', FilmApprovalView.as_view()),
]
