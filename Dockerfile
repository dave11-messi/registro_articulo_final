# Dockerfile

# 1. Usar una imagen base de Python (version ligera recomendada)
FROM python:3.10.0 

# 2. Establecer variables de entorno
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# 3. Establecer el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# 4. Copiar los archivos de dependencia e instalar dependencias
# (Asegúrese de que el archivo se llame 'requirements.txt')
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# 5. Copiar el resto del código de la aplicación al contenedor
COPY . .

# 6. Recolectar archivos estáticos y realizar migraciones (requerido para Django)
# Nota: La recolección de estáticos no es necesaria si usa un servicio de almacenamiento como S3 o un CDN.
# Si planea usar Whitenoise, SÍ es necesaria.
RUN python manage.py collectstatic --noinput

# 7. Exponer el puerto por defecto de Gunicorn (o el que use)
EXPOSE 8000

# 8. Comando para iniciar el servidor de producción (Gunicorn)
# Asegúrese de instalar 'gunicorn' en su requirements.txt
# Sustituya 'Registro_Articulo.wsgi' con la ruta a su archivo WSGI principal.
CMD ["gunicorn", "Registro_Articulo", "--bind", "0.0.0.0:8000"]