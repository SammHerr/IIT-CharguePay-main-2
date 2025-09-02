import { z } from 'zod'

// Esquemas de autenticación
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
})

export const registerSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rol: z.enum(['admin', 'coordinador', 'cajero']).optional()
})

// Esquemas de alumnos
export const alumnoSchema = z.object({
  matricula: z.string().optional(),
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido_paterno: z.string().min(1, 'El apellido paterno es requerido'),
  apellido_materno: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
  genero: z.enum(['M', 'F', 'Otro']).optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  direccion: z.string().optional(),
  ciudad: z.string().optional(),
  estado: z.string().optional(),
  codigo_postal: z.string().optional(),
  contacto_emergencia: z.string().optional(),
  telefono_emergencia: z.string().optional(),
  relacion_emergencia: z.string().optional(),
  fecha_inscripcion: z.string().min(1, 'La fecha de inscripción es requerida'),
  fecha_inicio: z.string().min(1, 'La fecha de inicio es requerida'),
  plan_id: z.number().min(1, 'El plan es requerido'),
  estatus: z.enum(['activo', 'graduado', 'baja', 'suspendido']).default('activo'),
  motivo_baja: z.string().optional(),
  notas: z.string().optional(),
  foto_url: z.string().optional(),
  documentos_url: z.array(z.string()).optional()
})

export const alumnoUpdateSchema = alumnoSchema.partial().omit({ matricula: true })

// Esquemas de pagos
export const pagoSchema = z.object({
  alumno_id: z.number().min(1, 'El alumno es requerido'),
  mensualidad_id: z.number().optional(),
  tipo_pago: z.enum(['mensualidad', 'inscripcion', 'moratorio', 'extension', 'otro']),
  concepto: z.string().min(1, 'El concepto es requerido'),
  monto: z.number().min(0, 'El monto debe ser mayor a 0'),
  descuento: z.number().min(0).default(0),
  moratorio: z.number().min(0).default(0),
  forma_pago: z.enum(['efectivo', 'transferencia', 'tarjeta_debito', 'tarjeta_credito', 'cheque']),
  referencia: z.string().optional(),
  banco: z.string().optional(),
  fecha_pago: z.string().min(1, 'La fecha de pago es requerida'),
  fecha_vencimiento: z.string().optional(),
  observaciones: z.string().optional(),
  comprobante_url: z.string().optional()
})

// Esquemas de filtros
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

export const alumnoFiltersSchema = paginationSchema.extend({
  estatus: z.string().optional(),
  plan_id: z.coerce.number().optional(),
  fecha_inicio_desde: z.string().optional(),
  fecha_inicio_hasta: z.string().optional()
})

export const pagoFiltersSchema = paginationSchema.extend({
  alumno_id: z.coerce.number().optional(),
  tipo_pago: z.string().optional(),
  forma_pago: z.string().optional(),
  estatus: z.string().optional(),
  fecha_desde: z.string().optional(),
  fecha_hasta: z.string().optional()
})
