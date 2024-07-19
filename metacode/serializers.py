from django.core.serializers import serialize
import json


def UserSerializer(user):
    fields = ['id', 'email', 'first_name', 'last_name', 'date_joined', 'is_active', 'is_staff']
    serialized_user = serialize("json", [user, ], fields=fields)
    return json.loads(serialized_user)[0]
    