# SecuraBank — Contexto para Claude Code

## Qué es este proyecto

Sistema bancario seguro (SGT) desarrollado como proyecto académico en la ESPOCH para la asignatura Aplicaciones Informáticas 2. El objetivo es demostrar cumplimiento OWASP Top 10 en una aplicación fullstack real.

**Autor:** Jonathan David Aucancela Maguana (6856)

---

## Cómo está organizado

El código fuente está en `src/` dentro del repositorio raíz.

```
SecuraBank/
├── .gitignore
├── CLAUDE.md          ← este archivo
├── README.md          ← documentación completa del proyecto
├── CHANGELOG.md       ← historial de cambios por sprint
└── src/
    ├── manage.py
    ├── .env                    ← variables de entorno (no subir a git)
    ├── backend/                ← settings.py, urls.py, requirements.txt
    ├── accounts/               ← app cuentas bancarias
    ├── users/                  ← app autenticación, MFA, usuarios
    ├── transacciones/          ← app transferencias, dashboard
    ├── logs/                   ← audit.log (generado en ejecución)
    └── frontend/               ← React SPA (src/ contiene el código)
```

## Cómo arrancar el proyecto

### Base de datos (Docker)

```bash
docker start securabank-db
# Si no existe aún:
docker run -d --name securabank-db \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=admin \
  -e POSTGRES_DB=dbSGT -p 5434:5432 postgres:15
```

### Backend (desde la raíz del repo)

```bash
source src/env_mac/bin/activate
cd src && python3 manage.py runserver   # http://localhost:8000
```

### Frontend (desde src/frontend/)

```bash
cd src/frontend && npm start            # http://localhost:3001
```

> El frontend corre en **3001**, no en 3000. Puerto 3000 está ocupado por otro contenedor Docker.

### Tests

```bash
source src/env_mac/bin/activate
cd src && python3 manage.py test        # 48 tests — OK
```

### Venv macOS

El venv de Windows (`src/env/`) no funciona en Mac. Usar `src/env_mac/`:
```bash
python3 -m venv src/env_mac
source src/env_mac/bin/activate
pip install -r src/backend/requirements.txt
```

## Variables de entorno importantes (src/.env)

- `SECRET_KEY` — clave Django
- `DEBUG` — `True` en dev, `False` en producción
- `SENDGRID_API_KEY` — para envío de emails
- `FRONTEND_URL=http://localhost:3001` — URL base del frontend
- `CORS_ALLOWED_ORIGINS=http://localhost:3001` — orígenes CORS permitidos
- `DB_*` — configuración PostgreSQL (host: localhost, port: 5434)

## URLs clave

- Backend API: `http://localhost:8000/api/`
- Swagger UI: `http://localhost:8000/api/docs/`
- Admin Django: `http://localhost:8000/admin/`
- Frontend: `http://localhost:3001/`

## Convenciones del proyecto

### Backend (Django)
- Modelos: nombres en inglés (`Account`, `Transaction`, `LoginAttempt`)
- Campos en español: `saldo`, `estado`, `fecha`, `moneda`, `transa_ubicacion`
- Validaciones de negocio en las vistas (no en serializers)
- Rate limiting manual via `LoginAttempt` model (3 intentos / 5 min)
- Logging de auditoría: `logging.getLogger('securabank.audit')`
- Transacciones de DB: siempre usar `db_transaction.atomic()` en transferencias

### Frontend (React)
- Contexto global de auth: `src/frontend/src/context/AuthContext.js`
- APIs separadas por dominio: `UsuariosAPI.js`, `CuentasAPI.js`, `TransaccionesAPI.js`, `DashboardAPI.js`
- Alertas: SweetAlert2
- Estilos: Bootstrap 5 únicamente (sin CSS custom salvo inline styles puntuales)
- Rutas protegidas con `PrivateRoute`
- Color corporativo: `#006666` (teal oscuro)

## Estado actual del proyecto (después de Sprint D)

### Funcionalidades completas
- Registro/Login/Logout con JWT (access 5min, refresh 1día, rotation + blacklist)
- MFA TOTP (Google Authenticator, Authy) con bloqueo tras 3 intentos
- Recuperación de contraseña por email (SendGrid)
- CRUD de cuentas bancarias (account_number auto-generado, vista en cards)
- Transferencias a cuentas propias o de otros usuarios por número de cuenta
- MFA requerido para transferencias > $500
- Historial de transferencias con dirección (enviada/recibida) y montos formateados
- Dashboard con gráficas (recharts) y resumen financiero
- Email de confirmación tras cada transferencia
- Auditoría completa en `logs/audit.log`
- Documentación API en `/api/docs/` (Swagger) y `/api/redoc/` (ReDoc)
- 48 tests unitarios e integración (todos en verde)
- Feedback visual en UserSettings al guardar/fallar

### Bugs conocidos (pendientes)
- `AllAccountsView` (`GET /api/accounts/all-accounts/`) expone todas las cuentas del sistema — debería eliminarse o reemplazarse por el endpoint `lookup/`
- `TransactionSerializer` incluye `user` (ID del usuario) como campo expuesto — considerar excluirlo
- No hay paginación en el historial de transacciones — podría ser lento con muchas entradas

### Próximos pasos posibles
- Eliminar o restringir `AllAccountsView` (reemplazar con `lookup/`)
- Paginación en historial de transacciones
- Búsqueda y filtros en historial (por fecha, monto, cuenta)
- Exportación de estado de cuenta en PDF
- 2FA backup codes (códigos de recuperación MFA)
- Deploy en Railway/Render con PostgreSQL en la nube

## Dependencias importantes

### Backend
```
drf-spectacular    # Swagger/OpenAPI
django-otp         # TOTP MFA
djangorestframework-simplejwt  # JWT
django-cors-headers
python-decouple    # .env management
psycopg2-binary    # PostgreSQL driver
dj-database-url    # Para deploy en nube (Railway)
```

### Frontend
```
recharts           # Gráficas del dashboard
sweetalert2        # Alertas y confirmaciones
jwt-decode         # Decodificar tokens en el cliente
qrcode.react       # Generar QR para MFA setup
zxcvbn             # Validación de fortaleza de contraseña
axios              # HTTP client con interceptores
react-hook-form    # Formularios
```

## Notas OWASP

El proyecto fue construido iterativamente priorizando seguridad:
- **Sprint A:** configuración segura, headers HTTP, CORS, credenciales en .env
- **Sprint B:** tests, logging, bugs de lógica de negocio, control de acceso
- **Sprint C:** documentación API, dashboard, notificaciones por email
- **Sprint D:** transferencias a terceros con lookup seguro, rediseño UI, .gitignore

Ver `CHANGELOG.md` para el detalle completo de cada cambio y su justificación de seguridad.
