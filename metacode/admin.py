from django.contrib import admin
from .models import Profile, ChatSession, Chat

class ProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "theme", "chat_model", "created_at", "updated_at"]

class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ["session_id", "user", "caption", "created_at", "updated_at"]

class ChatAdmin(admin.ModelAdmin):
    list_display = ["session", "role", "content", "disliked", "image", "created_at", "updated_at"]


admin.site.register(Profile, ProfileAdmin)
admin.site.register(ChatSession, ChatSessionAdmin)
admin.site.register(Chat, ChatAdmin)