from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from .models import Comment, CommentLike
from .serializers import CommentSerializer


class CommentViewSet(ModelViewSet):
    serializer_class = CommentSerializer

    def get_permissions(self):
        # Reading comments is public (OTT film detail page shows reviews)
        if self.action in ['list', 'retrieve']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        # Public: only approved comments
        queryset = Comment.objects.filter(is_approved=True)
        film_id = self.request.query_params.get('film')
        if film_id:
            queryset = queryset.filter(film_id=film_id)

        # Admins/staff also see unapproved
        user = self.request.user
        if user.is_authenticated and user.is_staff:
            queryset = Comment.objects.all()
            if film_id:
                queryset = queryset.filter(film_id=film_id)

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        comment = self.get_object()
        like, created = CommentLike.objects.get_or_create(
            comment=comment, user=request.user
        )
        if not created:
            like.delete()
            return Response({'liked': False, 'likes_count': comment.likes.count()})
        return Response({'liked': True, 'likes_count': comment.likes.count()})

    @action(detail=True, methods=['post', 'patch'])
    def approve(self, request, pk=None):
        """Admin: toggle comment approval."""
        if not request.user.is_staff:
            return Response({'error': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)
        comment = self.get_object()
        comment.is_approved = not comment.is_approved
        comment.save()
        return Response({'is_approved': comment.is_approved})