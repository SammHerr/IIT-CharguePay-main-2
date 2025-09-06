//import { Router } from 'express'

//const router = Router()
/*import express, { Router } from 'express'

// en vez de: const router = Router()
const router: Router = express.Router()

// Stub: añade endpoints de reportes después
router.get('/', (_req, res) => {
  res.json({ ok: true, message: 'reportes route up' })
})

export default router
*/

/*
// src/routes/reportes.ts
import express, { Router, type Request, type Response } from 'express'
import { DatabaseService } from '../core/db'
import { authenticateToken, requireRole } from '../middleware/auth'

// Si ya tienes reporteFiltersSchema en tu backend, descomenta esta línea.
// Si no, el código funciona igual porque los filtros son opcionales.
// import { reporteFiltersSchema } from '../validations/schemas'

const router: Router = express.Router()

// Autenticación para todo el módulo y acceso solo admin/coordinador
router.use(authenticateToken, requireRole(['admin', 'coordinador']))

/** Helpers 
function buildDateRange(
  column: string,
  desde?: string,
  hasta?: string
): { sql: string; params: any[] } {
  let sql = '1=1'
  const params: any[] = []

  if (desde) {
    sql += ` AND ${column} >= ?`
    params.push(desde)
  }
  if (hasta) {
    sql += ` AND ${column} <= ?`
    params.push(hasta)
  }

  return { sql, params }
}

function q<T = any>(sql: string, params: any[] = []) {
  return DatabaseService.query<T>(sql, params)
}
function q1<T = any>(sql: string, params: any[] = []) {
  return DatabaseService.queryOne<T>(sql, params)
}

/**
 * 1) /api/reportes/resumen
 *    - tasa_cobranza (% cobrados vs programados del período)
 *    - ingresos_totales (período)
 *    - moratorios_totales (período)
 *    - alumnos_con_atraso (conteo en el período)
 
router.get('/resumen', async (req: Request, res: Response) => {
  try {
    // Si usas zod:
    // const { fecha_desde, fecha_hasta } = reporteFiltersSchema.parse(req.query)
    const { fecha_desde, fecha_hasta } = req.query as {
      fecha_desde?: string
      fecha_hasta?: string
    }

    // Programado (mensualidades) por vencimiento
    const rM = buildDateRange('m.fecha_vencimiento', fecha_desde, fecha_hasta)
    const montoProgramado = await q1<{ esperado: number }>(
      `SELECT COALESCE(SUM(m.monto), 0) AS esperado
       FROM mensualidades m
       WHERE ${rM.sql}`,
      rM.params
    )

    // Cobrados (pagos) por fecha de pago
    const rP = buildDateRange('p.fecha_pago', fecha_desde, fecha_hasta)
    const ingresos = await q1<{ total: number }>(
      `SELECT COALESCE(SUM(p.total), 0) AS total
       FROM pagos p
       WHERE p.estatus = 'activo' AND ${rP.sql}`,
      rP.params
    )

    // Moratorios totales del período (suma del campo moratorio de pagos)
    const moras = await q1<{ total: number }>(
      `SELECT COALESCE(SUM(p.moratorio), 0) AS total
       FROM pagos p
       WHERE p.estatus = 'activo' AND ${rP.sql}`,
      rP.params
    )

    // Alumnos con atraso en el período (mensualidades vencidas en el rango)
    const alumnosAtraso = await q1<{ cnt: number }>(
      `SELECT COUNT(DISTINCT m.alumno_id) AS cnt
       FROM mensualidades m
       WHERE m.estatus = 'vencido' AND ${rM.sql}`,
      rM.params
    )

    const esperado = Number(montoProgramado?.esperado ?? 0)
    const cobrado = Number(ingresos?.total ?? 0)
    const tasaCobranza = esperado > 0 ? Math.round((cobrado / esperado) * 10000) / 100 : 0

    res.json({
      success: true,
      data: {
        tasa_cobranza: tasaCobranza,          // %
        ingresos_totales: cobrado,            // $
        moratorios_totales: Number(moras?.total ?? 0), // $
        alumnos_con_atraso: Number(alumnosAtraso?.cnt ?? 0),
        // opcional: eco de filtros
        filtros: { fecha_desde, fecha_hasta }
      }
    })
  } catch (e) {
    res.status(500).json({ success: false, error: 'Error en reporte resumen' })
  }
})

/**
 * 2) /api/reportes/cobranza
 *    - por tipo de pago, por método, por plan
 *    - filtros: fecha_desde, fecha_hasta, estatus (del pago)
 *
router.get('/cobranza', async (req: Request, res: Response) => {
  try {
    // const { fecha_desde, fecha_hasta, estatus } = reporteFiltersSchema.parse(req.query)
    const { fecha_desde, fecha_hasta, estatus } = req.query as {
      fecha_desde?: string
      fecha_hasta?: string
      estatus?: string
    }

    const rP = buildDateRange('p.fecha_pago', fecha_desde, fecha_hasta)
    const extra = []
    if (estatus) {
      extra.push('p.estatus = ?')
      rP.params.push(estatus)
    }
    const wherePagos = [rP.sql, ...extra].join(' AND ')

    const porTipo = await q<{ tipo_pago: string; total: string; n: number }>(
      `SELECT p.tipo_pago, SUM(p.total) AS total, COUNT(*) AS n
       FROM pagos p
       WHERE ${wherePagos}
       GROUP BY p.tipo_pago
       ORDER BY total DESC`,
      rP.params
    )

    const porMetodo = await q<{ forma_pago: string; total: string; n: number }>(
      `SELECT p.forma_pago, SUM(p.total) AS total, COUNT(*) AS n
       FROM pagos p
       WHERE ${wherePagos}
       GROUP BY p.forma_pago
       ORDER BY total DESC`,
      rP.params
    )

    // Revenue por plan (pagos vinculados a alumnos -> planes)
    const porPlan = await q<{ plan: string; total: string; n: number }>(
      `SELECT pl.nombre AS plan, SUM(p.total) AS total, COUNT(*) AS n
       FROM pagos p
       JOIN alumnos a ON a.id = p.alumno_id
       JOIN planes pl ON pl.id = a.plan_id
       WHERE ${wherePagos}
       GROUP BY pl.id, pl.nombre
       ORDER BY total DESC`,
      rP.params
    )

    res.json({
      success: true,
      data: { por_tipo: porTipo, por_metodo: porMetodo, por_plan: porPlan },
      filtros: { fecha_desde, fecha_hasta, estatus }
    })
  } catch (e) {
    res.status(500).json({ success: false, error: 'Error en reporte de cobranza' })
  }
})

/**
 * 3) /api/reportes/alumnos
 *    - distribución por estatus
 *    - top alumnos con mayor atraso (monto y días)
 *      (se calcula sobre mensualidades vencidas)
 *
router.get('/alumnos', async (_req: Request, res: Response) => {
  try {
    const distribucion = await q<{ estatus: string; cantidad: number }>(
      `SELECT estatus, COUNT(*) AS cantidad
       FROM alumnos
       GROUP BY estatus
       ORDER BY cantidad DESC`
    )

    // Top atraso: total adeudado por vencidos + días de atraso acumulados
    const topAtraso = await q<{
      alumno_id: number
      nombre: string
      matricula: string
      monto_vencido: string
      dias_atraso: number
    }>(
      `SELECT 
         a.id AS alumno_id,
         CONCAT(a.nombre, ' ', a.apellido_paterno) AS nombre,
         a.matricula,
         SUM(m.monto) AS monto_vencido,
         SUM(GREATEST(DATEDIFF(CURDATE(), m.fecha_vencimiento), 0)) AS dias_atraso
       FROM mensualidades m
       JOIN alumnos a ON a.id = m.alumno_id
       WHERE m.estatus = 'vencido'
       GROUP BY a.id, a.nombre, a.apellido_paterno, a.matricula
       ORDER BY monto_vencido DESC, dias_atraso DESC
       LIMIT 10`
    )

    res.json({
      success: true,
      data: { distribucion_estatus: distribucion, top_atraso: topAtraso }
    })
  } catch (e) {
    res.status(500).json({ success: false, error: 'Error en reporte de alumnos' })
  }
})

/**
 * 4) /api/reportes/planes
 *    - revenue por plan (pagos)
 *    - alumnos activos por plan
 *    filtros opcionales: fecha_desde, fecha_hasta (sobre pagos.fecha_pago)
 *
router.get('/planes', async (req: Request, res: Response) => {
  try {
    // const { fecha_desde, fecha_hasta } = reporteFiltersSchema.parse(req.query)
    const { fecha_desde, fecha_hasta } = req.query as { fecha_desde?: string; fecha_hasta?: string }
    const rP = buildDateRange('p.fecha_pago', fecha_desde, fecha_hasta)

    const revenuePorPlan = await q<{ plan: string; total: string }>(
      `SELECT pl.nombre AS plan, SUM(p.total) AS total
       FROM pagos p
       JOIN alumnos a ON a.id = p.alumno_id
       JOIN planes pl ON pl.id = a.plan_id
       WHERE p.estatus = 'activo' AND ${rP.sql}
       GROUP BY pl.id, pl.nombre
       ORDER BY total DESC`,
      rP.params
    )

    const activosPorPlan = await q<{ plan: string; activos: number }>(
      `SELECT pl.nombre AS plan, COUNT(*) AS activos
       FROM alumnos a
       JOIN planes pl ON pl.id = a.plan_id
       WHERE a.estatus = 'activo'
       GROUP BY pl.id, pl.nombre
       ORDER BY activos DESC`
    )

    res.json({
      success: true,
      data: { revenue_por_plan: revenuePorPlan, alumnos_activos_por_plan: activosPorPlan },
      filtros: { fecha_desde, fecha_hasta }
    })
  } catch (e) {
    res.status(500).json({ success: false, error: 'Error en reporte de planes' })
  }
})

export default router
*/

