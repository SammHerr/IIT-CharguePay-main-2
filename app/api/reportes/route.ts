import { NextRequest } from 'next/server'
//import { DatabaseService } from '@/lib/database'
//import { reporteFiltersSchema } from '@/lib/validations'
//import { handleApiError, getQueryParams, createSuccessResponse } from '@/lib/api-utils'

//Cambio a rutas relativas debido a error de importación
import { DatabaseService } from '../../../lib/database'
import { reporteFiltersSchema } from '../../../lib/validations'
import { handleApiError, getQueryParams, createSuccessResponse } from '../../../lib/api-utils'

// GET /api/reportes - Obtener reportes según filtros
export async function GET(request: NextRequest) {
  try {
    const queryParams = getQueryParams(request)
    const filters = reporteFiltersSchema.parse(queryParams)
    
    const tipoReporte = filters.tipo_reporte || 'resumen'
    
    switch (tipoReporte) {
      case 'cobranza':
        return await getReporteCobranza(filters)
      case 'alumnos':
        return await getReporteAlumnos(filters)
      case 'morosidad':
        return await getReporteMorosidad(filters)
      case 'resumen':
      default:
        return await getReporteResumen(filters)
    }
    
  } catch (error) {
    return handleApiError(error)
  }
}

async function getReporteResumen(filters: any) {
  // Estadísticas generales
  const estadisticasGenerales = await DatabaseService.queryOne(`
    SELECT 
      (SELECT COUNT(*) FROM alumnos WHERE estatus = 'activo') as alumnos_activos,
      (SELECT COUNT(*) FROM alumnos WHERE estatus = 'graduado') as alumnos_graduados,
      (SELECT COUNT(*) FROM alumnos WHERE estatus = 'baja') as alumnos_baja,
      (SELECT COUNT(*) FROM alumnos) as total_alumnos,
      (SELECT COALESCE(SUM(total), 0) FROM pagos WHERE estatus = 'activo') as ingresos_totales,
      (SELECT COUNT(*) FROM mensualidades WHERE estatus = 'vencido') as mensualidades_vencidas,
      (SELECT COALESCE(SUM(monto), 0) FROM mensualidades WHERE estatus = 'vencido') as monto_vencido
  `)
  
  // Distribución por planes
  const distribucionPlanes = await DatabaseService.query(`
    SELECT 
      p.nombre as plan,
      COUNT(a.id) as cantidad_alumnos,
      COUNT(CASE WHEN a.estatus = 'activo' THEN 1 END) as alumnos_activos,
      p.precio_mensualidad,
      p.numero_mensualidades
    FROM planes p
    LEFT JOIN alumnos a ON p.id = a.plan_id
    GROUP BY p.id, p.nombre, p.precio_mensualidad, p.numero_mensualidades
    ORDER BY cantidad_alumnos DESC
  `)
  
  // Tendencia de cobranza últimos 6 meses
  const tendenciaCobranza = await DatabaseService.query(`
    SELECT 
      DATE_FORMAT(m.fecha_vencimiento, '%Y-%m') as periodo,
      DATE_FORMAT(m.fecha_vencimiento, '%M %Y') as periodo_nombre,
      SUM(m.monto) as monto_esperado,
      SUM(CASE WHEN m.estatus = 'pagado' THEN m.monto ELSE 0 END) as monto_cobrado,
      ROUND((SUM(CASE WHEN m.estatus = 'pagado' THEN m.monto ELSE 0 END) / NULLIF(SUM(m.monto), 0)) * 100, 2) as porcentaje_cobranza
    FROM mensualidades m
    WHERE m.fecha_vencimiento >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    GROUP BY DATE_FORMAT(m.fecha_vencimiento, '%Y-%m')
    ORDER BY periodo DESC
    LIMIT 6
  `)
  
  return createSuccessResponse({
    estadisticasGenerales,
    distribucionPlanes,
    tendenciaCobranza
  })
}

async function getReporteCobranza(filters: any) {
  let whereClause = '1=1'
  const params: any[] = []
  
  if (filters.periodo) {
    whereClause += ' AND DATE_FORMAT(m.fecha_vencimiento, \'%Y-%m\') = ?'
    params.push(filters.periodo)
  }
  
  if (filters.fecha_desde) {
    whereClause += ' AND m.fecha_vencimiento >= ?'
    params.push(filters.fecha_desde)
  }
  
  if (filters.fecha_hasta) {
    whereClause += ' AND m.fecha_vencimiento <= ?'
    params.push(filters.fecha_hasta)
  }
  
  const reporteCobranza = await DatabaseService.query(`
    SELECT 
      a.matricula,
      CONCAT(a.nombre, ' ', a.apellido_paterno) as nombre_alumno,
      p.nombre as plan,
      m.numero_mensualidad,
      m.fecha_vencimiento,
      m.monto,
      m.estatus,
      CASE 
        WHEN m.estatus = 'vencido' THEN DATEDIFF(CURDATE(), m.fecha_vencimiento)
        ELSE 0 
      END as dias_vencido,
      CASE 
        WHEN m.estatus = 'vencido' THEN ROUND(m.monto * (DATEDIFF(CURDATE(), m.fecha_vencimiento) * 0.01), 2)
        ELSE 0 
      END as moratorio,
      a.telefono,
      a.email
    FROM mensualidades m
    JOIN alumnos a ON m.alumno_id = a.id
    JOIN planes p ON a.plan_id = p.id
    WHERE ${whereClause}
    ORDER BY m.estatus DESC, dias_vencido DESC
  `, params)
  
  // Resumen de cobranza
  const resumenCobranza = await DatabaseService.queryOne(`
    SELECT 
      COUNT(DISTINCT m.alumno_id) as total_alumnos,
      COUNT(m.id) as total_mensualidades,
      SUM(m.monto) as monto_esperado,
      SUM(CASE WHEN m.estatus = 'pagado' THEN m.monto ELSE 0 END) as monto_cobrado,
      COUNT(CASE WHEN m.estatus = 'pagado' THEN 1 END) as pagos_realizados,
      COUNT(CASE WHEN m.estatus = 'pendiente' THEN 1 END) as pagos_pendientes,
      COUNT(CASE WHEN m.estatus = 'vencido' THEN 1 END) as pagos_vencidos,
      ROUND((SUM(CASE WHEN m.estatus = 'pagado' THEN m.monto ELSE 0 END) / NULLIF(SUM(m.monto), 0)) * 100, 2) as porcentaje_cobranza
    FROM mensualidades m
    JOIN alumnos a ON m.alumno_id = a.id
    WHERE ${whereClause}
  `, params)
  
  return createSuccessResponse({
    reporteCobranza,
    resumenCobranza
  })
}

