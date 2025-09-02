// Tipos TypeScript para toda la aplicación
export interface Usuario {
  id: number
  nombre: string
  email: string
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
  // Campos calculados
  plan_nombre?: string
  mensualidades_pagadas?: number
  mensualidades_pendientes?: number
  mensualidades_vencidas?: number
  total_pagado?: number
  saldo_pendiente?: number
  proximo_vencimiento?: string
}

export interface Mensualidad {
  id: number
  alumno_id: number
  numero_mensualidad: number
  fecha_vencimiento: string
  monto: number
  estatus: 'pendiente' | 'pagado' | 'vencido' | 'cancelado'
  fecha_pago?: string
  observaciones?: string
  fecha_creacion: string
  fecha_actualizacion: string
  // Campos relacionados
  alumno_nombre?: string
  alumno_matricula?: string
  dias_vencido?: number
  moratorio_calculado?: number
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
  // Campos relacionados
  alumno_nombre?: string
  alumno_matricula?: string
  usuario_nombre?: string
}

export interface Configuracion {
  id: number
  clave: string
  valor: string
  descripcion?: string
  tipo: 'string' | 'number' | 'boolean' | 'json' | 'date'
  categoria: string
  editable: boolean
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface Notificacion {
  id: number
  alumno_id: number
  tipo: 'pago_vencido' | 'pago_proximo' | 'graduacion' | 'suspension' | 'bienvenida' | 'recordatorio'
  titulo: string
  mensaje: string
  datos_adicionales?: any
  enviado: boolean
  fecha_envio?: string
  metodo: 'email' | 'sms' | 'whatsapp' | 'push'
  destinatario?: string
  intentos_envio: number
  ultimo_error?: string
  fecha_programada?: string
  fecha_creacion: string
  fecha_actualizacion: string
}

// Tipos para reportes y estadísticas
export interface EstadisticasDashboard {
  alumnos_activos: number
  alumnos_graduados: number
  alumnos_baja: number
  alumnos_suspendidos: number
  total_alumnos: number
  pagos_mes_actual: number
  ingresos_mes_actual: number
  mensualidades_vencidas: number
  mensualidades_por_vencer: number
  monto_vencido: number
  notificaciones_pendientes: number
}

export interface CobranzaMensual {
  periodo: string
  periodo_nombre: string
  total_alumnos: number
  total_mensualidades: number
  monto_esperado: number
  monto_cobrado: number
  pagos_realizados: number
  pagos_pendientes: number
  pagos_vencidos: number
  porcentaje_cobranza: number
  monto_vencido: number
}

export interface IngresosPorTipo {
  periodo: string
  periodo_nombre: string
  tipo_pago: string
  cantidad_pagos: number
  total_monto: number
  total_descuentos: number
  total_moratorios: number
  total_ingresos: number
  promedio_pago: number
}

// Tipos para requests y responses de API
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

export interface ReporteFilters {
  periodo?: string
  tipo_reporte?: 'resumen' | 'cobranza' | 'alumnos' | 'planes' | 'morosidad'
  alumno_id?: number
  plan_id?: number
  fecha_desde?: string
  fecha_hasta?: string
}