// src/routes/reportes.ts
import express, { Router, Request, Response } from 'express'
import { DatabaseService } from '../core/db'
import { authenticateToken, requireRole } from '../middleware/auth'

const router: Router = express.Router()

// Requiere auth y rol (admin o coordinador) para todo el módulo de reportes
router.use(authenticateToken)
router.use(requireRole(['admin', 'coordinador']))

// -------------------- helpers --------------------
type Range = { desde?: string; hasta?: string }

/** Crea un Range sin incluir propiedades con undefined (compatible con exactOptionalPropertyTypes) */
function getRangeFromQuery(query: Record<string, unknown>): Range {
  const r: Range = {}
  const d = query['fecha_desde']
  const h = query['fecha_hasta']
  if (typeof d === 'string' && d.length) r.desde = d
  if (typeof h === 'string' && h.length) r.hasta = h
  return r
}

/** Construye WHERE por rango de fechas */
function buildRange(campo: string, range: Range, params: any[]): string {
  let where = '1=1'
  if (range.desde) {
    where += ` AND ${campo} >= ?`
    params.push(range.desde)
  }
  if (range.hasta) {
    where += ` AND ${campo} <= ?`
    params.push(range.hasta)
  }
  return where
}

/** Convierte null/undefined a 0 */
const n = (v: any) => Number(v ?? 0)