async function getReporteAlumnos(filters: any) {
  let whereClause = '1=1'
  const params: any[] = []
  
  if (filters.plan_id) {
    whereClause += ' AND a.plan_id = ?'
    params.push(filters.plan_id)
  }
  
  if (filters.fecha_desde) {
    whereClause += ' AND a.fecha_inscripcion >= ?'
    params.push(filters.fecha_desde)
  }
  
  if (filters.fecha_hasta) {
    whereClause += ' AND a.fecha_inscripcion <= ?'
    params.push(filters.fecha_hasta)
  }
  
  const reporteAlumnos = await DatabaseService.query(`
    SELECT 
      a.matricula,
      CONCAT(a.nombre, ' ', a.apellido_paterno) as nombre_completo,
      p.nombre as plan,
      a.fecha_inscripcion,
      a.fecha_inicio,
      a.fecha_vigencia,
      a.estatus,
      (SELECT COUNT(*) FROM mensualidades m WHERE m.alumno_id = a.id AND m.estatus = 'pagado') as mensualidades_pagadas,
      (SELECT COUNT(*) FROM mensualidades m WHERE m.alumno_id = a.id AND m.estatus = 'pendiente') as mensualidades_pendientes,
      (SELECT COUNT(*) FROM mensualidades m WHERE m.alumno_id = a.id AND m.estatus = 'vencido') as mensualidades_vencidas,
      (SELECT COALESCE(SUM(pg.total), 0) FROM pagos pg WHERE pg.alumno_id = a.id AND pg.estatus = 'activo') as total_pagado,
      (SELECT COALESCE(SUM(m.monto), 0) FROM mensualidades m WHERE m.alumno_id = a.id AND m.estatus IN ('pendiente', 'vencido')) as saldo_pendiente
    FROM alumnos a
    JOIN planes p ON a.plan_id = p.id
    WHERE ${whereClause}
    ORDER BY a.fecha_inscripcion DESC
  `, params)
  
  return createSuccessResponse({ reporteAlumnos })
}

async function getReporteMorosidad(filters: any) {
  // Obtener configuración de moratorio
  const configMoratorio = await DatabaseService.queryOne(
    'SELECT valor FROM configuracion WHERE clave = ?',
    ['moratorio_porcentaje']
  )
  
  const porcentajeMoratorio = configMoratorio ? parseFloat(configMoratorio.valor) : 1.0
  
  const reporteMorosidad = await DatabaseService.query(`
    SELECT 
      a.matricula,
      CONCAT(a.nombre, ' ', a.apellido_paterno) as nombre_alumno,
      m.numero_mensualidad,
      m.fecha_vencimiento,
      m.monto,
      DATEDIFF(CURDATE(), m.fecha_vencimiento) as dias_vencido,
      ROUND(m.monto * (DATEDIFF(CURDATE(), m.fecha_vencimiento) * ? / 100), 2) as moratorio_calculado,
      a.telefono,
      a.email,
      p.nombre as plan_nombre
    FROM mensualidades m
    JOIN alumnos a ON m.alumno_id = a.id
    JOIN planes p ON a.plan_id = p.id
    WHERE m.estatus = 'vencido'
    AND DATEDIFF(CURDATE(), m.fecha_vencimiento) > 0
    AND a.estatus = 'activo'
    ORDER BY dias_vencido DESC, a.nombre
  `, [porcentajeMoratorio])
  
  // Resumen de morosidad
  const resumenMorosidad = await DatabaseService.queryOne(`
    SELECT 
      COUNT(DISTINCT a.id) as alumnos_en_mora,
      COUNT(m.id) as mensualidades_vencidas,
      SUM(m.monto) as monto_vencido,
      SUM(ROUND(m.monto * (DATEDIFF(CURDATE(), m.fecha_vencimiento) * ? / 100), 2)) as total_moratorios,
      AVG(DATEDIFF(CURDATE(), m.fecha_vencimiento)) as promedio_dias_vencido
    FROM mensualidades m
    JOIN alumnos a ON m.alumno_id = a.id
    WHERE m.estatus = 'vencido'
    AND DATEDIFF(CURDATE(), m.fecha_vencimiento) > 0
    AND a.estatus = 'activo'
  `, [porcentajeMoratorio])
  
  return createSuccessResponse({
    reporteMorosidad,
    resumenMorosidad
  })
}
