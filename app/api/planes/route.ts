import { NextRequest } from 'next/server'
//import { DatabaseService } from '@/lib/database'
//import { planSchema } from '@/lib/validations'
//import { handleApiError, validateRequestBody, createSuccessResponse } from '@/lib/api-utils'

//Cambio a rutas relativas debido a error de importación
import { DatabaseService } from '../../../lib/database'
import { planSchema } from '../../../lib/validations'
import { handleApiError, validateRequestBody, createSuccessResponse } from '../../../lib/api-utils'

// GET /api/planes - Obtener todos los planes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activo = searchParams.get('activo')
    
    let query = 'SELECT * FROM planes'
    const params: any[] = []
    
    if (activo !== null) {
      query += ' WHERE activo = ?'
      params.push(activo === 'true')
    }
    
    query += ' ORDER BY nombre ASC'
    
    const planes = await DatabaseService.query(query, params)
    
    return createSuccessResponse(planes)
    
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/planes - Crear nuevo plan
export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequestBody(request, planSchema)
    if (!validation.success) {
      return validation.response
    }
    
    const data = validation.data
    
    const insertQuery = `
      INSERT INTO planes (
        nombre, descripcion, numero_mensualidades, precio_mensualidad,
        precio_inscripcion, vigencia_meses, extension_meses, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    
    const insertParams = [
      data.nombre, data.descripcion, data.numero_mensualidades,
      data.precio_mensualidad, data.precio_inscripcion,
      data.vigencia_meses, data.extension_meses, data.activo
    ]
    
    const planId = await DatabaseService.insert(insertQuery, insertParams)
    
    const nuevoPlan = await DatabaseService.queryOne(
      'SELECT * FROM planes WHERE id = ?',
      [planId]
    )
    
    return createSuccessResponse(nuevoPlan, 'Plan creado exitosamente')
    
  } catch (error) {
    return handleApiError(error)
  }
}
