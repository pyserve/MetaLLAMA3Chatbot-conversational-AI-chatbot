from django.core.serializers import serialize
import json


def UserSerializer(user):
    serialized_user = serialize("json", [user, ])
    data = json.loads(serialized_user)[0]
    return {**data['fields'], 'model': data['model'], 'pk': data['pk']}


def ChatSerializer(chat):
    serialized_chat = serialize("json", [chat, ])
    data = json.loads(serialized_chat)[0]
    return {**data['fields'], 'model': data['model'], 'pk': data['pk']}

def ChatSessionSerializer(session):
    serialized_session = serialize("json", [session, ])
    data = json.loads(serialized_session)[0]
    return {**data['fields'], 'model': data['model'], 'pk': data['pk']}
    