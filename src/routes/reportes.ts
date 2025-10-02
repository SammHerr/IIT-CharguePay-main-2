/*

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

*/
/** Crea un Range sin incluir propiedades con undefined (compatible con exactOptionalPropertyTypes) */

/*

function getRangeFromQuery(query: Record<string, unknown>): Range {
  const r: Range = {}
  const d = query['fecha_desde']
  const h = query['fecha_hasta']
  if (typeof d === 'string' && d.length) r.desde = d
  if (typeof h === 'string' && h.length) r.hasta = h
  return r
}
*/

/** Construye WHERE por rango de fechas */
/*
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
*/

/** Convierte null/undefined a 0 */

/*
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
*/

// src/routes/reportes.ts
import express, { Router, Request, Response } from 'express'
import { DatabaseService } from '../core/db'
import { authenticateToken, requireRole } from '../middleware/auth'

const router: Router = express.Router()

// Requiere auth y rol (admin o coordinador)
router.use(authenticateToken)
router.use(requireRole(['admin', 'coordinador']))

type Range = { desde?: string; hasta?: string }
function getRangeFromQuery(query: Record<string, unknown>): Range {
  const r: Range = {}
  const d = query['fecha_desde']
  const h = query['fecha_hasta']
  if (typeof d === 'string' && d.length) r.desde = d
  if (typeof h === 'string' && h.length) r.hasta = h
  return r
}
function buildRange(campo: string, range: Range, params: any[]): string {
  let where = '1=1'
  if (range.desde) { where += ` AND ${campo} >= ?`; params.push(range.desde) }
  if (range.hasta) { where += ` AND ${campo} <= ?`; params.push(range.hasta) }
  return where
}
const n = (v: any) => Number(v ?? 0)

// 1) RESUMEN
router.get('/resumen', async (req: Request, res: Response) => {
  try {
    const rangeMens = getRangeFromQuery(req.query as Record<string, unknown>)
    const rangePag = rangeMens

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
      data: { tasa_cobranza, ingresos_totales, moratorios_totales, alumnos_con_atraso, esperado, cobrado: ingresos_totales }
    })
  } catch {
    res.status(500).json({ success: false, error: 'Error en reporte resumen' })
  }
})

// 2) COBRANZA
router.get('/cobranza', async (req: Request, res: Response) => {
  try {
    const rangePag = getRangeFromQuery(req.query as Record<string, unknown>)
    const { estatus, plan_id } = req.query as Record<string, string | undefined>

    const params: any[] = []
    const whereFecha = buildRange('p.fecha_pago', rangePag, params)
    const whereEstatus = estatus ? ' AND p.estatus = ?' : ' AND p.estatus = \'activo\''
    if (estatus) params.push(estatus)

    const porTipo = await DatabaseService.query(
      `SELECT p.tipo_pago, COALESCE(SUM(p.total),0) AS monto
       FROM pagos p
       WHERE ${whereFecha} ${whereEstatus}
       GROUP BY p.tipo_pago
       ORDER BY monto DESC`,
      params
    )

    const porMetodo = await DatabaseService.query(
      `SELECT p.forma_pago, COALESCE(SUM(p.total),0) AS monto
       FROM pagos p
       WHERE ${whereFecha} ${whereEstatus}
       GROUP BY p.forma_pago
       ORDER BY monto DESC`,
      params
    )

    const paramsPlan = [...params]
    let filtroPlan = ''
    if (plan_id) { filtroPlan = ' AND a.plan_id = ?'; paramsPlan.push(Number(plan_id)) }
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

// 3) ALUMNOS
router.get('/alumnos', async (req: Request, res: Response) => {
  try {
    const distribucion = await DatabaseService.query(
      `SELECT estatus, COUNT(*) AS cantidad
       FROM alumnos
       GROUP BY estatus`
    )

    const rangeVenc = getRangeFromQuery(req.query as Record<string, unknown>)
    const params: any[] = []
    const whereVenc = buildRange('m.fecha_vencimiento', rangeVenc, params)

    const topAtraso = await DatabaseService.query(
      `SELECT 
          a.id AS alumno_id,
          a.matricula,
          a.nombre AS nombre_alumno,
          COUNT(m.id) AS mensualidades_vencidas,
          COALESCE(SUM(m.monto),0) AS monto_vencido,
          MAX(DATEDIFF(CURDATE(), m.fecha_vencimiento)) AS dias_max_vencido
        FROM mensualidades m
        JOIN alumnos a ON a.id = m.alumno_id
        WHERE ${whereVenc} AND m.estatus = 'vencido'
        GROUP BY a.id, a.matricula, a.nombre
        ORDER BY monto_vencido DESC, dias_max_vencido DESC
        LIMIT 10`,
      params
    )

    res.json({ success: true, data: { distribucion, topAtraso } })
  } catch {
    res.status(500).json({ success: false, error: 'Error en reporte de alumnos' })
  }
})

// 4) PLANES
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
