# Registro_Articulo/urls.py (Principal)
from django.contrib import admin
from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token
from solicitudes_app.views import UserInfoView # <--- NUEVA IMPORTACIÓN
from solicitudes_app.views import descargar_solicitud_pdf
urlpatterns = [
    path('admin/', admin.site.urls),
    
    # ----------------------------------------------------
    #  Incluir las URLs de tu aplicación API
    path('api/v1/', include('solicitudes_app.urls')),
    # ----------------------------------------------------
    path('api/v1/login/', obtain_auth_token),
    # NUEVA RUTA para obtener información del usuario
    path('api/v1/user/info/', UserInfoView.as_view()), # <--- NUEVA RUTA
    # URLs para el login y logout de DRF (útil para pruebas)
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('api/v1/solicitudes/<int:pk>/descargar_pdf/', descargar_solicitud_pdf, name='descargar_solicitud_pdf'),
]