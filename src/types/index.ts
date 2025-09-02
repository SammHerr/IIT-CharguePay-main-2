export interface Usuario {
  id: number
  nombre: string
  email: string
  password?: string
  rol: 'admin' | 'coordinador' | 'cajero'
  activo: boolean
  ultimo_acceso?: string
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface Plan {
  id: number
  nombre: string
  descripcion?: string
  numero_mensualidades: number
  precio_mensualidad: number
  precio_inscripcion: number
  vigencia_meses: number
  extension_meses: number
  activo: boolean
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface Alumno {
  id: number
  matricula: string
  nombre: string
  apellido_paterno: string
  apellido_materno?: string
  fecha_nacimiento?: string
  genero?: 'M' | 'F' | 'Otro'
  telefono?: string
  email?: string
  direccion?: string
  ciudad?: string
  estado?: string
  codigo_postal?: string
  contacto_emergencia?: string
  telefono_emergencia?: string
  relacion_emergencia?: string
  fecha_inscripcion: string
  fecha_inicio: string
  plan_id: number
  fecha_vigencia: string
  fecha_extension?: string
  estatus: 'activo' | 'graduado' | 'baja' | 'suspendido'
  motivo_baja?: string
  notas?: string
  foto_url?: string
  documentos_url?: string[]
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface Pago {
  id: number
  numero_recibo: string
  alumno_id: number
  mensualidad_id?: number
  tipo_pago: 'mensualidad' | 'inscripcion' | 'moratorio' | 'extension' | 'otro'
  concepto: string
  monto: number
  descuento: number
  moratorio: number
  total: number
  forma_pago: 'efectivo' | 'transferencia' | 'tarjeta_debito' | 'tarjeta_credito' | 'cheque'
  referencia?: string
  banco?: string
  fecha_pago: string
  fecha_vencimiento?: string
  dias_retraso: number
  usuario_id: number
  observaciones?: string
  comprobante_url?: string
  estatus: 'activo' | 'cancelado'
  fecha_cancelacion?: string
  motivo_cancelacion?: string
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface AlumnoFilters extends PaginationParams {
  estatus?: string
  plan_id?: number
  fecha_inicio_desde?: string
  fecha_inicio_hasta?: string
}

export interface PagoFilters extends PaginationParams {
  alumno_id?: number
  tipo_pago?: string
  forma_pago?: string
  estatus?: string
  fecha_desde?: string
  fecha_hasta?: string
}
