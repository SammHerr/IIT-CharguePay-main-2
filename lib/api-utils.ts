import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema } from 'zod'
import { ApiResponse } from './types'

// Utility para manejar errores de API
export function handleApiError(error: any): NextResponse<ApiResponse> {
  console.error('API Error:', error)
  
  if (error.code === 'ER_DUP_ENTRY') {
    return NextResponse.json({
      success: false,
      error: 'Ya existe un registro con estos datos'
    }, { status: 409 })
  }
  
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return NextResponse.json({
      success: false,
      error: 'Referencia inválida a otro registro'
    }, { status: 400 })
  }
  
  return NextResponse.json({
    success: false,
    error: error.message || 'Error interno del servidor'
  }, { status: 500 })
}

// Utility para validar datos con Zod
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const body = await request.json()
    const validatedData = schema.parse(body)
    return { success: true, data: validatedData }
  } catch (error: any) {
    if (error.errors) {
      return {
        success: false,
        response: NextResponse.json({
          success: false,
          error: 'Datos inválidos',
          details: error.errors
        }, { status: 400 })
      }
    }
    return {
      success: false,
      response: NextResponse.json({
        success: false,
        error: 'Error al procesar los datos'
      }, { status: 400 })
    }
  }
}

// Utility para extraer parámetros de query
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

// Utility para crear respuesta exitosa
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  pagination?: any
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message,
    pagination
  })
}

// Utility para generar número de recibo
export function generateReceiptNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const timestamp = Date.now().toString().slice(-4)
  
  return `REC-${year}${month}${day}-${timestamp}`
}

// Utility para calcular moratorio
export function calculateMoratorio(
  monto: number,
  fechaVencimiento: string,
  porcentajeDiario: number = 1.0
): { diasVencido: number; moratorio: number } {
  const hoy = new Date()
  const vencimiento = new Date(fechaVencimiento)
  
  if (hoy <= vencimiento) {
    return { diasVencido: 0, moratorio: 0 }
  }
  
  const diasVencido = Math.floor((hoy.getTime() - vencimiento.getTime()) / (1000 * 60 * 60 * 24))
  const moratorio = Math.round(monto * (diasVencido * porcentajeDiario / 100) * 100) / 100
  
  return { diasVencido, moratorio }
}
