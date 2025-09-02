import { NextRequest } from 'next/server'
import { DatabaseService } from '@/lib/database'
import { pagoSchema, pagoFiltersSchema } from '@/lib/validations'
import { handleApiError, validateRequestBody, getQueryParams, createSuccessResponse, generateReceiptNumber } from '@/lib/api-utils'
import { PagoFilters } from '@/lib/types'

// GET /api/pagos - Obtener lista de pagos con filtros
export async function GET(request: NextRequest) {
  try {
    const queryParams = getQueryParams(request)
    const filters = pagoFiltersSchema.parse(queryParams) as PagoFilters
    
    let query = `
      SELECT 
        p.*,
        a.nombre as alumno_nombre,
        a.apellido_paterno,
        a.matricula as alumno_matricula,
        u.nombre as usuario_nombre,
        m.numero_mensualidad
      FROM pagos p
      JOIN alumnos a ON p.alumno_id = a.id
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN mensualidades m ON p.mensualidad_id = m.id
      WHERE 1=1
    `
    
    const params: any[] = []
    
    // Aplicar filtros
    if (filters.search) {
      query += ` AND (a.nombre LIKE ? OR a.matricula LIKE ? OR p.numero_recibo LIKE ?)`
      const searchTerm = `%${filters.search}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }
    
    if (filters.alumno_id) {
      query += ` AND p.alumno_id = ?`
      params.push(filters.alumno_id)
    }
    
    if (filters.tipo_pago) {
      query += ` AND p.tipo_pago = ?`
      params.push(filters.tipo_pago)
    }
    
    if (filters.forma_pago) {
      query += ` AND p.forma_pago = ?`
      params.push(filters.forma_pago)
    }
    
    if (filters.estatus) {
      query += ` AND p.estatus = ?`
      params.push(filters.estatus)
    }
    
    if (filters.fecha_desde) {
      query += ` AND DATE(p.fecha_pago) >= ?`
      params.push(filters.fecha_desde)
    }
    
    if (filters.fecha_hasta) {
      query += ` AND DATE(p.fecha_pago) <= ?`
      params.push(filters.fecha_hasta)
    }
    
    // Contar total
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM')
    const [{ total }] = await DatabaseService.query(countQuery, params)
    
    // Ordenamiento
    const sortBy = filters.sortBy || 'fecha_pago'
    const sortOrder = filters.sortOrder || 'desc'
    query += ` ORDER BY p.${sortBy} ${sortOrder.toUpperCase()}`
    
    // Paginación
    const offset = (filters.page! - 1) * filters.limit!
    query += ` LIMIT ? OFFSET ?`
    params.push(filters.limit, offset)
    
    const pagos = await DatabaseService.query(query, params)
    
    // Procesar nombres completos
    const processedPagos = pagos.map((pago: any) => ({
      ...pago,
      alumno_nombre: `${pago.alumno_nombre} ${pago.apellido_paterno}`.trim()
    }))
    
    return createSuccessResponse(processedPagos, undefined, {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit!)
    })
    
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/pagos - Crear nuevo pago
export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequestBody(request, pagoSchema)
    if (!validation.success) {
      return validation.response
    }
    
    const data = validation.data
    
    // Generar número de recibo
    const numeroRecibo = generateReceiptNumber()
    
    // Calcular total
    const total = data.monto - data.descuento + data.moratorio
    
    // Calcular días de retraso si hay fecha de vencimiento
    let diasRetraso = 0
    if (data.fecha_vencimiento) {
      const fechaPago = new Date(data.fecha_pago)
      const fechaVencimiento = new Date(data.fecha_vencimiento)
      if (fechaPago > fechaVencimiento) {
        diasRetraso = Math.floor((fechaPago.getTime() - fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24))
      }
    }
    
    // Insertar pago
    const insertQuery = `
      INSERT INTO pagos (
        numero_recibo, alumno_id, mensualidad_id, tipo_pago, concepto,
        monto, descuento, moratorio, total, forma_pago, referencia, banco,
        fecha_pago, fecha_vencimiento, dias_retraso, usuario_id, observaciones,
        comprobante_url, estatus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    
    const insertParams = [
      numeroRecibo, data.alumno_id, data.mensualidad_id, data.tipo_pago, data.concepto,
      data.monto, data.descuento, data.moratorio, total, data.forma_pago,
      data.referencia, data.banco, data.fecha_pago, data.fecha_vencimiento,
      diasRetraso, 1, data.observaciones, data.comprobante_url, 'activo' // TODO: obtener usuario_id de sesión
    ]
    
    const pagoId = await DatabaseService.insert(insertQuery, insertParams)
    
    // Obtener el pago creado con información completa
    const nuevoPago = await DatabaseService.queryOne(`
      SELECT 
        p.*,
        a.nombre as alumno_nombre,
        a.apellido_paterno,
        a.matricula as alumno_matricula,
        u.nombre as usuario_nombre
      FROM pagos p
      JOIN alumnos a ON p.alumno_id = a.id
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      WHERE p.id = ?
    `, [pagoId])
    
    return createSuccessResponse(nuevoPago, 'Pago registrado exitosamente')
    
  } catch (error) {
    return handleApiError(error)
  }
}
