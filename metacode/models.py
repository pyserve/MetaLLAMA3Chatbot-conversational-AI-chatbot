from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="user_profile")
    themes = [("DARK", "dark"), ("LIGHT", "light")]
    theme = models.CharField(max_length=25, choices=themes, default="LIGHT")
    chat_models = [("LLAMA3", "llama3")]
    chat_model = models.CharField(max_length=25, choices=chat_models, default="LLAMA3")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.user.username}\'s profile"

class ChatSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="users")
    session_id = models.CharField(max_length=255, unique=True)
    caption = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.session_id}"

class Chat(models.Model):
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name="session")
    role_options = [("USER", "user"), ("ASSISTANT", "assistant"), ("SYSTEM", "system")]
    role = models.CharField(max_length=25, choices=role_options)
    content = models.TextField()
    disliked = models.BooleanField(default=False)
    image = models.ImageField(upload_to="chats/images", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.session.session_id}"