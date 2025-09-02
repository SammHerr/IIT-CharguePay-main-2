# Sistema de Gestión Educativa

Un sistema completo para la gestión de cobranza y control de alumnos en instituciones educativas, desarrollado con Next.js 15, TypeScript, MySQL y Firebase.

## 🚀 Características Principales

### 📊 Dashboard Interactivo
- Métricas en tiempo real de alumnos y cobranza
- Estadísticas de pagos y morosidad
- Gráficos y visualizaciones de datos
- Resumen ejecutivo del estado financiero

### 👥 Gestión de Alumnos
- Registro completo de estudiantes
- Control de planes educativos
- Seguimiento de vigencias y extensiones
- Historial académico y de pagos
- Gestión de documentos y archivos

### 💰 Control de Pagos
- Registro de pagos con múltiples formas
- Cálculo automático de moratorios
- Generación de recibos digitales
- Control de descuentos y promociones
- Seguimiento de pagos vencidos

### 📈 Cobranza Automatizada
- Lista de cobranza mensual
- Identificación automática de morosos
- Cálculo dinámico de recargos
- Herramientas de seguimiento
- Reportes de efectividad

### 📋 Reportes Avanzados
- Reportes de cobranza por período
- Análisis de morosidad
- Estadísticas de alumnos
- Reportes financieros
- Exportación a PDF y Excel

## 🛠 Tecnologías Utilizadas

### Frontend
- **Next.js 15** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework de estilos
- **shadcn/ui** - Componentes de interfaz
- **Lucide React** - Iconografía

### Backend
- **Next.js API Routes** - Endpoints RESTful
- **MySQL 8.0** - Base de datos relacional
- **Zod** - Validación de esquemas
- **Firebase Storage** - Almacenamiento de archivos

### Herramientas de Desarrollo
- **ESLint** - Linting de código
- **Prettier** - Formateo de código
- **TypeScript** - Verificación de tipos

## 📦 Instalación

### Prerrequisitos
- Node.js 18+ 
- MySQL 8.0+
- npm o yarn

### 1. Clonar el repositorio
\`\`\`bash
git clone https://github.com/tu-usuario/sistema-gestion-educativa.git
cd sistema-gestion-educativa
\`\`\`

### 2. Instalar dependencias
\`\`\`bash
npm install
\`\`\`

### 3. Configurar variables de entorno
\`\`\`bash
cp .env.example .env.local
\`\`\`

Editar `.env.local` con tus credenciales:
\`\`\`env
# Base de datos MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=sistema_educativo

# Firebase (opcional)
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
\`\`\`

### 4. Configurar base de datos
\`\`\`bash
# Crear base de datos y tablas
mysql -u root -p < scripts/complete-database-setup.sql

# Verificar instalación
mysql -u root -p < scripts/verify-installation.sql

# Insertar datos de ejemplo (opcional)
mysql -u root -p < scripts/sample-data.sql
\`\`\`

### 5. Ejecutar en desarrollo
\`\`\`bash
npm run dev
\`\`\`

La aplicación estará disponible en `http://localhost:3000`

## 🗄 Estructura de la Base de Datos

### Tablas Principales
- **usuarios** - Gestión de usuarios del sistema
- **planes** - Planes educativos disponibles
- **alumnos** - Información de estudiantes
- **mensualidades** - Control de pagos mensuales
- **pagos** - Registro de transacciones
- **configuracion** - Configuraciones del sistema
- **notificaciones** - Sistema de alertas

### Características de la BD
- Triggers automáticos para generar mensualidades
- Eventos programados para actualizar vencimientos
- Vistas optimizadas para reportes
- Sistema de auditoría completo
- Índices optimizados para consultas

## 🔌 API Endpoints

