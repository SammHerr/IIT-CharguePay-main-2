import { NextRequest } from 'next/server'
import { DatabaseService } from '@/lib/database'
import { alumnoSchema, alumnoFiltersSchema } from '@/lib/validations'
import { handleApiError, validateRequestBody, getQueryParams, createSuccessResponse } from '@/lib/api-utils'
import { Alumno, AlumnoFilters } from '@/lib/types'

// GET /api/alumnos - Obtener lista de alumnos con filtros y paginación
export async function GET(request: NextRequest) {
  try {
    const queryParams = getQueryParams(request)
    const filters = alumnoFiltersSchema.parse(queryParams) as AlumnoFilters
    
    // Construir query base
    let query = `
      SELECT 
        a.*,
        p.nombre as plan_nombre,
        (SELECT COUNT(*) FROM mensualidades m WHERE m.alumno_id = a.id AND m.estatus = 'pagado') as mensualidades_pagadas,
        (SELECT COUNT(*) FROM mensualidades m WHERE m.alumno_id = a.id AND m.estatus = 'pendiente') as mensualidades_pendientes,
        (SELECT COUNT(*) FROM mensualidades m WHERE m.alumno_id = a.id AND m.estatus = 'vencido') as mensualidades_vencidas,
        (SELECT SUM(pg.total) FROM pagos pg WHERE pg.alumno_id = a.id AND pg.estatus = 'activo') as total_pagado,
        (SELECT SUM(m.monto) FROM mensualidades m WHERE m.alumno_id = a.id AND m.estatus IN ('pendiente', 'vencido')) as saldo_pendiente,
        (SELECT MIN(m.fecha_vencimiento) FROM mensualidades m WHERE m.alumno_id = a.id AND m.estatus = 'pendiente') as proximo_vencimiento
      FROM alumnos a
      JOIN planes p ON a.plan_id = p.id
      WHERE 1=1
    `
    
    const params: any[] = []
    
    // Aplicar filtros
    if (filters.search) {
      query += ` AND (a.nombre LIKE ? OR a.apellido_paterno LIKE ? OR a.matricula LIKE ? OR a.email LIKE ?)`
      const searchTerm = `%${filters.search}%`
      params.push(searchTerm, searchTerm, searchTerm, searchTerm)
    }
    
    if (filters.estatus) {
      query += ` AND a.estatus = ?`
      params.push(filters.estatus)
    }
    
    if (filters.plan_id) {
      query += ` AND a.plan_id = ?`
      params.push(filters.plan_id)
    }
    
    if (filters.fecha_inicio_desde) {
      query += ` AND a.fecha_inicio >= ?`
      params.push(filters.fecha_inicio_desde)
    }
    
    if (filters.fecha_inicio_hasta) {
      query += ` AND a.fecha_inicio <= ?`
      params.push(filters.fecha_inicio_hasta)
    }
    
    // Contar total de registros
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM')
    const [{ total }] = await DatabaseService.query(countQuery, params)
    
    // Aplicar ordenamiento
    const sortBy = filters.sortBy || 'fecha_creacion'
    const sortOrder = filters.sortOrder || 'desc'
    query += ` ORDER BY a.${sortBy} ${sortOrder.toUpperCase()}`
    
    // Aplicar paginación
    const offset = (filters.page! - 1) * filters.limit!
    query += ` LIMIT ? OFFSET ?`
    params.push(filters.limit, offset)
    
    const alumnos = await DatabaseService.query(query, params)
    
    // Procesar documentos_url JSON
    const processedAlumnos = alumnos.map((alumno: any) => ({
      ...alumno,
      documentos_url: alumno.documentos_url ? JSON.parse(alumno.documentos_url) : []
    }))
    
    return createSuccessResponse(processedAlumnos, undefined, {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit!)
    })
    
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/alumnos - Crear nuevo alumno
export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequestBody(request, alumnoSchema)
    if (!validation.success) {
      return validation.response
    }
    
    const data = validation.data
    
    // Generar matrícula si no se proporciona
    if (!data.matricula) {
      const year = new Date().getFullYear()
      const count = await DatabaseService.queryOne(
        'SELECT COUNT(*) as total FROM alumnos WHERE YEAR(fecha_creacion) = ?',
        [year]
      )
      data.matricula = `IIT-${year}-${String(count.total + 1).padStart(3, '0')}`
    }
    
    // Calcular fecha de vigencia
    const plan = await DatabaseService.queryOne(
      'SELECT vigencia_meses FROM planes WHERE id = ?',
      [data.plan_id]
    )
    
    if (!plan) {
      return NextResponse.json({
        success: false,
        error: 'Plan no encontrado'
      }, { status: 404 })
    }
    
    const fechaInicio = new Date(data.fecha_inicio)
    const fechaVigencia = new Date(fechaInicio)
    fechaVigencia.setMonth(fechaVigencia.getMonth() + plan.vigencia_meses)
    
    // Insertar alumno
    const insertQuery = `
      INSERT INTO alumnos (
        matricula, nombre, apellido_paterno, apellido_materno, fecha_nacimiento,
        genero, telefono, email, direccion, ciudad, estado, codigo_postal,
        contacto_emergencia, telefono_emergencia, relacion_emergencia,
        fecha_inscripcion, fecha_inicio, plan_id, fecha_vigencia, estatus,
        motivo_baja, notas, foto_url, documentos_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    
    const insertParams = [
      data.matricula, data.nombre, data.apellido_paterno, data.apellido_materno,
      data.fecha_nacimiento, data.genero, data.telefono, data.email,
      data.direccion, data.ciudad, data.estado, data.codigo_postal,
      data.contacto_emergencia, data.telefono_emergencia, data.relacion_emergencia,
      data.fecha_inscripcion, data.fecha_inicio, data.plan_id,
      fechaVigencia.toISOString().split('T')[0], data.estatus,
      data.motivo_baja, data.notas, data.foto_url,
      data.documentos_url ? JSON.stringify(data.documentos_url) : null
    ]
    
    const alumnoId = await DatabaseService.insert(insertQuery, insertParams)
    
    // Obtener el alumno creado con información completa
    const nuevoAlumno = await DatabaseService.queryOne(`
      SELECT 
        a.*,
        p.nombre as plan_nombre
      FROM alumnos a
      JOIN planes p ON a.plan_id = p.id
      WHERE a.id = ?
    `, [alumnoId])
    
    return createSuccessResponse(nuevoAlumno, 'Alumno creado exitosamente')
    
  } catch (error) {
    return handleApiError(error)
  }
}