// ===================================================================
// 1) /api/reportes/resumen
// ===================================================================
router.get('/resumen', async (req: Request, res: Response) => {
  try {
    const rangeMens = getRangeFromQuery(req.query as Record<string, unknown>)
    const rangePag = rangeMens // mismo rango para pagos

    // Esperado del periodo (mensualidades por fecha_vencimiento)
    const p1: any[] = []
    const wMens = buildRange('m.fecha_vencimiento', rangeMens, p1)
    const esperadoRow = await DatabaseService.queryOne<{ esperado: number }>(
      `SELECT COALESCE(SUM(m.monto), 0) AS esperado
       FROM mensualidades m
       JOIN alumnos a ON a.id = m.alumno_id
       WHERE ${wMens} AND a.estatus <> 'baja'`,
      p1
    )
    const esperado = n(esperadoRow?.esperado)

    // Cobrado del periodo (pagos por fecha_pago)
    const p2: any[] = []
    const wPag = buildRange('p.fecha_pago', rangePag, p2)
    const cobradoRow = await DatabaseService.queryOne<{ cobrado: number; moratorios: number }>(
      `SELECT 
          COALESCE(SUM(p.total),0) AS cobrado,
          COALESCE(SUM(p.moratorio),0) AS moratorios
       FROM pagos p
       WHERE ${wPag} AND p.estatus = 'activo'`,
      p2
    )
    const ingresos_totales = n(cobradoRow?.cobrado)
    const moratorios_totales = n(cobradoRow?.moratorios)

    // Alumnos con atraso (mensualidades vencidas en el rango de vencimiento)
    const p3: any[] = []
    const wAtraso = buildRange('m.fecha_vencimiento', rangeMens, p3)
    const atrasoRow = await DatabaseService.queryOne<{ alumnos_con_atraso: number }>(
      `SELECT COUNT(DISTINCT a.id) AS alumnos_con_atraso
       FROM mensualidades m
       JOIN alumnos a ON a.id = m.alumno_id
       WHERE ${wAtraso} AND m.estatus = 'vencido'`,
      p3
    )
    const alumnos_con_atraso = n(atrasoRow?.alumnos_con_atraso)

    const tasa_cobranza = esperado > 0 ? Math.round((ingresos_totales / esperado) * 10000) / 100 : 0

    res.json({
      success: true,
      data: {
        tasa_cobranza,
        ingresos_totales,
        moratorios_totales,
        alumnos_con_atraso,
        esperado,
        cobrado: ingresos_totales
      }
    })
  } catch {
    res.status(500).json({ success: false, error: 'Error en reporte resumen' })
  }
})

