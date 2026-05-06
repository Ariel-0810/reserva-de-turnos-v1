# AgendUp - Sistema de Reservas para Negocios

Plataforma completa para gestionar reservas y turnos de tu negocio construida con Next.js 14, TypeScript y Sequelize.

## 🚀 Características

- **Gestión de Reservas**: Sistema completo de reservas con confirmación automática
- **Dashboard de Negocio**: Panel de control para gestionar servicios, horarios y reservas
- **Panel de Administrador**: Vista administrativa para supervisar todos los negocios
- **Autenticación**: Login con credenciales o Google OAuth
- **Notificaciones por Email**: Confirmaciones y recordatorios automáticos
- **WhatsApp Integration**: Notificaciones por WhatsApp (opcional)
- **Multi-tenant**: Soporte para múltiples negocios en una sola instancia

## 📋 Requisitos Previos

- Node.js 18.x o superior
- PostgreSQL 12 o superior
- Cuenta en [Resend](https://resend.com) para envío de emails

## 🛠️ Instalación

1. **Clonar el repositorio y navegar al directorio**

```bash
cd nextjs_space
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

Copia el archivo `.env.example` y renómbralo a `.env`, luego configura las variables:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales:

```env
# Base de datos PostgreSQL
DATABASE_URL='postgresql://usuario:contraseña@host:puerto/basedatos?sslmode=require'

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET="clave-secreta-aleatoria"

# Resend (para envío de emails)
RESEND_API_KEY="tu-clave-api-de-resend"

# Google OAuth (Opcional)
GOOGLE_CLIENT_ID="tu-client-id"
GOOGLE_CLIENT_SECRET="tu-client-secret"

# Twilio WhatsApp (Opcional)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_WHATSAPP_NUMBER=""
```

4. **Inicializar la base de datos**

El script de seed creará las tablas y datos iniciales:

```bash
npm run seed
```

Esto creará:
- Un usuario SUPERADMIN
- Un usuario de prueba con su negocio
- Servicios de ejemplo

## 🚦 Uso

### Modo Desarrollo

```bash
npm run dev
```

El servidor estará disponible en [http://localhost:3000](http://localhost:3000)

### Compilar para Producción

```bash
npm run build
npm start
```

### Ejecutar Linter

```bash
npm run lint
```

## 👥 Credenciales de Acceso

Después de ejecutar el seed, puedes iniciar sesión con:

### SUPERADMIN
- **Email**: g.a.gomez2016@gmail.com
- **Contraseña**: Mi@081013.
- **Acceso**: Panel de administración en `/admin`

### DEMO BUSINESS OWNER
- **Email**: demo@business.com
- **Contraseña**: Demo123!
- **Acceso**: Dashboard en `/dashboard`
- **Link público**: `/booking/peluqueria-demo`

### TEST USER
- **Email**: john@doe.com
- **Contraseña**: johndoe123
- **Acceso**: Dashboard en `/dashboard`

## 📁 Estructura del Proyecto

```
nextjs_space/
├── app/                      # App router de Next.js
│   ├── api/                  # API routes
│   │   ├── admin/           # Endpoints administrativos
│   │   ├── auth/            # Autenticación
│   │   ├── bookings/        # Gestión de reservas
│   │   ├── business/        # Gestión de negocio
│   │   ├── public/          # Endpoints públicos
│   │   ├── services/        # Gestión de servicios
│   │   └── signup/          # Registro
│   ├── admin/               # Panel de administrador
│   ├── booking/             # Páginas públicas de reserva
│   ├── dashboard/           # Dashboard del negocio
│   ├── login/               # Página de login
│   └── signup/              # Página de registro
├── components/              # Componentes reutilizables
│   └── ui/                  # Componentes de UI (shadcn)
├── lib/                     # Utilidades y configuraciones
│   ├── models/              # Modelos de Sequelize
│   ├── auth-options.ts      # Configuración de NextAuth
│   ├── db.ts                # Configuración de base de datos
│   ├── email.ts             # Servicio de email
│   └── types.ts             # Tipos TypeScript
├── public/                  # Archivos estáticos
└── scripts/                 # Scripts de utilidad
    └── seed.ts              # Script de inicialización
```

## 🔧 Tecnologías Principales

- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Base de Datos**: PostgreSQL con Sequelize ORM
- **Autenticación**: NextAuth.js v4
- **Estilos**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Formularios**: React Hook Form + Zod
- **Emails**: Resend
- **Notificaciones**: React Hot Toast

## 🔐 Seguridad

- Contraseñas hasheadas con bcrypt
- Tokens JWT para sesiones
- Validación de email obligatoria
- Protección de rutas con middleware
- Sanitización de inputs

## 📧 Configuración de Email

El proyecto usa [Resend](https://resend.com) para el envío de emails:

1. Crea una cuenta en [resend.com](https://resend.com)
2. Obtén tu API key
3. Configura `RESEND_API_KEY` en tu archivo `.env`
4. Verifica tu dominio (o usa el dominio de prueba)

## 🌐 Variables de Entorno

| Variable | Descripción | Requerido |
|----------|-------------|-----------|
| `DATABASE_URL` | URL de conexión a PostgreSQL | Sí |
| `NEXTAUTH_URL` | URL base de la aplicación | Sí |
| `NEXTAUTH_SECRET` | Secret para NextAuth | Sí |
| `RESEND_API_KEY` | API key de Resend | Sí |
| `GOOGLE_CLIENT_ID` | Client ID de Google OAuth | No |
| `GOOGLE_CLIENT_SECRET` | Secret de Google OAuth | No |
| `TWILIO_ACCOUNT_SID` | SID de Twilio | No |
| `TWILIO_AUTH_TOKEN` | Token de Twilio | No |
| `TWILIO_WHATSAPP_NUMBER` | Número de WhatsApp | No |

## 🐛 Solución de Problemas

### Error de conexión a la base de datos

Verifica que:
- PostgreSQL esté ejecutándose
- Las credenciales en `DATABASE_URL` sean correctas
- El usuario tenga permisos de creación de tablas

### El servidor no inicia

- Ejecuta `npm install` para asegurar que todas las dependencias estén instaladas
- Verifica que el puerto 3000 esté disponible
- Revisa los logs para errores específicos

### Errores de TypeScript

```bash
# Limpia la caché de Next.js
rm -rf .next

# Reconstruye
npm run build
```

## 📝 Scripts NPM

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Compila la aplicación para producción
- `npm start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter
- `npm run seed` - Ejecuta el script de inicialización de DB

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y confidencial.

## 📞 Soporte

Para soporte y consultas, contacta al equipo de desarrollo.

---

Desarrollado con ❤️ por el equipo de AgendUp
