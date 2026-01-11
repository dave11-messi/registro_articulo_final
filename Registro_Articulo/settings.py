"""
Django settings for Registro_Articulo project.
"""

import os
from pathlib import Path
import environ 

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# ----------------------------------------------------
# CONFIGURACIÓN DE DJANGO-ENVIRON Y LECTURA DE .ENV
# ----------------------------------------------------
env = environ.Env(
    # Definir valores por defecto para evitar fallos en la CONSTRUCCIÓN de Docker
    DEBUG=(bool, False), 
    # Usar un placeholder SÓLO para el build. Render inyectará el valor real.
    SECRET_KEY=(str, 'placeholder-para-docker-build-inseguro'), 
    DATABASE_URL=(str, 'sqlite:///db.sqlite3') 
)

# Leer el archivo .env solo si existe (para desarrollo local)
# Render no necesita este archivo y lo ignora.
if os.path.exists(os.path.join(BASE_DIR, '.env')):
    environ.Env.read_env(os.path.join(BASE_DIR, '.env')) 
# ----------------------------------------------------


# Quick-start development settings - unsuitable for production

# LECTURA DE VARIABLES CLAVE DESDE EL ENTORNO (Render o .env local)
SECRET_KEY = env('SECRET_KEY') 

# DEBUG ahora se controla completamente por la variable de entorno 'DEBUG'
DEBUG = env('DEBUG') 

# ALLOWED_HOSTS ahora se lee de una lista separada por comas de Render.
# El default es para desarrollo local.
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['127.0.0.1', 'localhost'])


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'solicitudes_app',
    'rest_framework', 
    'rest_framework.authtoken',
    'corsheaders', 
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    # Recomendación: Si usa Whitenoise para estáticos (opcional), añádalo aquí:
    # 'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware', 
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'Registro_Articulo.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'Registro_Articulo.wsgi.application'


# ----------------------------------------------------
# CONFIGURACIÓN DE BASE DE DATOS (Supabase/PostgreSQL)
# ----------------------------------------------------
# Lee la variable DATABASE_URL del entorno. Usa el default si no existe.
DATABASES = {
    'default': env.db() 
}

# Configuración SSL para Supabase/PostgreSQL en Render
if DATABASES['default']['ENGINE'].endswith('postgresql'):
    # Esta es una configuración segura y requerida por Render/Supabase
    DATABASES['default']['OPTIONS'] = {'sslmode': 'require'}


# Password validation
# ... (Configuración de validación de contraseña, se mantiene igual)
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# ... (Configuración de internacionalización, se mantiene igual)
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


# Static files (CSS, JavaScript, Images)
# Configuración para producción (Docker)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'


# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Configuración de Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.TokenAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    )
}

# Configuración de CORS
# Lee los orígenes permitidos (URLs de su Frontend) desde la variable de entorno
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=['http://localhost:3000'])

CORS_ALLOW_CREDENTIALS = True