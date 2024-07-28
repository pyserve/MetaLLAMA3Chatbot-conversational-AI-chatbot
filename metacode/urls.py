from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from .views import ChatView, AudioView, ImageView, LoginView, RegisterView
from .views import LogoutView, AuthCheck, CSRFView, ChatHistory

urlpatterns = static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) + [
    path("admin/", admin.site.urls),
    path("csrf/", CSRFView.as_view(), name="csrf"),
    path("accounts/login/", LoginView.as_view(), name="login"),
    path("accounts/register/", RegisterView.as_view(), name="register"),
    path("accounts/logout/", LogoutView.as_view(), name="logout"),
    path("auth/", AuthCheck.as_view(), name="authcheck"),
    path("audio/", AudioView.as_view(), name="audio"),
    path("image/", ImageView.as_view(), name="image"),
    path("sessions/<int:uid>", ChatHistory.as_view(), name="get_sessions"),
    path("chats/<str:sessionId>", ChatView.as_view(), name="get_chats"),
    path("", ChatView.as_view(), name="chat"),
]
