# Changelog — SecuraBank SGT

Registro de cambios por sprint. Convención: **[FIXED]** bug corregido · **[ADDED]** funcionalidad nueva · **[SECURITY]** mejora de seguridad · **[REFACTOR]** refactorización.

---

## Sprint D — Transferencias externas y rediseño UI

### Entorno y configuración

**[ADDED] `.gitignore` creado**
- Excluye `env/`, `env_mac/`, `node_modules/`, `logs/`, `*.pyc`, `__pycache__/`, `.env`, `.DS_Store`
- Evita subir el venv, cachés de Python y archivos sensibles al repositorio

**[FIXED] Puerto del frontend cambiado a 3001**
- `frontend/package.json` — script `start` modificado a `PORT=3001 react-scripts start`
- `src/.env` — `FRONTEND_URL` y `CORS_ALLOWED_ORIGINS` actualizados a `http://localhost:3001`
- Motivo: el puerto 3000 estaba ocupado por otro servicio Docker (`open-webui`)

**[ADDED] Soporte de entorno macOS**
- `src/env_mac/` — virtual environment Python creado con `python3 -m venv`
- PostgreSQL levantado vía Docker: `docker run -d --name securabank-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=admin -e POSTGRES_DB=dbSGT -p 5434:5432 postgres:15`
- 48 tests ejecutados y verificados: `OK` sobre la base de datos Docker

### Backend

**[ADDED] Endpoint `GET /api/accounts/lookup/`**
- `accounts/views.py` — `AccountLookupView`: busca una cuenta por número (`?number=ACC-XXX`)
- Devuelve solo `{id, account_number, owner}` — mínimo necesario para confirmar un destinatario sin exponer datos sensibles
- Requiere autenticación JWT; devuelve 404 si el número no existe
- `accounts/urls.py` — ruta `lookup/` registrada antes del router para evitar colisiones

### Frontend

**[FIXED] Transferencias a cuentas de otros usuarios**
- `TransactionPage.js` — el selector de destino solo mostraba cuentas propias (bug conocido desde Sprint C)
- Reemplazado por toggle **"Mis cuentas" / "Otro usuario"**:
  - Modo "Mis cuentas": dropdown filtrado (excluye la cuenta de origen seleccionada)
  - Modo "Otro usuario": input de número de cuenta + botón "Buscar" que llama a `/api/accounts/lookup/`; muestra nombre del titular antes de confirmar
- `CuentasAPI.js` — añadida función `lookupCuenta(number)`

**[REFACTOR] `TransactionPage.js` — rediseño completo**
- Layout en dos columnas: formulario (izquierda) | historial (derecha)
- Tarjeta de cuenta de origen con saldo disponible destacado
- Campo de monto con prefijo `$` y selector de moneda compacto en la misma fila
- Historial con `list-group` en lugar de tabla:
  - Badge **↑ Enviada** (rojo) / **↓ Recibida** (verde) según si la cuenta origen pertenece al usuario
  - Montos formateados con signo `−` / `+` y separadores de miles
  - Fecha en formato `dd/mm/yyyy hh:mm`

**[REFACTOR] `CuentasPage.js` — tabla reemplazada por cards**
- Grid responsive de tarjetas Bootstrap (col-xl-3 / col-md-4 / col-sm-6)
- Cada tarjeta muestra: nombre, número de cuenta con botón copiar (⎘ / ✓), saldo en grande, badge de estado
- Formulario "Nueva Cuenta" compactado en una sola línea (input + botón)

**[FIXED] `UserSettings.js` — feedback silencioso al guardar**
- `handleUpdate` ahora muestra `Swal.fire('Guardado', ...)` en éxito y `Swal.fire('Error', ...)` en fallo
- Añadido import de `sweetalert2`

---

## Sprint C — Funcionalidades nuevas

### Backend

**[ADDED] Documentación API con drf-spectacular**
- `backend/requirements.txt` — añadido `drf-spectacular`
- `backend/settings.py` — `drf_spectacular` en `INSTALLED_APPS`, `DEFAULT_SCHEMA_CLASS` y `SPECTACULAR_SETTINGS` con título, descripción y tags
- `backend/urls.py` — nuevas rutas:
  - `GET /api/schema/` → OpenAPI JSON/YAML
  - `GET /api/docs/` → Swagger UI interactivo
  - `GET /api/redoc/` → ReDoc

