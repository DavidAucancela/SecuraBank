# SecuraBank — Sistema de Gestión de Transacciones (SGT)

**Escuela Superior Politécnica de Chimborazo — FIE**  
**Asignatura:** Aplicaciones Informáticas 2  
**Autor:** Jonathan David Aucancela Maguana (6856)

Sistema bancario seguro con cumplimiento de normas **OWASP Top 10**, autenticación multifactor (TOTP), auditoría de operaciones y API REST documentada.

---

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Backend | Django 5 + Django REST Framework |
| Autenticación | JWT (SimpleJWT) + TOTP MFA (django-otp) |
| Base de datos | PostgreSQL |
| Frontend | React 19 + Bootstrap 5 + Recharts |
| Email | SendGrid (SMTP) |
| Documentación API | drf-spectacular (Swagger / ReDoc) |

---

## Estructura del proyecto

```
SecuraBank/
├── .gitignore
├── CHANGELOG.md
├── CLAUDE.md
├── README.md
└── src/
    ├── manage.py
    ├── .env                    ← variables de entorno (no subir a git)
    ├── backend/                ← settings.py, urls.py, requirements.txt
    ├── accounts/               ← app: cuentas bancarias
    ├── users/                  ← app: autenticación, MFA, usuarios
    ├── transacciones/          ← app: transferencias y dashboard
    ├── logs/                   ← audit.log (generado en ejecución)
    └── frontend/               ← React SPA
        └── src/
            ├── api/            ← CuentasAPI, UsuariosAPI, TransaccionesAPI, DashboardAPI
            ├── components/     ← dashboard, cuentas, transacciones, configuracion, Auth
            └── context/        ← AuthContext
```

---

## Instalación y puesta en marcha

### Requisitos previos

- Python 3.9+
- Node.js 18+
- PostgreSQL (o Docker)

### 1. Clonar el repositorio

```bash
git clone https://github.com/DavidAucancela/SecuraBank.git
cd SecuraBank
```

### 2. Base de datos — opción Docker (recomendado)

```bash
docker run -d \
  --name securabank-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=admin \
  -e POSTGRES_DB=dbSGT \
  -p 5434:5432 \
  postgres:15
```

Para iniciar el contenedor en sesiones futuras:
```bash
docker start securabank-db
```

### 3. Entorno Python

```bash
# macOS / Linux
python3 -m venv src/env_mac
source src/env_mac/bin/activate

pip install -r src/backend/requirements.txt
```

### 4. Variables de entorno

Edita `src/.env` con tus valores:

```env
DB_NAME=dbSGT
DB_USER=postgres
DB_PASSWORD=admin
DB_HOST=localhost
DB_PORT=5434

SECRET_KEY=clave-secreta-larga-y-aleatoria
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

SENDGRID_API_KEY=SG.tu_clave_aqui
FRONTEND_URL=http://localhost:3001
CORS_ALLOWED_ORIGINS=http://localhost:3001
```

### 5. Migraciones y arranque del backend

```bash
cd src
source env_mac/bin/activate   # si no está activo
python3 manage.py migrate
python3 manage.py runserver   # http://localhost:8000
```

### 6. Instalar dependencias y arrancar el frontend

```bash
cd src/frontend
npm install
npm start   # http://localhost:3001
```

> **Nota:** el frontend corre en el puerto **3001** (no 3000) para evitar conflictos con otros servicios.

---

## Endpoints principales de la API

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/users/register/` | Registro de usuario | No |
| POST | `/api/users/login/` | Login → JWT tokens | No |
| POST | `/api/users/logout/` | Logout (blacklist token) | Sí |
| POST | `/api/users/token/refresh/` | Renovar access token | No |
| GET | `/api/users/get-user/` | Datos del usuario actual | Sí |
| PATCH | `/api/users/users/{id}/` | Actualizar propio usuario | Sí |
| GET | `/api/users/mfa/generate/` | Generar QR para TOTP | Sí |
| POST | `/api/users/mfa/confirm/` | Verificar código TOTP | No |
| GET | `/api/users/mfa/status/` | Estado MFA del usuario | Sí |
| POST | `/api/users/password-reset/` | Solicitar reset de contraseña | No |
| POST | `/api/users/password-reset-confirm/` | Confirmar nuevo password | No |
| GET | `/api/accounts/` | Listar cuentas propias | Sí |
| POST | `/api/accounts/accounts/` | Crear cuenta | Sí |
| DELETE | `/api/accounts/accounts/{id}/` | Eliminar cuenta | Sí |
| GET | `/api/accounts/lookup/?number=` | Buscar cuenta por número | Sí |
| GET | `/api/transacciones/` | Listar transacciones propias | Sí |
| POST | `/api/transacciones/` | Crear transferencia | Sí |
| GET | `/api/transacciones/dashboard/` | Resumen financiero | Sí |

### Documentación interactiva

- **Swagger UI:** `http://localhost:8000/api/docs/`
- **ReDoc:** `http://localhost:8000/api/redoc/`
- **Schema JSON:** `http://localhost:8000/api/schema/`

