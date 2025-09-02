import { NextRequest } from 'next/server'
import { DatabaseService } from '@/lib/database'
import { handleApiError, createSuccessResponse } from '@/lib/api-utils'

// GET /api/pagos/[id] - Obtener pago por ID
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
    
    const pago = await DatabaseService.queryOne(`
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
      WHERE p.id = ?
    `, [id])
    
    if (!pago) {
      return NextResponse.json({
        success: false,
        error: 'Pago no encontrado'
      }, { status: 404 })
    }
    
    // Procesar nombre completo
    pago.alumno_nombre = `${pago.alumno_nombre} ${pago.apellido_paterno}`.trim()
    
    return createSuccessResponse(pago)
    
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/pagos/[id]/cancelar - Cancelar pago
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
    
    const { motivo } = await request.json()
    
    // Verificar que el pago existe y está activo
    const pago = await DatabaseService.queryOne(
      'SELECT id, estatus, mensualidad_id FROM pagos WHERE id = ?',
      [id]
    )
    
    if (!pago) {
      return NextResponse.json({
        success: false,
        error: 'Pago no encontrado'
      }, { status: 404 })
    }
    
    if (pago.estatus === 'cancelado') {
      return NextResponse.json({
        success: false,
        error: 'El pago ya está cancelado'
      }, { status: 400 })
    }
    
    // Cancelar pago
    await DatabaseService.update(`
      UPDATE pagos 
      SET estatus = 'cancelado', 
          fecha_cancelacion = CURRENT_TIMESTAMP,
          motivo_cancelacion = ?,
          fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [motivo || 'Cancelado por usuario', id])
    
    // Si el pago tenía una mensualidad asociada, marcarla como pendiente
    if (pago.mensualidad_id) {
      await DatabaseService.update(
        'UPDATE mensualidades SET estatus = ?, fecha_pago = NULL WHERE id = ?',
        ['pendiente', pago.mensualidad_id]
      )
    }
    
    return createSuccessResponse(null, 'Pago cancelado exitosamente')
    
  } catch (error) {
    return handleApiError(error)
  }
}
