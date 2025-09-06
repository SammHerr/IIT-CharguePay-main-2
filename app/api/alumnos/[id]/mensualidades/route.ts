import { NextRequest, NextResponse } from 'next/server'
//import { DatabaseService } from '@/lib/database'
//import { handleApiError, createSuccessResponse, calculateMoratorio } from '@/lib/api-utils'

//Cambio a rutas relativas debido a error de importación
import { DatabaseService } from '../../../../../lib/database'
import { handleApiError, createSuccessResponse, calculateMoratorio } from '../../../../../lib/api-utils'

// GET /api/alumnos/[id]/mensualidades - Obtener mensualidades de un alumno
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'ID inválido'
      }, { status: 400 })
    }
    
    // Obtener configuración de moratorio
    const configMoratorio = await DatabaseService.queryOne(
      'SELECT valor FROM configuracion WHERE clave = ?',
      ['moratorio_porcentaje']
    )
    
    const porcentajeMoratorio = configMoratorio ? parseFloat(configMoratorio.valor) : 1.0
    
    const mensualidades = await DatabaseService.query(`
      SELECT 
        m.*,
        a.nombre as alumno_nombre,
        a.matricula as alumno_matricula
      FROM mensualidades m
      JOIN alumnos a ON m.alumno_id = a.id
      WHERE m.alumno_id = ?
      ORDER BY m.numero_mensualidad ASC
    `, [id])
    
    // Calcular moratorios para mensualidades vencidas
    const mensualidadesConMoratorio = mensualidades.map((mensualidad: any) => {
      if (mensualidad.estatus === 'vencido') {
        const { diasVencido, moratorio } = calculateMoratorio(
          mensualidad.monto,
          mensualidad.fecha_vencimiento,
          porcentajeMoratorio
        )
        return {
          ...mensualidad,
          dias_vencido: diasVencido,
          moratorio_calculado: moratorio
        }
      }
      return {
        ...mensualidad,
        dias_vencido: 0,
        moratorio_calculado: 0
      }
    })
    
    return createSuccessResponse(mensualidadesConMoratorio)
    
  } catch (error) {
    return handleApiError(error)
  }
}