---

## Seguridad — Cumplimiento OWASP Top 10

| OWASP | Control implementado |
|-------|---------------------|
| A01 — Broken Access Control | Cada usuario solo accede a sus propios recursos. `UserDetailView` lanza 403 si el ID no coincide con el token. `AccountLookupView` expone solo datos mínimos del destinatario. |
| A02 — Cryptographic Failures | Credenciales en `.env`, nunca en código. HTTPS en producción (HSTS). Cookies con `Secure` + `HttpOnly`. |
| A03 — Injection | Django ORM (parameterized queries). DRF serializers validan y sanitizan todos los inputs. |
| A04 — Insecure Design | MFA TOTP para accesos sensibles. MFA obligatorio para transferencias > $500. |
| A05 — Security Misconfiguration | `DEBUG=False` en producción. `CORS_ALLOW_ALL_ORIGINS=False`. Headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`. |
| A06 — Vulnerable Components | Dependencias mínimas y actualizadas. Sin versiones fijadas inseguras. |
| A07 — Auth Failures | JWT con access token de 5 min + refresh de 1 día. Blacklist en logout. Bloqueo tras 3 intentos fallidos (login + MFA). |
| A09 — Logging Failures | `audit.log` rotativo registra: login, MFA, logout, transferencias, resets de contraseña, IP de origen. |

---

## Flujos principales

### Registro y primer acceso
1. `POST /register/` → crea usuario + cuenta principal (saldo $125) automáticamente
2. `POST /login/` → devuelve JWT tokens
3. Opcional: configurar MFA desde `/configuracion`

### Flujo MFA
1. Login devuelve `{ mfa_required: true }` (sin tokens)
2. Usuario ingresa código TOTP de su app (Google Authenticator, Authy…)
3. `POST /mfa/confirm/` → devuelve tokens si el código es válido
4. Bloqueo automático tras 3 intentos fallidos en 5 minutos

### Transferencia segura
1. Seleccionar cuenta origen
2. Elegir destino: **"Mis cuentas"** (dropdown) o **"Otro usuario"** (buscar por número de cuenta)
3. Si modo "Otro usuario": ingresar número → botón "Buscar" → confirmar titular antes de continuar
4. Si monto > $500: se solicita código MFA antes de procesar
5. Transferencia es atómica (`db_transaction.atomic`)
6. Email de confirmación enviado al usuario
7. Registro en `audit.log`

### Renovación de token
- El frontend renueva el access token antes de que expire
- Si el refresh token es inválido: limpia sesión y redirige a `/login`

---

## Tests

```bash
cd src
source env_mac/bin/activate
python3 manage.py test
```

| Archivo | Tests | Cobertura |
|---------|-------|-----------|
| `users/tests.py` | 24 | Registro, login, rate limit, MFA, logout, get-user, acceso cruzado |
| `accounts/tests.py` | 12 | Signal, CRUD, acceso denegado, account_number generado |
| `transacciones/tests.py` | 12 | Transferencia, saldo insuficiente, cuenta ajena, MFA >$500, atomicidad |
| **Total** | **48** | |

---

## Páginas del frontend

| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/login` | `Login.js` | Inicio de sesión |
| `/register` | `Register.js` | Registro con validación de contraseña (zxcvbn) |
| `/mfa` | `MFA.js` | Verificación TOTP post-login |
| `/password-reset` | `PasswordReset.js` | Solicitar reset de contraseña |
| `/reset-password` | `PasswordResetConfirm.js` | Confirmar nueva contraseña |
| `/dashboard` | `DashboardPage.js` | Resumen financiero con gráficas y tabla de cuentas |
| `/cuentas` | `CuentasPage.js` | Gestión de cuentas en tarjetas, con botón copiar número |
| `/transacciones` | `TransactionPage.js` | Transferencias a cuentas propias o de otros usuarios, historial con dirección |
| `/configuracion` | `UserSettings.js` | Editar perfil con feedback visual |
