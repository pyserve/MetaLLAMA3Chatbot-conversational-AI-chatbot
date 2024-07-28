from django.apps import AppConfig

class MetacodeConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'metacode'

default_app_config = 'metacode.apps.MyAppConfig'