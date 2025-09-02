import { NextRequest } from 'next/server'
import { DatabaseService } from '@/lib/database'
import { configuracionSchema } from '@/lib/validations'
import { handleApiError, validateRequestBody, createSuccessResponse } from '@/lib/api-utils'

// GET /api/configuracion - Obtener configuraciones
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoria = searchParams.get('categoria')
    
    let query = 'SELECT * FROM configuracion'
    const params: any[] = []
    
    if (categoria) {
      query += ' WHERE categoria = ?'
      params.push(categoria)
    }
    
    query += ' ORDER BY categoria, clave'
    
    const configuraciones = await DatabaseService.query(query, params)
    
    // Procesar valores según tipo
    const processedConfig = configuraciones.map((config: any) => ({
      ...config,
      valor: processConfigValue(config.valor, config.tipo)
    }))
    
    return createSuccessResponse(processedConfig)
    
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/configuracion - Actualizar configuraciones
export async function PUT(request: NextRequest) {
  try {
    const { configuraciones } = await request.json()
    
    if (!Array.isArray(configuraciones)) {
      return NextResponse.json({
        success: false,
        error: 'Se esperaba un array de configuraciones'
      }, { status: 400 })
    }
    
    // Actualizar cada configuración
    for (const config of configuraciones) {
      if (config.editable) {
        await DatabaseService.update(
          'UPDATE configuracion SET valor = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE clave = ?',
          [config.valor, config.clave]
        )
      }
    }
    
    return createSuccessResponse(null, 'Configuraciones actualizadas exitosamente')
    
  } catch (error) {
    return handleApiError(error)
  }
}

function processConfigValue(valor: string, tipo: string) {
  switch (tipo) {
    case 'number':
      return parseFloat(valor)
    case 'boolean':
      return valor === 'true'
    case 'json':
      try {
        return JSON.parse(valor)
      } catch {
        return valor
      }
    default:
      return valor
  }
}
