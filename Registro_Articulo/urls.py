# Registro_Articulo/urls.py (Principal)
from django.contrib import admin
from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token
urlpatterns = [
    path('admin/', admin.site.urls),
    
    # ----------------------------------------------------
    #  Incluir las URLs de tu aplicación API
    path('api/v1/', include('solicitudes_app.urls')),
    # ----------------------------------------------------
    path('api/v1/login/', obtain_auth_token),
    # URLs para el login y logout de DRF (útil para pruebas)
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')), 
]
