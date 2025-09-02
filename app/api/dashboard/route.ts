import { NextRequest } from 'next/server'
import { DatabaseService } from '@/lib/database'
import { handleApiError, createSuccessResponse } from '@/lib/api-utils'

// GET /api/dashboard - Obtener estadísticas del dashboard
export async function GET(request: NextRequest) {
  try {
    // Obtener estadísticas generales
    const estadisticas = await DatabaseService.queryOne(`
      SELECT 
        (SELECT COUNT(*) FROM alumnos WHERE estatus = 'activo') as alumnos_activos,
        (SELECT COUNT(*) FROM alumnos WHERE estatus = 'graduado') as alumnos_graduados,
        (SELECT COUNT(*) FROM alumnos WHERE estatus = 'baja') as alumnos_baja,
        (SELECT COUNT(*) FROM alumnos WHERE estatus = 'suspendido') as alumnos_suspendidos,
        (SELECT COUNT(*) FROM alumnos) as total_alumnos,
        (SELECT COUNT(*) FROM pagos WHERE MONTH(fecha_pago) = MONTH(CURDATE()) AND YEAR(fecha_pago) = YEAR(CURDATE()) AND estatus = 'activo') as pagos_mes_actual,
        (SELECT COALESCE(SUM(total), 0) FROM pagos WHERE MONTH(fecha_pago) = MONTH(CURDATE()) AND YEAR(fecha_pago) = YEAR(CURDATE()) AND estatus = 'activo') as ingresos_mes_actual,
        (SELECT COUNT(*) FROM mensualidades WHERE estatus = 'vencido') as mensualidades_vencidas,
        (SELECT COUNT(*) FROM mensualidades WHERE estatus = 'pendiente' AND fecha_vencimiento <= CURDATE() + INTERVAL 7 DAY) as mensualidades_por_vencer,
        (SELECT COALESCE(SUM(monto), 0) FROM mensualidades WHERE estatus = 'vencido') as monto_vencido,
        (SELECT COUNT(*) FROM notificaciones WHERE enviado = FALSE) as notificaciones_pendientes
    `)
    
    // Obtener pagos recientes
    const pagosRecientes = await DatabaseService.query(`
      SELECT 
        p.id,
        p.numero_recibo,
        p.monto,
        p.total,
        p.fecha_pago,
        p.estatus,
        CONCAT(a.nombre, ' ', a.apellido_paterno) as alumno_nombre,
        a.matricula
      FROM pagos p
      JOIN alumnos a ON p.alumno_id = a.id
      WHERE p.estatus = 'activo'
      ORDER BY p.fecha_pago DESC
      LIMIT 10
    `)
    
    // Obtener alumnos en mora
    const alumnosEnMora = await DatabaseService.query(`
      SELECT 
        a.id,
        CONCAT(a.nombre, ' ', a.apellido_paterno) as nombre,
        p.nombre as plan,
        COUNT(m.id) as mensualidades_vencidas,
        SUM(m.monto) as monto_vencido,
        MAX(DATEDIFF(CURDATE(), m.fecha_vencimiento)) as dias_maximo_vencido
      FROM alumnos a
      JOIN planes p ON a.plan_id = p.id
      JOIN mensualidades m ON a.id = m.alumno_id
      WHERE m.estatus = 'vencido' AND a.estatus = 'activo'
      GROUP BY a.id, a.nombre, a.apellido_paterno, p.nombre
      ORDER BY dias_maximo_vencido DESC
      LIMIT 10
    `)
    
    // Obtener cobranza del mes actual
    const cobranzaMesActual = await DatabaseService.queryOne(`
      SELECT 
        COUNT(DISTINCT m.alumno_id) as total_alumnos,
        SUM(m.monto) as monto_esperado,
        SUM(CASE WHEN m.estatus = 'pagado' THEN m.monto ELSE 0 END) as monto_cobrado,
        COUNT(CASE WHEN m.estatus = 'pagado' THEN 1 END) as pagos_realizados,
        COUNT(CASE WHEN m.estatus = 'pendiente' THEN 1 END) as pagos_pendientes,
        COUNT(CASE WHEN m.estatus = 'vencido' THEN 1 END) as pagos_vencidos,
        ROUND((SUM(CASE WHEN m.estatus = 'pagado' THEN m.monto ELSE 0 END) / NULLIF(SUM(m.monto), 0)) * 100, 2) as porcentaje_cobranza
      FROM mensualidades m
      WHERE DATE_FORMAT(m.fecha_vencimiento, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
    `)
    
    // Obtener ingresos por tipo del mes actual
    const ingresosPorTipo = await DatabaseService.query(`
      SELECT 
        tipo_pago,
        COUNT(*) as cantidad,
        SUM(total) as total_ingresos
      FROM pagos
      WHERE MONTH(fecha_pago) = MONTH(CURDATE()) 
        AND YEAR(fecha_pago) = YEAR(CURDATE())
        AND estatus = 'activo'
      GROUP BY tipo_pago
      ORDER BY total_ingresos DESC
    `)
    
    const dashboardData = {
      estadisticas,
      pagosRecientes,
      alumnosEnMora,
      cobranzaMesActual,
      ingresosPorTipo
    }
    
    return createSuccessResponse(dashboardData)
    
  } catch (error) {
    return handleApiError(error)
  }
}
