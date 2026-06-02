# SecuraBank — Contexto para Claude Code

## Qué es este proyecto

Sistema bancario seguro (SGT) desarrollado como proyecto académico en la ESPOCH para la asignatura Aplicaciones Informáticas 2. El objetivo es demostrar cumplimiento OWASP Top 10 en una aplicación fullstack real.

**Autor:** Jonathan David Aucancela Maguana (6856)

---

## Cómo está organizado

El código fuente está en `src/` dentro del repositorio raíz.

```
SecuraBank/
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

```bash
# Backend (desde src/)
python manage.py runserver        # http://localhost:8000

# Frontend (desde src/frontend/)
npm install && npm start           # http://localhost:3000

# Tests
python manage.py test
```

El virtual environment está en `src/env/` pero es un venv de Windows (`.exe`). En macOS hay que crear uno nuevo:
```bash
python3 -m venv src/env_mac && source src/env_mac/bin/activate
pip install -r src/backend/requirements.txt
```

## Variables de entorno importantes (src/.env)

- `SECRET_KEY` — clave Django (generada con `secrets.token_urlsafe(50)`)
- `DEBUG` — `True` en dev, `False` en producción
- `SENDGRID_API_KEY` — para envío de emails
- `FRONTEND_URL` — base URL del frontend (para links en emails de reset)
- `CORS_ALLOWED_ORIGINS` — orígenes permitidos (separados por coma)
- `DB_*` — configuración PostgreSQL

## URLs clave

- API root: `http://localhost:8000/api/`
- Swagger UI: `http://localhost:8000/api/docs/`
- Admin Django: `http://localhost:8000/admin/`
- Frontend: `http://localhost:3000/`

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
- Estilos: Bootstrap 5 únicamente (sin CSS custom salvo inline)
- Rutas protegidas con `PrivateRoute`

## Estado actual del proyecto (después de Sprint C)

### Funcionalidades completas
- Registro/Login/Logout con JWT (access 5min, refresh 1día, rotation + blacklist)
- MFA TOTP (Google Authenticator, Authy) con bloqueo tras 3 intentos
- Recuperación de contraseña por email (SendGrid)
- CRUD de cuentas bancarias (account_number auto-generado)
- Transferencias con validación de saldo + MFA para montos > $500
- Dashboard con gráficas (recharts) y resumen financiero
- Email de confirmación tras cada transferencia
- Auditoría completa en `logs/audit.log`
- Documentación API en `/api/docs/` (Swagger) y `/api/redoc/` (ReDoc)
- 41 tests unitarios e integración

### Bugs conocidos (pendientes)
- `AllAccountsView` expone todas las cuentas del sistema (riesgo de enumeración); debería restringirse o paginarse
- `TransactionSerializer` incluye `user` como campo expuesto (ID del usuario); considerar excluirlo
- El frontend de transacciones solo muestra cuentas del propio usuario como destino; falta opción de transferir a cuentas de otros usuarios por número de cuenta

### Próximos pasos posibles
- Paginación en listados de transacciones y cuentas
- Búsqueda y filtros en historial de transacciones
- Exportación de estado de cuenta en PDF
- 2FA backup codes (códigos de recuperación)
- Deploy en Railway/Render con PostgreSQL en la nube

## Dependencias importantes

### Backend
```
drf-spectacular    # Swagger/OpenAPI
django-otp         # TOTP MFA
djangorestframework-simplejwt  # JWT
django-cors-headers
python-decouple    # .env management
```

### Frontend
```
recharts           # Gráficas del dashboard
sweetalert2        # Alertas y confirmaciones
jwt-decode         # Decodificar tokens en el cliente
qrcode.react       # Generar QR para MFA setup
zxcvbn             # Validación de fortaleza de contraseña
axios              # HTTP client con interceptores
```

## Notas OWASP

El proyecto fue construido iterativamente priorizando seguridad:
- **Sprint A:** configuración segura, headers HTTP, CORS, credenciales en .env
- **Sprint B:** tests, logging, bugs de lógica de negocio, control de acceso
- **Sprint C:** documentación API, dashboard, notificaciones

Ver `CHANGELOG.md` para el detalle completo de cada cambio y su justificación de seguridad.
