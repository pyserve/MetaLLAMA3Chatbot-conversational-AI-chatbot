from django.views import View
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.contrib.auth import authenticate, login, logout
from .serializers import UserSerializer, ChatSerializer, ChatSessionSerializer
from huggingface_hub import InferenceClient
from .settings import HUGGINGFACE_TOKEN,GROK_API_KEY
from .models import ChatSession, Chat
from django.middleware.csrf import get_token
import base64
import json
import requests
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import FlashrankRerank
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import Qdrant
from langchain_community.document_loaders import UnstructuredMarkdownLoader
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from llama_parse import LlamaParse
import nltk   

nltk.download('all') 


model_name = "meta-llama/Meta-Llama-3-8B-Instruct"
image_model_name = "Salesforce/blip-image-captioning-base"
client = InferenceClient(model=model_name, token=HUGGINGFACE_TOKEN)
vqa_client = InferenceClient(model=image_model_name, token=HUGGINGFACE_TOKEN)
document_path = r".\documents.md"


class CSRFView(View):
    def get(self, request):
        return JsonResponse({'csrfToken' : get_token(request)})

@method_decorator(csrf_exempt, name='dispatch')
class ChatHistory(View):
    def get(self, request, uid=None):
        if uid:
            user = User.objects.get(pk=uid)
            sessions = ChatSession.objects.filter(user=user).order_by("-created_at")
            data = [ChatSessionSerializer(session) for session in sessions]
            return JsonResponse({"data": data}, status=200)
        return JsonResponse({"data": []}, status=200)
    
    def delete(self, request):
        id = request.GET.get("pk")
        if id is not None:
            chat_session = ChatSession.objects.get(pk=id)
            user = chat_session.user
            chat_session.delete()
            sessions = ChatSession.objects.filter(user=user).order_by("-created_at")
            data = [ChatSessionSerializer(session) for session in sessions]
            return JsonResponse({"data": data}, status=200)
        return JsonResponse({"error": "Not Found", "message": "Record ID not provided."}, status=401)

    def put(self, request):
        rename = request.GET.get("caption")
        if rename == "true":
            data = json.loads(request.body)
            new_caption = data['caption']
            session_id = data["sessionId"]
            session = ChatSession.objects.filter(session_id=session_id).first()
            if session is not None:
                session.caption = new_caption
                session.save()
                data = ChatSessionSerializer(session)
                return JsonResponse({"data": data, "message": "Record updated."}, status=200)
        return JsonResponse({"data": {}, "message": "Record updated."}, status=200)

@method_decorator(csrf_exempt, name='dispatch')
class ChatView(View):
    # Class attributes to store pre-initialized components
    compression_retriever = None
    llm = None
    
    @classmethod
    def initialize_components(cls):
        if cls.compression_retriever is None or cls.llm is None:
            # Perform initialization once
            loader = UnstructuredMarkdownLoader(document_path)
            loaded_documents = loader.load()

            text_splitter = RecursiveCharacterTextSplitter(chunk_size=2048, chunk_overlap=128)
            docs = text_splitter.split_documents(loaded_documents)

            embeddings = FastEmbedEmbeddings(model_name="BAAI/bge-base-en-v1.5")
            qdrant = Qdrant.from_documents(
                docs,
                embeddings,
                # location=":memory:",
                path=".",
                collection_name="document_embeddings",
            )

            retriever = qdrant.as_retriever(search_kwargs={"k": 5})
            compressor = FlashrankRerank(model="ms-marco-MiniLM-L-12-v2")
            cls.compression_retriever = ContextualCompressionRetriever(
                base_compressor=compressor, base_retriever=retriever
            )

            cls.llm = ChatGroq(temperature=0, model_name="llama3-70b-8192",api_key=GROK_API_KEY)

    def invoke_query(self, query):
        # Ensure components are initialized
        self.initialize_components()

        prompt_template = """
        Use the following pieces of information to answer the user's question.
        If you don't know the answer, just say that you don't know, don't try to make up an answer.

        Context: {context}
        Question: {question}

        Answer the question and provide additional helpful information,
        based on the pieces of information, if applicable. Be succinct.

        Responses should be properly formatted to be easily read.
        """

        prompt = PromptTemplate(
            template=prompt_template, input_variables=["context", "question"]
        )

        qa = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=self.compression_retriever,
            return_source_documents=True,
            chain_type_kwargs={"prompt": prompt, "verbose": True},
        )

        response = qa.invoke(query)
        return response['result']  # assuming 'output_text' is the key for the response text

    def post(self, request):
        try:
            data = json.loads(request.body)
            messages = data.get('messages', '')
            uid = data.get('uid', '')
            sessionId = data.get('sessionId', '')
            chat_session = ChatSession.objects.filter(session_id=sessionId).first()

            if not chat_session:
                user = User.objects.get(pk=uid)
                chat_session = ChatSession.objects.create(user=user, session_id=sessionId)

            query = messages[-1]['content']
            reply = self.invoke_query(query)

            if not chat_session.caption:
                topic = self.generate_topic(reply)
                chat_session.caption = topic
                chat_session.save()

            chat = Chat.objects.create(session=chat_session, role="user", content=query)
            user_chat = ChatSerializer(chat)

            chat = Chat.objects.create(session=chat_session, role="assistant", content=reply)
            bot_chat = ChatSerializer(chat)

            return JsonResponse({"user": user_chat, "assistant": bot_chat}, status=200)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

    def generate_topic(self, chat_text):
        topic = ''
        prompt = f"""
            Model a Topic for the Given reply text in less than 50 words and one sentence maximum. \
            Just give me topic don't speak extra words, just topic: \n {chat_text}
        """
            
        for message in client.chat_completion(
                messages=[{"role": "user", "content": prompt}],
                max_tokens=75,
                stream=True,
            ):
            topic += message.choices[0].delta.content + ""
        return topic

    def delete(self, request):
        id = request.GET.get("pk")
        if id is not None:
            Chat.objects.get(pk=id).delete()
            return JsonResponse({"message": f"Record ID ( {id} ) deleted successfully."}, status=200)
        return JsonResponse({"error": "Record ID not present in payload."}, status=500)

    def put(self, request):
        disliked_action = request.GET.get("disliked")
        data = json.loads(request.body)
        chat = None
        if disliked_action == "true":
            chat = Chat.objects.get(pk=data["pk"])
            chat.disliked = not (chat.disliked)
            chat.save()
            chat = ChatSerializer(chat)
        return JsonResponse({"data": chat, "message": f"Record ID ({data['pk']}) pdated successfully."}, status=200)

