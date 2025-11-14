# solicitudes_app/views.py

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Solicitud, Revision
from .serializers import SolicitudSerializer, RevisionSerializer
from .permissions import IsSolicitanteOrReadOnly, IsAdminOrRevisor
# Importaremos el permiso personalizado que crearemos más adelante
# from .permissions import IsSolicitanteOrReadOnly 

# ----------------------------------------------------
# A. ViewSet para Solicitudes
# Este ViewSet maneja todas las operaciones CRUD para las solicitudes.
# ----------------------------------------------------
class SolicitudViewSet(viewsets.ModelViewSet):
    # 1. Definición de la consulta base
    queryset = Solicitud.objects.all().order_by('-fecha_creacion')
    
    # 2. Definición del Serializer a usar
    serializer_class = SolicitudSerializer
    
    # 3. Permisos (Solo usuarios autenticados pueden realizar acciones)
    permission_classes = [permissions.IsAuthenticated, IsSolicitanteOrReadOnly] 

    # Sobrescribimos perform_create para asignar automáticamente al solicitante
    def perform_create(self, serializer):
        """Asigna el usuario que realiza la petición como el solicitante."""
        # El campo 'solicitante' se guarda automáticamente con el usuario actual
        serializer.save(solicitante=self.request.user)
    
    # Método personalizado: Listar solo las solicitudes del usuario actual
    @action(detail=False, methods=['get'])
    def mis_solicitudes(self, request):
        """Devuelve una lista de solicitudes donde el usuario actual es el solicitante."""
        solicitudes = self.queryset.filter(solicitante=request.user)
        serializer = self.get_serializer(solicitudes, many=True)
        return Response(serializer.data)
    
    # ----------------------------------------------------
    #  B. Endpoint Anidado para Crear Revisiones
    #  Ruta: /api/solicitudes/{id}/agregar_revision/
    # ----------------------------------------------------
    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrRevisor])
    def agregar_revision(self, request, pk=None):
        """Permite a un revisor o admin añadir una revisión a una solicitud."""
        solicitud = self.get_object()
        
        # Copiamos los datos de la petición para poder modificarlos
        data = request.data.copy()
        data['solicitud'] = solicitud.id # Asignamos la solicitud automáticamente
        data['revisor'] = request.user.id # Asignamos el revisor automáticamente

        serializer = RevisionSerializer(data=data)
        
        if serializer.is_valid():
            serializer.save()
            
            # (Opcional) Lógica para actualizar el estado de la solicitud
            # solicitud.estado = 'en_revision' 
            # solicitud.save()

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ----------------------------------------------------
# C. ViewSet para Revisiones (solo lectura/listado)
# Se usa principalmente para listar revisiones de todas las solicitudes.
# La creación de revisiones ya se manejó de forma anidada en SolicitudViewSet.
# ----------------------------------------------------
class RevisionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Revision.objects.all()
    serializer_class = RevisionSerializer
    # Solo los administradores o revisores deberían listar todas las revisiones
    permission_classes = [permissions.IsAdminUser]