### Alumnos
\`\`\`
GET    /api/alumnos              # Listar alumnos con filtros
POST   /api/alumnos              # Crear nuevo alumno
GET    /api/alumnos/[id]         # Obtener alumno específico
PUT    /api/alumnos/[id]         # Actualizar alumno
DELETE /api/alumnos/[id]         # Eliminar alumno (soft delete)
GET    /api/alumnos/[id]/mensualidades # Mensualidades del alumno
\`\`\`

### Pagos
\`\`\`
GET    /api/pagos                # Listar pagos con filtros
POST   /api/pagos                # Registrar nuevo pago
GET    /api/pagos/[id]           # Obtener pago específico
PUT    /api/pagos/[id]/cancelar  # Cancelar pago
\`\`\`

### Dashboard y Reportes
\`\`\`
GET    /api/dashboard            # Métricas del dashboard
GET    /api/reportes             # Reportes dinámicos
GET    /api/planes               # Planes disponibles
GET    /api/configuracion        # Configuraciones del sistema
\`\`\`

## 🎨 Componentes de UI

### Componentes Principales
- **Dashboard** - Panel principal con métricas
- **StudentsList** - Lista de alumnos con filtros
- **PaymentForm** - Formulario de registro de pagos
- **CollectionList** - Lista de cobranza mensual
- **ReportsGenerator** - Generador de reportes

### Hooks Personalizados
- **useApi** - Hook genérico para llamadas API
- **useCrud** - Hook para operaciones CRUD
- **useAlumnos** - Hook específico para alumnos
- **usePagos** - Hook específico para pagos
- **useToast** - Sistema de notificaciones

## 📊 Funcionalidades Avanzadas

### Cálculo Automático de Moratorios
- Configuración flexible de porcentajes
- Cálculo diario automático
- Aplicación retroactiva
- Exención manual por casos especiales

### Sistema de Notificaciones
- Alertas de pagos vencidos
- Recordatorios de vencimientos próximos
- Notificaciones de graduación
- Sistema de comunicación automática

### Reportes Dinámicos
- Filtros avanzados por fecha, plan, alumno
- Exportación a múltiples formatos
- Gráficos interactivos
- Análisis de tendencias

### Gestión de Archivos
- Subida de documentos por alumno
- Almacenamiento en Firebase Storage
- Organización automática por carpetas
- Control de versiones de documentos

## 🔒 Seguridad

### Validación de Datos
- Validación con Zod en frontend y backend
- Sanitización de inputs
- Prevención de inyección SQL
- Validación de tipos TypeScript

### Control de Acceso
- Sistema de roles y permisos
- Autenticación JWT (preparado)
- Middleware de autorización
- Logs de auditoría

## 🚀 Despliegue

### Vercel (Recomendado)
\`\`\`bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel --prod
\`\`\`

### Docker
\`\`\`bash
# Construir imagen
docker build -t sistema-educativo .

# Ejecutar contenedor
docker run -p 3000:3000 sistema-educativo
\`\`\`

### Variables de Entorno en Producción
Configurar en tu plataforma de despliegue:
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- Variables de Firebase si se usa almacenamiento

## 🧪 Testing

\`\`\`bash
# Ejecutar tests unitarios
npm run test

# Tests de integración
npm run test:integration

# Coverage
npm run test:coverage
\`\`\`

## 📈 Roadmap

### Versión 2.0
- [ ] Autenticación con NextAuth.js
- [ ] Sistema de roles avanzado
- [ ] API REST completa
- [ ] Aplicación móvil con React Native
- [ ] Integración con sistemas de pago

### Versión 2.1
- [ ] Inteligencia artificial para predicción de morosidad
- [ ] Dashboard ejecutivo avanzado
- [ ] Sistema de comunicación automática
- [ ] Integración con contabilidad

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👥 Equipo

- **Desarrollador Principal** - [Tu Nombre](https://github.com/tu-usuario)
- **Diseño UI/UX** - [Diseñador](https://github.com/diseñador)
- **QA Testing** - [Tester](https://github.com/tester)

## 📞 Soporte

- 📧 Email: soporte@sistema-educativo.com
- 💬 Discord: [Servidor de Discord](https://discord.gg/tu-servidor)
- 📖 Documentación: [Wiki del Proyecto](https://github.com/tu-usuario/sistema-gestion-educativa/wiki)

---

⭐ Si este proyecto te ha sido útil, ¡no olvides darle una estrella!

# API REST - Sistema de Gestión Educativa

API REST completa para el sistema de gestión educativa, desarrollada con Node.js, Express, TypeScript y MySQL.

## 🚀 Características

### 🔐 Autenticación y Autorización
- JWT para autenticación
- Sistema de roles (admin, coordinador, cajero)
- Middleware de autorización
- Rate limiting para seguridad

### 📊 Endpoints Principales
- **Alumnos** - CRUD completo con filtros avanzados
- **Pagos** - Gestión de transacciones y recibos
- **Planes** - Administración de planes educativos
- **Dashboard** - Métricas y estadísticas
- **Reportes** - Generación de reportes dinámicos
- **Configuración** - Gestión de configuraciones del sistema

### 🛡️ Seguridad
- Validación de datos con Zod
- Sanitización de inputs
- Headers de seguridad con Helmet
- CORS configurado
- Rate limiting
- Manejo seguro de errores

## 📦 Instalación

### Prerrequisitos
- Node.js 18+
- MySQL 8.0+
- npm o yarn

### 1. Clonar repositorio
\`\`\`bash
git clone https://github.com/tu-usuario/student-management-api.git
cd student-management-api
\`\`\`

### 2. Instalar dependencias
\`\`\`bash
npm install
\`\`\`

### 3. Configurar variables de entorno
\`\`\`bash
cp .env.example .env
\`\`\`

Editar `.env`:
\`\`\`env
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=sistema_educativo
JWT_SECRET=tu_jwt_secret_muy_seguro
FRONTEND_URL=http://localhost:3000
\`\`\`

### 4. Configurar base de datos
\`\`\`bash
# Ejecutar scripts de base de datos del proyecto principal
mysql -u root -p < ../student-management-app/scripts/complete-database-setup.sql
\`\`\`

### 5. Ejecutar en desarrollo
\`\`\`bash
npm run dev
\`\`\`

La API estará disponible en `http://localhost:3001`

