from pathlib import Path
from decouple import config
from datetime import timedelta

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
    'rest_framework_simplejwt.token_blacklist',

    # TOTP (Time-based One-Time Passwords)
    'django_otp', 
    'django_otp.plugins.otp_totp',

    'users.apps.UsersConfig',
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


# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases

#postgresql SEGURA
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
        # 'rest_framework_simplejwt.authentication.JWTAuthentication',  # Para JWT
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# Configuración de SimpleJWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=5),  # Tiempo de vida del token de acceso
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),    # Tiempo de vida del token de refresco
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# Configuración de correo electrónico
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'  # Para desarrollo
# Para producción, usa SMTP:
# EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
# EMAIL_HOST = 'smtp.tu_proveedor.com'
# EMAIL_PORT = 587
# EMAIL_USE_TLS = True
# EMAIL_HOST_USER = 'tu_email@dominio.com'
# EMAIL_HOST_PASSWORD = 'tu_contraseña'
# DEFAULT_FROM_EMAIL = 'Tu Nombre <tu_email@dominio.com>'