from django.db import models
from django.contrib.auth.models import User # Usaremos el modelo de usuario de Django por defecto

class Solicitud(models.Model):
    # Opciones para el estado (Django's CharField con choices)
    ESTADOS_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('en_revision', 'En Revisión'),
        ('aprobada', 'Aprobada'),
        ('rechazada', 'Rechazada'),
    ]

    # Relación: Un usuario puede tener muchas solicitudes (ForeignKey)
    solicitante = models.ForeignKey(User, on_delete=models.CASCADE) 
    
    titulo = models.CharField(max_length=255)
    resumen = models.TextField()
    
    TIPO_TRABAJO_CHOICES = [
        ('ART', 'Artículo Científico'),
        ('TES_G', 'Tesis de Grado'),
        ('TES_P', 'Tesis de Posgrado'),
    ]
    tipo_trabajo = models.CharField(
        max_length=5,
        choices=TIPO_TRABAJO_CHOICES,
        default='ART',
    )
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(
        max_length=15,
        choices=ESTADOS_CHOICES,
        default='pendiente',
    )

    def __str__(self):
        return f"{self.titulo} ({self.get_estado_display()})"

class Revision(models.Model):
    # Relaciones
    solicitud = models.ForeignKey(Solicitud, on_delete=models.CASCADE, related_name='revisiones')
    revisor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True) # Si el revisor se borra, la revisión se mantiene (pero el campo revisor es NULL)
    
    RECOMENDACIONES_CHOICES = [
        ('APR', 'Aprobar'),
        ('RECH', 'Rechazar'),
        ('RMEN', 'Revisión Menor'),
        ('RMAY', 'Revisión Mayor'),
    ]
    recomendacion = models.CharField(max_length=4, choices=RECOMENDACIONES_CHOICES)
    comentarios = models.TextField(blank=True, null=True)
    fecha_revision = models.DateTimeField(auto_now=True) # Se actualiza cada vez que se guarda

    class Meta:
        verbose_name = "Revisión"
        verbose_name_plural = "Revisiones"

    def __str__(self):
        return f"Revisión para {self.solicitud.titulo} por {self.revisor.username if self.revisor else 'N/A'}"