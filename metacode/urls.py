from django.contrib import admin
from django.urls import path
from .views import HomeView, LoginView, RegisterView, LogoutView, AuthCheck

urlpatterns = [
    path("admin/", admin.site.urls),
    path("accounts/login/", LoginView.as_view(), name="login"),
    path("accounts/register/", RegisterView.as_view(), name="register"),
    path("accounts/logout/", LogoutView.as_view(), name="logout"),
    path("auth/", AuthCheck.as_view(), name="authcheck"),
    path("", HomeView.as_view(), name="home"),
]
