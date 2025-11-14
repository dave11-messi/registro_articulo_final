# solicitudes_app/apps.py

from django.apps import AppConfig

class SolicitudesAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'solicitudes_app'

    def ready(self):
        """Importa el archivo signals.py cuando la aplicación esté lista."""
        import solicitudes_app.signals  # <-- ¡Añade esta línea!