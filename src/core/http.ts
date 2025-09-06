import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema } from 'zod'
import { DatabaseService } from '../core/db'


export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: any
  details?: unknown
}

// Manejo uniforme de errores
export function handleApiError(error: any): NextResponse<ApiResponse> {
  // eslint-disable-next-line no-console
  console.error('API Error:', error)

  if (error?.code === 'ER_DUP_ENTRY') {
    return NextResponse.json({ success: false, error: 'Ya existe un registro con estos datos' }, { status: 409 })
  }

  if (error?.code === 'ER_NO_REFERENCED_ROW_2') {
    return NextResponse.json({ success: false, error: 'Referencia inválida a otro registro' }, { status: 400 })
  }

  return NextResponse.json(
    { success: false, error: error?.message || 'Error interno del servidor' },
    { status: 500 }
  )
}

// Validación con Zod
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const body = await request.json()
    const validated = schema.parse(body)
    return { success: true, data: validated }
  } catch (error: any) {
    if (error?.errors) {
      return {
        success: false,
        response: NextResponse.json(
          { success: false, error: 'Datos inválidos', details: error.errors },
          { status: 400 }
        )
      }
    }
    return {
      success: false,
      response: NextResponse.json({ success: false, error: 'Error al procesar los datos' }, { status: 400 })
    }
  }
}

// Query params -> objeto tipado básico
export function getQueryParams(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const params: Record<string, any> = {}

  searchParams.forEach((value, key) => {
    if (value === 'true') params[key] = true
    else if (value === 'false') params[key] = false
    else if (!isNaN(Number(value))) params[key] = Number(value)
    else params[key] = value
  })

  return params
}

// Respuesta exitosa
export function createSuccessResponse<T>(data: T, message?: string, pagination?: any) {
  return NextResponse.json({ success: true, data, message, pagination })
}

// Folio de recibo
export function generateReceiptNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const ts = Date.now().toString().slice(-4)
  return `REC-${year}${month}${day}-${ts}`
}

// Moratorio
export function calculateMoratorio(
  monto: number,
  fechaVencimiento: string,
  porcentajeDiario: number = 1.0
): { diasVencido: number; moratorio: number } {
  const hoy = new Date()
  const venc = new Date(fechaVencimiento)
  if (hoy <= venc) return { diasVencido: 0, moratorio: 0 }
  const diasVencido = Math.floor((hoy.getTime() - venc.getTime()) / (1000 * 60 * 60 * 24))
  const moratorio = Math.round(monto * ((diasVencido * porcentajeDiario) / 100) * 100) / 100
  return { diasVencido, moratorio }
}

export type EstatusAlumno = 'activo' | 'saldo_pendiente' | 'moratorio' | 'graduado' | 'baja'

/**
 * Recalcula estatus del alumno según reglas:
 * - baja: se respeta y no se sobre-escribe.
 * - moratorio: tiene al menos una mensualidad vencida.
 * - saldo_pendiente: tiene pendientes pero ninguna vencida.
 * - graduado: sin vencidos ni pendientes y (todas pagadas) o fecha_vigencia <= hoy.
 * - activo: sin vencidos ni pendientes y fecha_vigencia > hoy.
 */
export async function recalcularEstatusAlumno(alumnoId: number): Promise<EstatusAlumno> {
  const alum = await DatabaseService.queryOne<{ estatus: string; fecha_vigencia: string | null }>(
    'SELECT estatus, fecha_vigencia FROM alumnos WHERE id = ?',
    [alumnoId]
  )
  if (!alum) return 'activo'
  if (alum.estatus === 'baja') return 'baja'

  const cont = await DatabaseService.queryOne<{ vencidos: number; pendientes: number }>(
    `SELECT
       SUM(CASE WHEN estatus = 'vencido' THEN 1 ELSE 0 END) AS vencidos,
       SUM(CASE WHEN estatus = 'pendiente' THEN 1 ELSE 0 END) AS pendientes
     FROM mensualidades
     WHERE alumno_id = ?`,
    [alumnoId]
  )

  const vencidos = Number(cont?.vencidos ?? 0)
  const pendientes = Number(cont?.pendientes ?? 0)

  let nuevo: EstatusAlumno
  if (vencidos > 0) nuevo = 'moratorio'
  else if (pendientes > 0) nuevo = 'saldo_pendiente'
  else {
    const hoy = new Date()
    const vig = alum.fecha_vigencia ? new Date(alum.fecha_vigencia) : null
    nuevo = vig && vig <= hoy ? 'graduado' : 'activo'
  }

  if (nuevo !== alum.estatus) {
    await DatabaseService.update(
      `UPDATE alumnos
          SET estatus = ?, fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = ?`,
      [nuevo, alumnoId]
    )
  }

  return nuevo
}
