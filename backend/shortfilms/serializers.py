from rest_framework import serializers
from .models import ShortFilm
from categories.models import Category


class ShortCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'image']


class ShortFilmSerializer(serializers.ModelSerializer):
    category_detail = ShortCategorySerializer(source='category', read_only=True)
    uploader_name = serializers.CharField(source='uploaded_by.username', read_only=True)
    average_rating = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()

    class Meta:
        model = ShortFilm
        fields = '__all__'
        read_only_fields = ['uploaded_by', 'views']

    def get_average_rating(self, obj):
        try:
            from comments.models import Comment
            comments = Comment.objects.filter(film=obj, rating__isnull=False)
            if comments.exists():
                total = sum(c.rating for c in comments)
                return round(total / comments.count(), 1)
        except Exception:
            pass
        return None

    def get_comments_count(self, obj):
        try:
            from comments.models import Comment
            return Comment.objects.filter(film=obj, is_approved=True).count()
        except Exception:
            return 0
