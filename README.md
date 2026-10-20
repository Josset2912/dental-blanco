# 🦷 Blanco Dental — Sistema de Gestión Clínica

Sistema web completo para la gestión de una clínica dental. Permite administrar pacientes, citas, tratamientos, pagos y generar reportes con estadísticas mensuales.

**Demo:** [dental-blanco-seven.vercel.app](https://dental-blanco-seven.vercel.app)

---

## Características

- **Pacientes** — Registro completo con historial clínico, odontograma interactivo, imágenes radiográficas y notas de evolución
- **Citas** — Agendamiento con control de disponibilidad por doctor y horarios bloqueados
- **Tratamientos** — Seguimiento de tratamientos con estados (En curso / Completado / Anulado), barra de progreso de pago y saldo pendiente
- **Pagos** — Registro vinculado a tratamientos, comprobante en PDF descargable, control por método (Efectivo / Tarjeta / Transferencia)
- **Reportes** — KPIs del mes, ingresos de los últimos 12 meses, balance mensual detallado con selector de mes/año
- **Dashboard** — Resumen ejecutivo con estadísticas en tiempo real
- **Roles** — Admin, Doctor y Recepcionista con autenticación JWT

---

## Stack tecnológico

### Frontend
| Tecnología | Uso |
|---|---|
| React 19 + TypeScript | Interfaz de usuario |
| Vite 8 | Bundler y dev server |
| Tailwind CSS v4 | Estilos |
| TanStack Query v5 | Fetching y caché de datos |
| React Router v7 | Navegación |
| Recharts | Gráficos y reportes |
| Framer Motion | Animaciones de transición |
| jsPDF | Generación de comprobantes PDF |
| XLSX | Exportación a Excel |
| Sonner | Notificaciones toast |
| Axios | Cliente HTTP |

### Backend
| Tecnología | Uso |
|---|---|
| Node.js + Express 5 | API REST |
| Prisma ORM | Acceso a base de datos |
| PostgreSQL | Base de datos |
| JWT + bcryptjs | Autenticación y seguridad |
| Cloudinary | Almacenamiento de imágenes |
| Multer | Manejo de archivos |

---

## Estructura del proyecto

```
dental-blanco/
├── frontend/
│   └── src/
│       ├── api/          # Clientes HTTP por módulo
│       ├── components/   # Componentes reutilizables
│       ├── pages/        # Vistas principales
│       └── utils/        # Helpers (PDF, etc.)
└── backend/
    ├── prisma/
│   │   ├── schema.prisma # Modelos de base de datos
│   │   └── seed.js       # Datos iniciales
    └── src/
        ├── middleware/   # Auth JWT
        └── routes/       # Endpoints por módulo
```

---

## Modelos de datos

```
User         → Doctores, admins y recepcionistas
Patient      → Pacientes activos
Appointment  → Citas médicas
Treatment    → Tratamientos con costo y estado
Payment      → Pagos vinculados a paciente o tratamiento
Odontogram   → Condiciones por diente (JSON)
ClinicalNote → Notas de evolución clínica
PatientImage → Imágenes/radiografías (Cloudinary)
BlockedSlot  → Horarios bloqueados por doctor
```

---

## Instalación local

### Requisitos
- Node.js 18+
- PostgreSQL 14+
- Cuenta en Cloudinary (para imágenes)

### 1. Clonar el repositorio

```bash
git clone https://github.com/Josset2912/dental-blanco.git
cd dental-blanco
```

### 2. Configurar el backend

```bash
cd backend
npm install
```

Crear archivo `.env`:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/dental_blanco"
JWT_SECRET="tu_clave_secreta"
CLOUDINARY_CLOUD_NAME="tu_cloud_name"
CLOUDINARY_API_KEY="tu_api_key"
CLOUDINARY_API_SECRET="tu_api_secret"
PORT=3000
```

Ejecutar migraciones y seed:

```bash
npm run db:migrate
npm run db:seed
```

Iniciar el servidor:

```bash
npm run dev
```

### 3. Configurar el frontend

```bash
cd ../frontend
npm install
```

Crear archivo `.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

Iniciar el servidor de desarrollo:

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

---

## Credenciales de prueba

```
Correo:     doctor@dentalblanco.com
Contraseña: (definida en el seed)
```

---

## Despliegue

| Servicio | Uso |
|---|---|
| **Vercel** | Frontend (React/Vite) — gratis |
| **Railway** | Backend + PostgreSQL — ~$5/mes |

El frontend se despliega automáticamente desde GitHub en cada push a `master`.

---

## Licencia

Proyecto privado — todos los derechos reservados © Blanco Dental
