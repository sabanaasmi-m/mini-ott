from django.db import models

# Create your models here.
from categories.models import Category
from django.contrib.auth.models import User

class ShortFilm(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )

    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)

    video_url = models.TextField(help_text="Supabase storage video URL")
    thumbnail_url = models.TextField(blank=True, null=True)

    duration_minutes = models.IntegerField()
    language = models.CharField(max_length=50)
    is_premium = models.BooleanField(default=False)

    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default='PENDING'
    )

    views = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