@method_decorator(csrf_exempt, name="dispatch")
class AudioView(View):
    def post(self, request):
        print(request.FILES)
        return JsonResponse({"error": "Audio processing went wrong!"}, status=500)

@method_decorator(csrf_exempt, name="dispatch")
class ImageView(View):
    def post(self, request):
        image = request.FILES.get("image", None)
        question = request.POST.get("question") or 'What is the main subject of the image?'
        uid = request.POST.get('uid', '')
        sessionId = request.POST.get('sessionId', '')
        chat_session = ChatSession.objects.filter(session_id = sessionId).first()
        if not chat_session:
            user = User.objects.get(pk=uid)
            chat_session = ChatSession.objects.create(user=user, session_id=sessionId,)
        if image is not None:
            API_URL = "https://api-inference.huggingface.co/models/Salesforce/blip-vqa-base"
            encoded_image=base64.b64encode(image.read()).decode('utf-8')
            headers = {"Authorization": f"Bearer {HUGGINGFACE_TOKEN}"}
            payload = {
                "inputs": {
                    "image": encoded_image,
                    "question": question
                }
            }
            chat = Chat.objects.create(session=chat_session,role="user",content=question, image=image)
            user_chat = ChatSerializer(chat)
            response = requests.post(API_URL, headers=headers, json=payload)
            result = response.json()
            if response.status_code == 200 and isinstance(result, list):
                reply = result[0]["answer"] if result[0] else 'Something went wrong!'
                chat = Chat.objects.create(session=chat_session,role="assistant",content=reply)
                bot_chat = ChatSerializer(chat)
                return JsonResponse({"user": user_chat, "assistant": bot_chat}, status=200)
        return JsonResponse({"role": "assistant", "content": "Image is missing in payload!"}, status=500)

@method_decorator(csrf_exempt, name="dispatch")
class LoginView(View):
    def post(self, request):
        print(request.body)
        if request.user.is_authenticated:
            return JsonResponse({"message": "User already logged in.", "user": UserSerializer(request.user)}, status=403)
        data = json.loads(request.body)
        username = data["username"]
        password = data["password"]
        user = authenticate(username=username, password=password)
        if user is not None:
            login(request, user)
            return JsonResponse({"message": "Successfully logged in.", "user": UserSerializer(user)}, status=200)
        return JsonResponse({"message": "User doesn't exist. Recheck credentials!"}, status=401)

@method_decorator(csrf_exempt, name="dispatch")
class RegisterView(View):
    def post(self, request):
        data = json.loads(request.body)
        print(data)
        email = data["email"]
        password = data["password"]
        full_name = data["fullName"]
        dob = data["dob"]

        if User.objects.filter(username=email).exists():
            return JsonResponse({"message": "User with same email already exists!"}, status=400)
        
        user = User.objects.create(
            username=email,email=email,
            password=make_password(password),
            first_name=full_name,last_name=dob,
            is_staff=True
        )

        return JsonResponse({"message": "User created successfully", "user": UserSerializer(user)}, status=200)

@method_decorator(csrf_exempt, name="dispatch")
class LogoutView(View):
    def post(self, request):
        data = json.loads(request.body)
        return JsonResponse({"status": 200})

@method_decorator(csrf_exempt, name="dispatch")
class AuthCheck(View):
    def get(self, request):
        if request.user.is_authenticated:
            return JsonResponse({"message": "User is logged in.", "user": UserSerializer(request.user)}, status=200)
        return JsonResponse({"message": "User is not logged in.", "user": None}, status=200)
