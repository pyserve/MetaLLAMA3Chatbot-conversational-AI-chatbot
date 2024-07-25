import json
from django.views import View
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.contrib.auth import authenticate, login, logout
from .serializers import UserSerializer
from huggingface_hub import InferenceClient
from .settings import HUGGINGFACE_TOKEN
import requests

model_name = "meta-llama/Meta-Llama-3-8B-Instruct"
image_model_name = "Salesforce/blip-image-captioning-base"
client = InferenceClient(model=model_name, token=HUGGINGFACE_TOKEN)
image_client = InferenceClient(model=image_model_name, token=HUGGINGFACE_TOKEN)

@method_decorator(csrf_exempt, name='dispatch')
class ChatView(View):
    def get(self, request):
        return JsonResponse({'message': 'Protected resource accessed'}, status=200)
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            messages = data.get('messages', '')
            reply = ''
            for message in client.chat_completion(
                    messages=messages,
                    max_tokens=1024,
                    stream=True,
                ):
                reply += message.choices[0].delta.content + ""
            return JsonResponse({"role": "assistant", "content": reply})
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

@method_decorator(csrf_exempt, name='dispatch')
class AudioView(View):
    def post(self, request):
        print(request.FILES)
        return JsonResponse({"error": "Audio processing went wrong!"}, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class ImageView(View):
    def post(self, request):
        image = request.FILES.get("image", None)
        if image is not None:
            return JsonResponse({"status": image}, status=200)
        return JsonResponse({"error": "Image processing went wrong!"}, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class LoginView(View):
    def post(self, request):
        if request.user.is_authenticated:
            return JsonResponse({"message": "User already logged in.", "user": UserSerializer(request.user)}, status=403)
        data = json.loads(request.body)['data']
        username = data["username"]
        password = data["password"]
        user = authenticate(username=username, password=password)
        if user is not None:
            login(request, user)
            return JsonResponse({"message": "Successfully logged in.", "user": UserSerializer(user)}, status=200)
        return JsonResponse({"message": "User doesn't exist. Recheck credentials!"}, status=404)

@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(View):
    def post(self, request):
        data = json.loads(request.body)['data']
        email = data["email"]
        password = data["password"]
        full_name = data["fullName"]
        dob = data["dob"]

        if User.objects.filter(username=email).exists():
            return JsonResponse({"message": "User already exists"}, status=400)
        
        user = User.objects.create(
            username=email,email=email,
            password=make_password(password),
            first_name=full_name,last_name=dob,
            is_staff=True
        )

        return JsonResponse({"message": "User created successfully", "user": UserSerializer(user)}, status=200)

@method_decorator(csrf_exempt, name='dispatch')
class LogoutView(View):
    def post(self, request):
        data = json.loads(request.body)['data']
        return JsonResponse({"status": 200})
    
class AuthCheck(View):
    def get(self, request):
        if request.user.is_authenticated:
            return JsonResponse({"message": "User is logged in.", "user": UserSerializer(request.user)}, status=200)
        return JsonResponse({"message": "User is not logged in.", "user": None}, status=401)