// ===================================================================
// 2) /api/reportes/cobranza
// ===================================================================
router.get('/cobranza', async (req: Request, res: Response) => {
  try {
    const rangePag = getRangeFromQuery(req.query as Record<string, unknown>)
    const { estatus, plan_id } = req.query as Record<string, string | undefined>

    const params: any[] = []
    const whereFecha = buildRange('p.fecha_pago', rangePag, params)
    const whereEstatus = estatus ? ' AND p.estatus = ?' : ' AND p.estatus = \'activo\''
    if (estatus) params.push(estatus)

    // por tipo de pago
    const porTipo = await DatabaseService.query(
      `SELECT p.tipo_pago, COALESCE(SUM(p.total),0) AS monto
       FROM pagos p
       WHERE ${whereFecha} ${whereEstatus}
       GROUP BY p.tipo_pago
       ORDER BY monto DESC`,
      params
    )

    // por método (forma_pago)
    const porMetodo = await DatabaseService.query(
      `SELECT p.forma_pago, COALESCE(SUM(p.total),0) AS monto
       FROM pagos p
       WHERE ${whereFecha} ${whereEstatus}
       GROUP BY p.forma_pago
       ORDER BY monto DESC`,
      params
    )

    // por plan
    const paramsPlan = [...params]
    let filtroPlan = ''
    if (plan_id) {
      filtroPlan = ' AND a.plan_id = ?'
      paramsPlan.push(Number(plan_id))
    }
    const porPlan = await DatabaseService.query(
      `SELECT pl.nombre AS plan, COALESCE(SUM(p.total),0) AS monto
       FROM pagos p
       JOIN alumnos a ON a.id = p.alumno_id
       JOIN planes pl ON pl.id = a.plan_id
       WHERE ${whereFecha} ${whereEstatus} ${filtroPlan}
       GROUP BY pl.id, pl.nombre
       ORDER BY monto DESC`,
      paramsPlan
    )

    res.json({ success: true, data: { porTipo, porMetodo, porPlan } })
  } catch {
    res.status(500).json({ success: false, error: 'Error en reporte de cobranza' })
  }
})

// ===================================================================
// 3) /api/reportes/alumnos
// ===================================================================
router.get('/alumnos', async (req: Request, res: Response) => {
  try {
    // Distribución por estatus
    const distribucion = await DatabaseService.query(
      `SELECT estatus, COUNT(*) AS cantidad
       FROM alumnos
       GROUP BY estatus`
    )

    // Top atraso (vencidos en rango de vencimiento)
    const rangeVenc = getRangeFromQuery(req.query as Record<string, unknown>)
    const params: any[] = []
    const whereVenc = buildRange('m.fecha_vencimiento', rangeVenc, params)

    const topAtraso = await DatabaseService.query(
      `SELECT 
          a.id AS alumno_id,
          a.matricula,
          CONCAT(a.nombre, ' ', a.apellido_paterno) AS nombre_alumno,
          COUNT(m.id) AS mensualidades_vencidas,
          COALESCE(SUM(m.monto),0) AS monto_vencido,
          MAX(DATEDIFF(CURDATE(), m.fecha_vencimiento)) AS dias_max_vencido
        FROM mensualidades m
        JOIN alumnos a ON a.id = m.alumno_id
        WHERE ${whereVenc} AND m.estatus = 'vencido'
        GROUP BY a.id, a.matricula, a.nombre, a.apellido_paterno
        ORDER BY monto_vencido DESC, dias_max_vencido DESC
        LIMIT 10`,
      params
    )

    res.json({ success: true, data: { distribucion, topAtraso } })
  } catch {
    res.status(500).json({ success: false, error: 'Error en reporte de alumnos' })
  }
})

// ===================================================================
// 4) /api/reportes/planes
// ===================================================================
router.get('/planes', async (req: Request, res: Response) => {
  try {
    const rangePag = getRangeFromQuery(req.query as Record<string, unknown>)
    const params: any[] = []
    const whereFecha = buildRange('p.fecha_pago', rangePag, params)

    const revenuePorPlan = await DatabaseService.query(
      `SELECT pl.id, pl.nombre,
              COALESCE(SUM(p.total),0) AS revenue
       FROM planes pl
       LEFT JOIN alumnos a ON a.plan_id = pl.id
       LEFT JOIN pagos p ON p.alumno_id = a.id AND ${whereFecha} AND p.estatus = 'activo'
       GROUP BY pl.id, pl.nombre
       ORDER BY revenue DESC`,
      params
    )

    const activosPorPlan = await DatabaseService.query(
      `SELECT pl.id, pl.nombre, COUNT(a.id) AS alumnos_activos
       FROM planes pl
       LEFT JOIN alumnos a ON a.plan_id = pl.id AND a.estatus = 'activo'
       GROUP BY pl.id, pl.nombre
       ORDER BY alumnos_activos DESC`
    )

    res.json({ success: true, data: { revenuePorPlan, activosPorPlan } })
  } catch {
    res.status(500).json({ success: false, error: 'Error en reporte de planes' })
  }
})

export default router
