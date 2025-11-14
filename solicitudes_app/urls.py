# solicitudes_app/urls.py
from rest_framework.routers import DefaultRouter
from django.urls import path, include
from . import views

router = DefaultRouter()

# Registra SolicitudViewSet en el path 'solicitudes'
router.register(r'solicitudes', views.SolicitudViewSet)

# Opcional: Registra RevisionViewSet si quieres un endpoint separado para todas las revisiones
router.register(r'revisiones', views.RevisionViewSet) 

urlpatterns = [
    path('', include(router.urls)),
]