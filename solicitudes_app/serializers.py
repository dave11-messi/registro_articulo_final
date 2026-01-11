from rest_framework import serializers
from .models import Solicitud, Revision 
# Asumiendo que tus modelos Solicitud y Revision están definidos aquí o son accesibles.

# ----------------------------------------------------------------------
# 1. Serializer para la Revisión (para creación y listado básico)
# ----------------------------------------------------------------------
class RevisionSerializer(serializers.ModelSerializer):
    # CRÍTICO: Indicamos que 'solicitud' no es requerido para la entrada (required=False).
    # Esto permite que serializer.is_valid() pase incluso si el frontend no lo envía.
    solicitud = serializers.PrimaryKeyRelatedField(
        queryset=Solicitud.objects.all(), 
        write_only=True,
        required=False # <--- CORRECCIÓN CLAVE
    )
    # Muestra el nombre de usuario del revisor
    revisor = serializers.ReadOnlyField(source='revisor.username') 

    class Meta:
        model = Revision
        # Nota: 'solicitud' ya no es requerido para la entrada de datos (gracias a required=False)
        fields = ['id', 'solicitud', 'revisor', 'recomendacion', 'comentarios', 'fecha_revision']
        read_only_fields = ['revisor', 'fecha_revision'] 


# ----------------------------------------------------------------------
# 2. Serializer para el Resumen de Revisión (para anidamiento en Solicitud)
# ----------------------------------------------------------------------
class RevisionSummarySerializer(serializers.ModelSerializer):
    revisor = serializers.ReadOnlyField(source='revisor.username')
    
    class Meta:
        model = Revision
        fields = ['revisor', 'recomendacion', 'comentarios', 'fecha_revision']


# ----------------------------------------------------------------------
# 3. Serializer para la Solicitud (el que usa el frontend)
# ----------------------------------------------------------------------
class SolicitudSerializer(serializers.ModelSerializer):
    solicitante = serializers.ReadOnlyField(source='solicitante.username')
    
    # Anida la lista de revisiones
    revisiones = RevisionSummarySerializer(many=True, read_only=True) 

    class Meta:
        model = Solicitud
        fields = ['id', 'solicitante', 'titulo', 'resumen', 'tipo_trabajo', 'estado', 'fecha_creacion', 'revisiones']
        read_only_fields = ['solicitante', 'estado', 'fecha_creacion']