from pathlib import Path
from decouple import config
from datetime import timedelta
import dj_database_url

# Ruta base
BASE_DIR = Path(__file__).resolve().parent.parent

# Cargar variables de entorno desde .env
SECRET_KEY = config('SECRET_KEY', default='guiru')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='', cast=lambda v: [s.strip() for s in v.split(',')])

#apps instaladas
INSTALLED_APPS = [
    'django.contrib.admin',
    'corsheaders',# Para conectar con React

    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist', # lista negra

    # TOTP (Time-based One-Time Passwords)
    'django_otp', 
    'django_otp.plugins.otp_totp',

    # se puede poner dos formas de especficiar rutas de las apps
    # 'users.apps.UsersConfig', al poner .apps.Config aumentan las opciones de configuracion
    'accounts.apps.AccountsConfig',
    'users.apps.UsersConfig',
    'transacciones.apps.TransaccionesConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware', #comunicacion de django y react - CORS
    
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django_otp.middleware.OTPMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',

]


ROOT_URLCONF = 'backend.urls'

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

WSGI_APPLICATION = 'backend.wsgi.application'

#Database
#postgresql -SEGURA
DATABASES = {
     'default': {
         'ENGINE': 'django.db.backends.postgresql',
         'NAME': config('DB_NAME'),
         'USER': config('DB_USER'),
         'PASSWORD': config('DB_PASSWORD'),
         'HOST': config('DB_HOST'),
         'PORT': config('DB_PORT'),   
     }
 }

#postgresql - nube
# DATABASES = {
# 'default': dj_database_url.config(default="postgresql://postgres:QeVMFNWtXggEQvjDJhtVhZvJiQWaOwof@autorack.proxy.rlwy.net:41783/railway", conn_max_age=1800),
#}


# controles contraseñas
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8},  #mínimo 8 caracteres
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Idioma y zona horaria
LANGUAGE_CODE = 'es-es'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = True

STATIC_URL = 'static/'

#habilitar para conexion entre be y fe
CORS_ALLOW_ALL_ORIGINS = True # Solo para desarrollo. En producción, especifica los orígenes permitidos
#CORS_ALLOWED_ORIGINS = [
#    "https://tudominio.com",

#    "http://localhost:3000",
#]

#DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

#configuracion para globales para REST Framework -  autenticación por tokens o JWT
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',  # Para tokens
        'rest_framework_simplejwt.authentication.JWTAuthentication',  # Para JWT 
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# Configuración de SimpleJWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=5),  # Tiempo token de acceso
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),    # Tiempo token de refresco
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# Configuración de correo electrónico
# EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'  # Para desarrollo
#Pra producción, usa SMTP:
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.sendgrid.net'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'apikey'
EMAIL_HOST_PASSWORD = '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'
DEFAULT_FROM_EMAIL = 'david102002@hotmail.com'