**[ADDED] Endpoint dashboard**
- `transacciones/views.py` — `dashboard()`: agrega saldo total, número de cuentas, conteo de transacciones y actividad diaria de los últimos 7 días (enviadas y recibidas)
- `transacciones/urls.py` — `GET /api/transacciones/dashboard/`

**[ADDED] Email de confirmación de transferencia**
- `transacciones/templates/transfer_confirmation_email.html` — plantilla HTML responsive con monto, cuentas, fecha y nuevo saldo
- `transacciones/views.py` — `_send_transfer_notification()` invocada tras transferencia exitosa en `TransactionViewSet` y `CreateTransaccionView`. `fail_silently=True` garantiza que un fallo de email no revierta la transferencia

### Frontend

**[ADDED] Página Dashboard (`/dashboard`)**
- `frontend/src/components/dashboard/DashboardPage.js` — tarjetas de resumen, gráfica de barras (recharts) de actividad 7 días, tabla de cuentas
- `frontend/src/api/DashboardAPI.js` — cliente para `GET /api/transacciones/dashboard/`
- `frontend/package.json` — añadido `recharts ^2.14.1`, `sweetalert2`, `bootstrap`, `react-hook-form` (dependencias faltantes del package.json original)

**[REFACTOR] Navegación y rutas**
- `frontend/src/App.js` — nueva ruta `/dashboard`; raíz `/` redirige a `/dashboard`; ruta `/settings` (pública) eliminada
- `frontend/src/components/Layout.js` — link "Dashboard" en navbar; logo redirige a `/dashboard`; botón "Salir" con estilo `btn-outline-light`

**[FIXED] `CuentasPage.js` y `CuentasAPI.js`**
- El formulario pedía "Número de Cuenta" (requerido) pero el backend lo auto-genera desde Sprint B. Cambiado a campo "Nombre" opcional
- `crearCuenta` y `eliminarCuenta` pasaban `Authorization: Bearer undefined` al incluir un parámetro `token` nunca provisto. Eliminados los headers manuales; el interceptor ya los gestiona
- Interceptor de `CuentasAPI.js` actualizado para limpiar sesión y redirigir a `/login` si el refresh falla (consistente con `UsuariosAPI.js`)

---

## Sprint B — Calidad y robustez

### Backend

**[FIXED] Bug crítico: `POST /api/transacciones/` devolvía 405**
- `transacciones/urls.py` — `ListarTransaccionesView` estaba mapeada a `path('')` antes del router, interceptando todos los POST. Eliminada la ruta duplicada; el `TransactionViewSet` (router) gestiona tanto GET como POST

**[FIXED] Bug crítico: saldo insuficiente devolvía HTTP 201**
- `transacciones/views.py` — `TransactionViewSet.perform_create` hacía `return Response(...)` que DRF ignora. Cambiado a `raise ValidationError(...)` para devolver correctamente HTTP 400

**[FIXED] Bugs en `CreateTransaccionView`**
- `from_account.balance` → `from_account.saldo`
- `id_usuario=request.user` → `user=request.user`
- `ubicacion=...` → `transa_ubicacion=...`
- Envuelto en `db_transaction.atomic()` para garantizar atomicidad

**[FIXED] Bug: cuentas creadas sin `account_number`**
- `AccountSerializer` tiene `account_number` como `read_only`. Al crear sin generarlo, el campo quedaba vacío y fallaba el `UNIQUE` desde la segunda cuenta
- `accounts/views.py` — `_generate_account_number()` genera `ACC-{10 hex chars}` en `AccountViewSet.perform_create` y `CrearCuentaView`

**[SECURITY] MFA para transferencias > $500 — end-to-end**
- `transacciones/views.py` — `_check_mfa_if_required()` verifica `mfa_code` en `TransactionViewSet.perform_create` (el endpoint real que usa el frontend)

**[ADDED] Logging de auditoría (`securabank.audit`)**
- `backend/settings.py` — configuración `LOGGING` con `RotatingFileHandler` (10 MB × 5 archivos) en `src/logs/audit.log`
- `users/utils.py` — `get_client_ip(request)` extrae IP real considerando proxies (`X-Forwarded-For`)
- `users/views.py` — registra `LOGIN_SUCCESS/FAILED/BLOCKED`, `MFA_SUCCESS/FAILED/BLOCKED`, `LOGOUT`, `PASSWORD_RESET_REQUEST/CONFIRM`
- `accounts/views.py` — registra `ACCOUNT_CREATED`, `ACCOUNT_DELETED`
- `transacciones/views.py` — registra `TRANSFER`, `TRANSFER_FAILED` (con razón e IP)

