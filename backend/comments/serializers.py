from rest_framework import serializers
from .models import Comment, CommentLike


class CommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    likes_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'film', 'user', 'username', 'text', 'rating',
                  'is_approved', 'created_at', 'updated_at', 'likes_count', 'is_liked']
        read_only_fields = ['user', 'is_approved']

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False