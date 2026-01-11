# Dockerfile

# 1. Usar una imagen base de Python. 
# Nota: La 3.10.0 es funcional, pero 'python:3.10-slim' es más pequeña y rápida.
FROM python:3.10.0 

# 2. Establecer variables de entorno
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# 3. Establecer el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# 4. Copiar los archivos de dependencia e instalar dependencias
COPY requirements.txt .
RUN pip install --upgrade pip
# Esto instalará gunicorn, django-environ, psycopg2-binary, etc.
RUN pip install -r requirements.txt

# 5. Copiar el resto del código de la aplicación al contenedor
COPY . .

# 6. Recolección de estáticos: SE ELIMINA DE AQUÍ.
# La línea "RUN python manage.py collectstatic --noinput" fue eliminada/comentada 
# para evitar el error de configuración durante la CONSTRUCCIÓN de la imagen.

# 7. Exponer el puerto por defecto de Gunicorn (informativo, Render usa $PORT)
EXPOSE 8000

# 8. Comando para iniciar el servidor de producción (CMD)
# Ejecuta comandos ENCADENADOS cuando Render inicia el CONTENEDOR:
# 1. Ejecuta migraciones
# 2. Recolecta estáticos
# 3. Inicia Gunicorn en el puerto $PORT asignado por Render
CMD python manage.py migrate --noinput && python manage.py collectstatic --noinput && gunicorn Registro_Articulo.wsgi:application --bind 0.0.0.0:$PORT