## 📚 Documentación de la API

### Autenticación

#### POST /api/auth/login
Iniciar sesión
\`\`\`json
{
  "email": "admin@example.com",
  "password": "password123"
}
\`\`\`

#### POST /api/auth/register
Registrar usuario (solo admin)
\`\`\`json
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "rol": "coordinador"
}
\`\`\`

### Alumnos

#### GET /api/alumnos
Listar alumnos con filtros
\`\`\`
GET /api/alumnos?page=1&limit=10&search=maria&estatus=activo
\`\`\`

#### POST /api/alumnos
Crear nuevo alumno
\`\`\`json
{
  "nombre": "María",
  "apellido_paterno": "González",
  "apellido_materno": "López",
  "telefono": "555-1234",
  "email": "maria@example.com",
  "plan_id": 1,
  "fecha_inscripcion": "2024-01-15",
  "fecha_inicio": "2024-01-20"
}
\`\`\`

#### GET /api/alumnos/:id
Obtener alumno específico

#### PUT /api/alumnos/:id
Actualizar alumno

#### DELETE /api/alumnos/:id
Eliminar alumno (soft delete)

### Pagos

#### GET /api/pagos
Listar pagos con filtros
\`\`\`
GET /api/pagos?alumno_id=1&tipo_pago=mensualidad&fecha_desde=2024-01-01
\`\`\`

#### POST /api/pagos
Registrar nuevo pago
\`\`\`json
{
  "alumno_id": 1,
  "tipo_pago": "mensualidad",
  "concepto": "Pago mensualidad enero",
  "monto": 1500,
  "moratorio": 0,
  "forma_pago": "efectivo",
  "fecha_pago": "2024-01-15"
}
\`\`\`

### Dashboard

#### GET /api/dashboard
Obtener métricas del dashboard
\`\`\`json
{
  "success": true,
  "data": {
    "estadisticas": {
      "alumnos_activos": 198,
      "ingresos_mes_actual": 45000,
      "mensualidades_vencidas": 12
    },
    "pagosRecientes": [...],
    "alumnosEnMora": [...]
  }
}
\`\`\`

### Reportes

#### GET /api/reportes
Generar reportes dinámicos
\`\`\`
GET /api/reportes?tipo_reporte=cobranza&periodo=2024-01
GET /api/reportes?tipo_reporte=morosidad
GET /api/reportes?tipo_reporte=alumnos&plan_id=1
\`\`\`

## 🔧 Estructura del Proyecto

\`\`\`
src/
├── config/
│   └── database.ts          # Configuración de base de datos
├── middleware/
│   ├── auth.ts              # Autenticación JWT
│   ├── errorHandler.ts      # Manejo de errores
│   ├── notFound.ts          # 404 handler
│   └── rateLimiter.ts       # Rate limiting
├── routes/
│   ├── auth.ts              # Rutas de autenticación
│   ├── alumnos.ts           # Rutas de alumnos
│   ├── pagos.ts             # Rutas de pagos
│   ├── planes.ts            # Rutas de planes
│   ├── dashboard.ts         # Rutas de dashboard
│   ├── reportes.ts          # Rutas de reportes
│   └── configuracion.ts     # Rutas de configuración
├── validations/
│   └── schemas.ts           # Esquemas de validación Zod
├── utils/
│   └── helpers.ts           # Funciones auxiliares
├── types/
│   └── index.ts             # Tipos TypeScript
└── server.ts                # Servidor principal
\`\`\`

## 🛠️ Scripts Disponibles

\`\`\`bash
# Desarrollo con hot reload
npm run dev

# Compilar TypeScript
npm run build

# Ejecutar en producción
npm start

# Linting
npm run lint

# Tests
npm test
npm run test:watch

# Migraciones de BD
npm run db:migrate
npm run db:seed
\`\`\`

## 🔒 Seguridad

### Headers de Seguridad
- Helmet.js para headers HTTP seguros
- CORS configurado para frontend específico
- Rate limiting (100 requests/15min por IP)

### Validación
- Zod para validación de esquemas
- Sanitización de inputs
- Validación de tipos TypeScript

### Autenticación
- JWT con expiración de 24h
- Contraseñas hasheadas con bcrypt
- Middleware de autorización por roles

## 📊 Monitoreo y Logs

### Logging
- Morgan para logs HTTP
- Console logs estructurados
- Logs de errores detallados en desarrollo

### Health Check
\`\`\`
GET /health
\`\`\`
Respuesta:
\`\`\`json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
\`\`\`

## 🚀 Despliegue

### Variables de Entorno en Producción
\`\`\`env
NODE_ENV=production
PORT=3001
DB_HOST=tu_host_mysql
DB_USER=tu_usuario
DB_PASSWORD=tu_password_seguro
JWT_SECRET=tu_jwt_secret_muy_largo_y_seguro
FRONTEND_URL=https://tu-frontend.com
\`\`\`

### Docker
\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["node", "dist/server.js"]
\`\`\`

### PM2 (Recomendado para producción)
\`\`\`bash
# Instalar PM2
npm install -g pm2

# Ejecutar con PM2
pm2 start dist/server.js --name "student-api"

# Configurar auto-restart
pm2 startup
pm2 save
\`\`\`

## 🧪 Testing

### Estructura de Tests
\`\`\`
tests/
├── unit/
│   ├── utils.test.ts
│   └── validations.test.ts
├── integration/
│   ├── auth.test.ts
│   ├── alumnos.test.ts
│   └── pagos.test.ts
└── setup.ts
\`\`\`

### Ejecutar Tests
\`\`\`bash
# Tests unitarios
npm test

# Tests con coverage
npm run test:coverage

# Tests en modo watch
npm run test:watch
\`\`\`

## 📈 Performance

### Optimizaciones
- Pool de conexiones MySQL
- Índices optimizados en BD
- Paginación en todas las listas
- Rate limiting para prevenir abuso
- Compresión gzip (en producción)

### Métricas
- Tiempo de respuesta promedio: <100ms
- Throughput: 1000+ requests/min
- Memoria: ~50MB en idle

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📝 Licencia

MIT License - ver archivo `LICENSE` para detalles.

## 📞 Soporte

- 📧 Email: api-support@sistema-educativo.com
- 📖 Documentación: [API Docs](https://api-docs.sistema-educativo.com)
- 🐛 Issues: [GitHub Issues](https://github.com/tu-usuario/student-management-api/issues)

---

⭐ Si esta API te ha sido útil, ¡dale una estrella al repositorio!