**[SECURITY] `UserDetailView` — control de acceso**
- `users/views.py` — `get_object()` lanza `PermissionDenied` (HTTP 403) si el ID solicitado no coincide con el usuario del token

**[ADDED] Tests unitarios e integración**
- `users/tests.py` — 20 tests: `RegisterTests`, `LoginTests`, `LogoutTests`, `MFATests`, `GetUserTests`, `UserDetailTests`
- `accounts/tests.py` — 9 tests: `AccountSignalTests`, `AccountAccessTests`, `AccountCRUDTests`
- `transacciones/tests.py` — 12 tests: `TransactionViewSetTests`

### Frontend

**[FIXED] MFA para transferencias > $500**
- `TransactionPage.js` — campo de código MFA aparece dinámicamente cuando `monto > 500`; se envía `mfa_code` en el payload solo cuando es necesario; saldo de la cuenta se actualiza tras transferencia exitosa

---

## Sprint A — Seguridad base (OWASP)

### Backend

**[SECURITY] Credenciales movidas a `.env`**
- `backend/settings.py` — `SECRET_KEY = config('SECRET_KEY')` sin valor por defecto (Django falla explícitamente si no existe)
- `backend/settings.py` — `EMAIL_HOST_PASSWORD = config('SENDGRID_API_KEY')`
- `src/.env` — añadidas variables: `SECRET_KEY` (70 chars aleatorios), `SENDGRID_API_KEY`, `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`

**[SECURITY] CORS restrictivo**
- `backend/settings.py` — `CORS_ALLOW_ALL_ORIGINS = False`; `CORS_ALLOWED_ORIGINS` leído desde `.env`

**[SECURITY] Headers HTTP de seguridad**
- `SECURE_CONTENT_TYPE_NOSNIFF = True` → `X-Content-Type-Options: nosniff`
- `X_FRAME_OPTIONS = 'DENY'` → `X-Frame-Options: DENY`
- `SECURE_BROWSER_XSS_FILTER = True`
- `SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'`
- `SESSION_COOKIE_HTTPONLY = True`, `CSRF_COOKIE_HTTPONLY = True` (siempre)
- `SECURE_SSL_REDIRECT`, `SECURE_HSTS_SECONDS = 31536000`, cookies `Secure` — activos solo cuando `DEBUG=False`

**[SECURITY] Rate limiting en password-reset**
- `users/views.py` — `PasswordResetRequestView` aplica el mismo control de intentos que login y MFA (3 intentos / 5 min)

**[SECURITY] `UserDetailView` — acceso solo al propio usuario**
- `users/views.py` — `get_object()` lanza `PermissionDenied` (HTTP 403) si el ID no coincide

**[FIXED] `resend_mfa_code` eliminado**
- `users/views.py` — vista eliminada: filtraba `confirmed=True` y luego chequeaba `not device.confirmed`, condición imposible
- `users/urls.py` — ruta `mfa/resend/` eliminada

**[ADDED] Endpoint `GET /api/users/get-user/`**
- `users/views.py` — `get_user()` retorna datos del usuario autenticado
- `users/urls.py` — ruta registrada

**[FIXED] `TokenAuthentication` eliminado de `REST_FRAMEWORK`**
- Solo se usa `JWTAuthentication`

### Frontend

**[FIXED] `UserSettings.js` — ID de usuario hardcodeado**
- Reemplazado `API.get('/users/1/')` por `API.get('/get-user/')` usando `AuthContext` para el ID real del token (`authUser.user_id`)
- `handleUpdate` usa `PATCH` en lugar de `PUT`

**[FIXED] `UsuariosAPI.js` — logout al fallar el refresh**
- Interceptor ahora limpia `localStorage` y redirige a `/login` cuando el refresh token falla; también persiste el nuevo refresh token si el backend lo rota

**[FIXED] `AuthContext.js` — dependencias de `useEffect`**
- Array de dependencias corregido a `[authTokens]`; antes era la llamada sin cerrar (`)` en lugar de `), [authTokens]`)
