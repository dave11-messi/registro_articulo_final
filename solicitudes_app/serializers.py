# solicitudes_app/serializers.py

from rest_framework import serializers
from .models import Solicitud, Revision
from django.contrib.auth.models import User 

# ----------------------------------------------------
# A. Serializer para el Usuario
# Se usa para mostrar el solicitante y el revisor sin exponer la contraseña.
# ----------------------------------------------------
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = fields # Solo lectura, no permitimos editar usuarios aquí

# ----------------------------------------------------
# B. Serializer para las Revisiones
# ----------------------------------------------------
class RevisionSerializer(serializers.ModelSerializer):
    revisor = UserSerializer(read_only=True) # Muestra el detalle del revisor

    class Meta:
        model = Revision
        # '__all__' incluye todos los campos del modelo Revision
        fields = '__all__'
        read_only_fields = ['fecha_revision', 'revisor']
        
# ----------------------------------------------------
# C. Serializer Principal: Solicitud
# ----------------------------------------------------
class SolicitudSerializer(serializers.ModelSerializer):
    # 1. Relación con el Solicitante (nested serialization)
    solicitante = UserSerializer(read_only=True) 

    # 2. Relación inversa con las revisiones (para ver todas las revisiones de una solicitud)
    # 'revisiones' es el related_name que definimos en el ForeignKey del modelo Revision.
    revisiones = RevisionSerializer(many=True, read_only=True)

    class Meta:
        model = Solicitud
        fields = [
            'id', 
            'titulo', 
            'resumen', 
            'tipo_trabajo', 
            'estado', 
            'fecha_creacion', 
            'solicitante', 
            'revisiones' # Incluye las revisiones en el detalle de la solicitud
        ]
        # Campos que solo pueden ser escritos por el sistema (no por el usuario al crear)
        read_only_fields = ['fecha_creacion', 'estado', 'solicitante']