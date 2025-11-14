# solicitudes_app/permissions.py

from rest_framework import permissions

class IsSolicitanteOrReadOnly(permissions.BasePermission):
    """
    Permite acceso de lectura (GET, HEAD, OPTIONS) a cualquiera.
    Permite acceso de escritura (POST, PUT, DELETE) solo al dueño (solicitante).
    """

    def has_object_permission(self, request, view, obj):
        # El permiso de lectura siempre está permitido para cualquier solicitud (GET, HEAD, OPTIONS).
        if request.method in permissions.SAFE_METHODS:
            return True

        # El permiso de escritura (PUT, PATCH, DELETE) solo se permite al solicitante (dueño) del objeto.
        # 'obj' es la instancia de Solicitud que se está intentando modificar.
        return obj.solicitante == request.user

class IsAdminOrRevisor(permissions.BasePermission):
    """
    Permite acceso solo a administradores o usuarios con el campo is_staff=True
    (asumiendo que los revisores son marcados como is_staff en Django).
    """
    def has_permission(self, request, view):
        # Si el usuario es superusuario (is_superuser) o es staff (is_staff),
        # tiene permiso para acceder a esta vista (e.g., para listar o crear revisiones).
        return request.user and (request.user.is_staff or request.user.is_superuser)