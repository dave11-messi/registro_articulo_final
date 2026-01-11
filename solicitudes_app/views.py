from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView 
from rest_framework.permissions import IsAuthenticated 
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import AnonymousUser
# ----------------------------------------------------
# AÑADIR IMPORTS NECESARIOS PARA PDF
# ----------------------------------------------------
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.template.loader import get_template
from django.utils import timezone 
from io import BytesIO
from xhtml2pdf import pisa
# ----------------------------------------------------

from .models import Solicitud, Revision
from .serializers import SolicitudSerializer, RevisionSerializer
# Asegúrate de que estos permisos existan en un archivo llamado permissions.py
from .permissions import IsSolicitanteOrReadOnly, IsAdminOrRevisor 


# ----------------------------------------------------
# B. Función Auxiliar para Generar PDF (Fuera del ViewSet)
# ----------------------------------------------------
def render_to_pdf(template_src, context_dict={}):
    """
    Toma una ruta de template y un diccionario de contexto, y devuelve un objeto HttpResponse con el PDF.
    """
    template = get_template(template_src)
    html = template.render(context_dict)
    result = BytesIO()

    # Generar el PDF
    pisa_status = pisa.CreatePDF(
       html,                       # Contenido HTML para convertir
       dest=result                 # Objeto BytesIO para recibir el PDF
    )
    
    # Retornar None si hubo un error de PDF
    if pisa_status.err:
        return None
        
    return HttpResponse(result.getvalue(), content_type='application/pdf')


# ----------------------------------------------------
# C. ViewSet para Solicitudes
# ----------------------------------------------------
class SolicitudViewSet(viewsets.ModelViewSet):
    queryset = Solicitud.objects.all().order_by('-fecha_creacion')
    serializer_class = SolicitudSerializer
    permission_classes = [permissions.IsAuthenticated, IsSolicitanteOrReadOnly] 

    def get_queryset(self):
        # Permite a los staff/revisores ver TODAS las solicitudes
        if self.request.user.is_staff:
            return Solicitud.objects.all().order_by('-fecha_creacion')
        # Los solicitantes solo ven las suyas
        return self.queryset.filter(solicitante=self.request.user)

    def perform_create(self, serializer):
        """Asigna el usuario que realiza la petición como el solicitante."""
        serializer.save(solicitante=self.request.user)
    
    @action(detail=False, methods=['get'])
    def mis_solicitudes(self, request):
        """Devuelve una lista de solicitudes donde el usuario actual es el solicitante."""
        solicitudes = self.queryset.filter(solicitante=request.user).order_by('-fecha_creacion')
        serializer = self.get_serializer(solicitudes, many=True)
        return Response(serializer.data)
    
    # ----------------------------------------------------
    # Acción para añadir una revisión (solo Revisor/Admin)
    # ----------------------------------------------------
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsAdminOrRevisor])
    def add_revision(self, request, pk=None):
        """Crea una nueva revisión para la solicitud especificada y actualiza su estado."""
        
        try:
            solicitud = self.get_object() 
        except Solicitud.DoesNotExist:
            return Response({'detail': 'Solicitud no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
            
        serializer = RevisionSerializer(data=request.data)
        if serializer.is_valid():
            
            # Asignar la solicitud y el revisor antes de guardar
            revision = serializer.save(revisor=request.user, solicitud=solicitud)
            
            # 3. Actualizar el estado de la Solicitud
            recomendacion = revision.recomendacion
            
            if recomendacion == 'APR':
                solicitud.estado = 'aprobada'
            elif recomendacion == 'RECH':
                solicitud.estado = 'rechazada'
            else:
                solicitud.estado = 'en_revision' # Estado Pendiente/En Proceso
                
            solicitud.save() 

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # ----------------------------------------------------
    # Acción para eliminar solicitudes finalizadas (aprobada o rechazada)
    # ----------------------------------------------------
    @action(detail=True, methods=['delete'], permission_classes=[permissions.IsAuthenticated, IsAdminOrRevisor], url_path='eliminar_finalizada')
    def eliminar_finalizada(self, request, pk=None):
        """Permite a un Admin/Revisor eliminar una solicitud SÓLO si está aprobada o rechazada."""
        try:
            solicitud = self.get_object()
        except Solicitud.DoesNotExist:
            return Response({'detail': 'Solicitud no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        # 1. Verificar el estado: Aprobada o Rechazada
        if solicitud.estado not in ['aprobada', 'rechazada']:
            return Response(
                {'detail': 'Solo se pueden eliminar solicitudes en estado "aprobada" o "rechazada".'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 2. Eliminar
        solicitud.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ----------------------------------------------------
# D. ViewSet para Revisiones (solo lectura/listado)
# ----------------------------------------------------
class RevisionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Revision.objects.all()
    serializer_class = RevisionSerializer
    permission_classes = [permissions.IsAdminUser]

# ----------------------------------------------------
# E. Vista para obtener la información del usuario
# ----------------------------------------------------
class UserInfoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Devuelve el ID, username y el estado de staff del usuario actual."""
        return Response({
            'id': request.user.id,
            'username': request.user.username,
            'is_staff': request.user.is_staff,
            'email': request.user.email,
        })
        
        
# ----------------------------------------------------
# F. Vista para descargar PDF de Solicitud (ESTÁNDAR DJANGO)
# ----------------------------------------------------
def descargar_solicitud_pdf(request, pk):
    """
    Genera y descarga un PDF para una solicitud específica.
    Ruta a la que accederá el cliente para la descarga.
    """
    token_key= request.GET.get('auth_token')
    if token_key:
        try:
            token_obj= Token.objects.get(key=token_key)
            request.user= token_obj.user
        except Token.DoesNotExist:
            request.user = AnonymousUser()
    # 1. Autenticación y Autorización
    if not request.user.is_authenticated:
        return HttpResponse("No autorizado.", status=403)

    # 2. Obtener la Solicitud
    solicitud = get_object_or_404(Solicitud, pk=pk)
    
    # 3. Restricción de Estado
    # Permitir la descarga en los estados que Ud. especificó: aprobado, rechazado o pendiente (en_revision)
    estados_permitidos = ['aprobada', 'rechazada', 'en_revision']
    if solicitud.estado not in estados_permitidos:
        return HttpResponse(f"La descarga solo está permitida para solicitudes en estado finalizado o en revisión. Estado actual: {solicitud.estado}", status=403)

    # 4. Definir el contexto y generar el PDF
    context = {
        'solicitud': solicitud,
        'fecha_generacion': timezone.now(), 
    }
    
    # Importante: El template debe estar en 'templates/solicitudes/solicitud_pdf_template.html'
    pdf_response = render_to_pdf('solicitudes/solicitud_pdf_template.html', context)
    
    if pdf_response:
        # 5. Configurar la respuesta para forzar la descarga
        # Asumiendo que su modelo Solicitud tiene un campo 'titulo'
        try:
            filename = f"Solicitud_{solicitud.pk}_{solicitud.titulo[:20].replace(' ', '_')}.pdf"
        except:
            filename = f"Solicitud_{solicitud.pk}.pdf"

        response = pdf_response
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    
    # Manejar error si la generación del PDF falla
    return HttpResponse("Error interno al generar el PDF. Verifique su template HTML.", status=500)