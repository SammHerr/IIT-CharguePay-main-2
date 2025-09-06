import { NextRequest, NextResponse } from 'next/server'
//import { DatabaseService } from '@/lib/database'
//import { alumnoUpdateSchema } from '@/lib/validations'
//import { handleApiError, validateRequestBody, createSuccessResponse } from '@/lib/api-utils'

//Cambio a rutas relativas debido a error de importación
import { DatabaseService } from '../../../../lib/database'
import { handleApiError, createSuccessResponse } from '../../../../lib/api-utils'
import { alumnoUpdateSchema } from '../../../../lib/validations'
import { validateRequestBody } from '../../../../lib/api-utils'

// GET /api/alumnos/[id] - Obtener alumno por ID
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
    
    const alumno = await DatabaseService.queryOne(`
      SELECT 
        a.*,
        p.nombre as plan_nombre,
        p.numero_mensualidades,
        p.precio_mensualidad,
        (SELECT COUNT(*) FROM mensualidades m WHERE m.alumno_id = a.id AND m.estatus = 'pagado') as mensualidades_pagadas,
        (SELECT COUNT(*) FROM mensualidades m WHERE m.alumno_id = a.id AND m.estatus = 'pendiente') as mensualidades_pendientes,
        (SELECT COUNT(*) FROM mensualidades m WHERE m.alumno_id = a.id AND m.estatus = 'vencido') as mensualidades_vencidas,
        (SELECT SUM(pg.total) FROM pagos pg WHERE pg.alumno_id = a.id AND pg.estatus = 'activo') as total_pagado,
        (SELECT SUM(m.monto) FROM mensualidades m WHERE m.alumno_id = a.id AND m.estatus IN ('pendiente', 'vencido')) as saldo_pendiente
      FROM alumnos a
      JOIN planes p ON a.plan_id = p.id
      WHERE a.id = ?
    `, [id])
    
    if (!alumno) {
      return NextResponse.json({
        success: false,
        error: 'Alumno no encontrado'
      }, { status: 404 })
    }
    
    // Procesar documentos_url JSON
    if (alumno.documentos_url) {
      alumno.documentos_url = JSON.parse(alumno.documentos_url)
    }
    
    return createSuccessResponse(alumno)
    
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/alumnos/[id] - Actualizar alumno
export async function PUT(
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
    
    const validation = await validateRequestBody(request, alumnoUpdateSchema)
    if (!validation.success) {
      return validation.response
    }
    
    const data = validation.data
    
    // Verificar que el alumno existe
    const existingAlumno = await DatabaseService.queryOne(
      'SELECT id FROM alumnos WHERE id = ?',
      [id]
    )
    
    if (!existingAlumno) {
      return NextResponse.json({
        success: false,
        error: 'Alumno no encontrado'
      }, { status: 404 })
    }
    
    // Construir query de actualización dinámicamente
    const updateFields: string[] = []
    const updateParams: any[] = []
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'documentos_url') {
          updateFields.push(`${key} = ?`)
          updateParams.push(JSON.stringify(value))
        } else {
          updateFields.push(`${key} = ?`)
          updateParams.push(value)
        }
      }
    })
    
    if (updateFields.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No hay campos para actualizar'
      }, { status: 400 })
    }
    
    updateParams.push(id)
    
    const updateQuery = `
      UPDATE alumnos 
      SET ${updateFields.join(', ')}, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    
    await DatabaseService.update(updateQuery, updateParams)
    
    // Obtener el alumno actualizado
    const alumnoActualizado = await DatabaseService.queryOne(`
      SELECT 
        a.*,
        p.nombre as plan_nombre
      FROM alumnos a
      JOIN planes p ON a.plan_id = p.id
      WHERE a.id = ?
    `, [id])
    
    return createSuccessResponse(alumnoActualizado, 'Alumno actualizado exitosamente')
    
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/alumnos/[id] - Eliminar alumno (soft delete)
export async function DELETE(
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
    
    // Verificar que el alumno existe
    const existingAlumno = await DatabaseService.queryOne(
      'SELECT id, estatus FROM alumnos WHERE id = ?',
      [id]
    )
    
    if (!existingAlumno) {
      return NextResponse.json({
        success: false,
        error: 'Alumno no encontrado'
      }, { status: 404 })
    }
    
    // Cambiar estatus a 'baja' en lugar de eliminar físicamente
    await DatabaseService.update(
      'UPDATE alumnos SET estatus = ?, motivo_baja = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?',
      ['baja', 'Eliminado por sistema', id]
    )
    
    return createSuccessResponse(null, 'Alumno eliminado exitosamente')
    
  } catch (error) {
    return handleApiError(error)
  }
}
