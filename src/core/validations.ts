import { z } from 'zod'

// Alumnos
export const alumnoSchema = z.object({
  matricula: z.string().min(1, 'La matrícula es requerida'),
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
  estatus: z.enum(['activo','saldo_pendiente','moratorio','graduado','baja','suspendido']).default('activo'),
  motivo_baja: z.string().optional(),
  notas: z.string().optional(),
  foto_url: z.string().optional(),
  documentos_url: z.array(z.string()).optional()
})
export const alumnoUpdateSchema = alumnoSchema.partial().omit({ matricula: true })

// Pagos
/*
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
})*/

// =======================
// Filtros de pagos
// =======================
/*
const SortDir = z
  .enum(['asc', 'desc'])
  .or(z.enum(['ASC', 'DESC']).transform(v => v.toLowerCase() as 'asc' | 'desc'))

export const pagosFiltersSchema = z.object({
  alumno: z.string().optional(),
  alumno_id: z.coerce.number().int().positive().optional(),
  forma_pago: z
    .enum(['efectivo', 'transferencia', 'tarjeta_debito', 'tarjeta_credito', 'cheque', 'otro'])
    .optional(),
  estatus: z.enum(['activo', 'cancelado']).optional(),
  fecha_ini: z.string().optional(),
  fecha_fin: z.string().optional(),
  sortBy: z.enum(['fecha_pago', 'total', 'id', 'alumno']).default('fecha_pago'),
  sortDir: SortDir.default('desc'), // <<--- acepta ASC/DESC y lo normaliza
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})*/



/* =======================
 * Helpers
 * ======================= */

// Convierte "" → undefined, y recorta espacios en blanco
const emptyToUndef = z
  .string()
  .transform((v) => (typeof v === 'string' ? v.trim() : v))
  .transform((v) => (v === '' ? undefined : v));

/* =======================
 * Pago: create/ajuste
 * ======================= */

export const pagoSchema = z.object({
  alumno_id: z.number().min(1, 'El alumno es requerido'),
  mensualidad_id: z.number().optional(),
  tipo_pago: z.enum(['mensualidad', 'inscripcion', 'moratorio', 'extension', 'otro', 'ajuste']),
  concepto: z.string().min(1, 'El concepto es requerido'),
  monto: z.number().min(0, 'El monto debe ser mayor a 0'),
  descuento: z.number().min(0).default(0),
  moratorio: z.number().min(0).default(0),
  forma_pago: z.enum(['efectivo', 'transferencia', 'tarjeta_debito', 'tarjeta_credito', 'cheque', 'otro']),
  referencia: emptyToUndef.optional(),
  banco: emptyToUndef.optional(),
  fecha_pago: z.string().min(1, 'La fecha de pago es requerida'),
  fecha_vencimiento: emptyToUndef.optional(),
  observaciones: emptyToUndef.optional(),
  comprobante_url: emptyToUndef.optional(),
})

/* =======================
 * Pagos: filtros (GET /api/pagos)
 * ======================= */

// Acepta asc/desc en cualquier mayúscula/minúscula y lo normaliza a minúsculas
const SortDir = z
  .enum(['asc', 'desc'])
  .or(z.enum(['ASC', 'DESC']).transform((v) => v.toLowerCase() as 'asc' | 'desc'));

export const pagosFiltersSchema = z.object({
  alumno: emptyToUndef.optional(),            // "" → undefined
  alumno_id: z.coerce.number().int().positive().optional(),
  forma_pago: z
    .enum(['efectivo', 'transferencia', 'tarjeta_debito', 'tarjeta_credito', 'cheque', 'otro'])
    .optional(),
  estatus: z.enum(['activo', 'cancelado']).optional(),
  fecha_ini: emptyToUndef.optional(),         // "" → undefined
  fecha_fin: emptyToUndef.optional(),         // "" → undefined
  sortBy: z.enum(['fecha_pago', 'total', 'id', 'alumno']).default('fecha_pago'),
  sortDir: SortDir.default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})


// Planes
export const planSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  numero_mensualidades: z.number().min(1, 'El número de mensualidades es requerido'),
  precio_mensualidad: z.number().min(0, 'El precio debe ser mayor a 0'),
  precio_inscripcion: z.number().min(0, 'El precio de inscripción debe ser mayor a 0'),
  vigencia_meses: z.number().min(1).default(12),
  extension_meses: z.number().min(0).default(4),
  activo: z.boolean().default(true)
})

// Configuración
export const configuracionSchema = z.object({
  clave: z.string().min(1, 'La clave es requerida'),
  valor: z.string().min(1, 'El valor es requerido'),
  descripcion: z.string().optional(),
  tipo: z.enum(['string', 'number', 'boolean', 'json', 'date']).default('string'),
  categoria: z.string().default('general'),
  editable: z.boolean().default(true)
})

// Paginación / filtros
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

export const alumnoFiltersSchema = paginationSchema.extend({
  estatus: z.string().optional(),
  plan_id: z.number().optional(),
  fecha_inicio_desde: z.string().optional(),
  fecha_inicio_hasta: z.string().optional()
})

export const pagoFiltersSchema = paginationSchema.extend({
  alumno_id: z.number().optional(),
  tipo_pago: z.string().optional(),
  forma_pago: z.string().optional(),
  estatus: z.string().optional(),
  fecha_desde: z.string().optional(),
  fecha_hasta: z.string().optional()
})

export const reporteFiltersSchema = z.object({
  periodo: z.string().optional(),
  tipo_reporte: z.enum(['resumen', 'cobranza', 'alumnos', 'planes', 'morosidad']).optional(),
  alumno_id: z.number().optional(),
  plan_id: z.number().optional(),
  fecha_desde: z.string().optional(),
  fecha_hasta: z.string().optional()
})
