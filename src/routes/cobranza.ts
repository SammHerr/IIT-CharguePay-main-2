/*

import express, { Router, type Request, type Response } from 'express';
import { DatabaseService } from '../config/database';
import { authenticateToken, requireRole } from '../middleware/auth';
import { cobranzaFiltersSchema, type CobranzaFilters } from '@/core/validations';

const router: Router = express.Router();

// Aplica auth a todo
router.use(authenticateToken, requireRole(['admin', 'coordinador']));
*/
/**
 * GET /api/cobranza
 * Métricas + lista de alumnos con mensualidades pendientes del mes seleccionado.
 *
 * Query:
 *  - mes (1..12)
 *  - anio (YYYY)
 *  - page, pageSize
 *  - sortBy: 'vencimiento' | 'alumno' | 'monto'
 *  - sortDir: 'asc' | 'desc'
 */

/*
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // ✅ 1) Validar & normalizar query
    const filters: CobranzaFilters = cobranzaFiltersSchema.parse(req.query);

    const { mes, anio, page, pageSize, sortBy, sortDir } = filters;

    // Rango del mes
    const start = new Date(anio, mes - 1, 1);
    const end = new Date(anio, mes, 0); // último día del mes

    const fechaIni = start.toISOString().slice(0, 10);
    const fechaFin = end.toISOString().slice(0, 10);

    // Orden
    const sortMap: Record<string, string> = {
      vencimiento: 'm.fecha_vencimiento',
      alumno: 'a.nombre',
      monto: 'm.monto',
    };
    const orderCol = sortMap[sortBy] ?? 'm.fecha_vencimiento';
    const orderDir = sortDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const offset = (page - 1) * pageSize;

    // ✅ 2) Métricas (ajusta campos según tu esquema)
    const kpis = await DatabaseService.queryOne<{
      esperado: number;
      cobrado: number;
      moratorio: number;
      inscripciones: number;
      alumnos_total: number;
      alumnos_con_deuda: number;
    }>(
      `
      SELECT
        COALESCE(SUM(CASE WHEN m.estatus IN ('pendiente','vencido')
                          AND m.fecha_vencimiento BETWEEN ? AND ?
                          THEN m.monto ELSE 0 END), 0) AS esperado,
        COALESCE((
          SELECT SUM(p.total)
          FROM pagos p
          WHERE DATE(p.fecha_pago) BETWEEN ? AND ?
            AND p.estatus = 'activo'
        ), 0) AS cobrado,
        COALESCE((
          SELECT SUM(p.moratorio)
          FROM pagos p
          WHERE DATE(p.fecha_pago) BETWEEN ? AND ?
            AND p.estatus = 'activo'
        ), 0) AS moratorio,
        COALESCE((
          SELECT SUM(p.total)
          FROM pagos p
          WHERE DATE(p.fecha_pago) BETWEEN ? AND ?
            AND p.estatus = 'activo'
            AND p.tipo_pago = 'inscripcion'
        ), 0) AS inscripciones,
        (SELECT COUNT(*) FROM alumnos) AS alumnos_total,
        COALESCE((
          SELECT COUNT(DISTINCT m2.alumno_id)
          FROM mensualidades m2
          WHERE m2.estatus IN ('pendiente','vencido')
        ), 0) AS alumnos_con_deuda
      `,
      [fechaIni, fechaFin, fechaIni, fechaFin, fechaIni, fechaFin, fechaIni, fechaFin]
    );

    // ✅ 3) Lista (alumnos con adeudos de ese mes)
    const totalRow = await DatabaseService.queryOne<{ total: number }>(
      `
      SELECT COUNT(*) AS total
      FROM mensualidades m
      JOIN alumnos a ON a.id = m.alumno_id
      WHERE m.estatus IN ('pendiente','vencido')
        AND m.fecha_vencimiento BETWEEN ? AND ?
      `,
      [fechaIni, fechaFin]
    );
    const total = totalRow?.total ?? 0;

    const rows = await DatabaseService.query<any>(
      `
      SELECT
        a.id AS alumno_id,
        a.nombre AS alumno_nombre,
        a.matricula,
        a.telefono,
        m.id AS mensualidad_id,
        m.monto,
        m.fecha_vencimiento,
        DATEDIFF(CURDATE(), m.fecha_vencimiento) AS dias_vencido,
        CASE WHEN m.estatus='vencido' THEN
          ROUND( (DATEDIFF(CURDATE(), m.fecha_vencimiento)) * (m.monto * 0.012), 2) -- ej. 1.2% diario
        ELSE 0 END AS moratorio_estimado
      FROM mensualidades m
      JOIN alumnos a ON a.id = m.alumno_id
      WHERE m.estatus IN ('pendiente','vencido')
        AND m.fecha_vencimiento BETWEEN ? AND ?
      ORDER BY ${orderCol} ${orderDir}, a.id ASC
      LIMIT ? OFFSET ?
      `,
      [fechaIni, fechaFin, pageSize, offset]
    );

    res.json({
      success: true,
      kpis: {
        esperado: Number(kpis?.esperado ?? 0),
        cobrado: Number(kpis?.cobrado ?? 0),
        porcentaje_cobranza:
          Number(kpis?.esperado ?? 0) > 0
            ? Math.round((Number(kpis?.cobrado ?? 0) / Number(kpis?.esperado ?? 0)) * 1000) / 10
            : 0,
        moratorio: Number(kpis?.moratorio ?? 0),
        inscripciones: Number(kpis?.inscripciones ?? 0),
        alumnos_total: Number(kpis?.alumnos_total ?? 0),
        alumnos_con_deuda: Number(kpis?.alumnos_con_deuda ?? 0),
      },
      data: rows,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        range: { desde: fechaIni, hasta: fechaFin },
        sortBy,
        sortDir,
      },
    });
  } catch (err) {
    console.error('Error en GET /api/cobranza:', err);
    res.status(500).json({ success: false, error: 'Error obteniendo cobranza' });
  }
});

export default router;
*/
/*
// src/routes/cobranza.ts
import express, { Router, type Request, type Response } from 'express'
import { DatabaseService } from '@/core/db'                   // <--- Ajusta si tu db está en otro path
import { authenticateToken, requireRole } from '@/middleware/auth'
import { cobranzaFiltersSchema, type CobranzaFilters } from '@/core/validations'

const router: Router = express.Router()

// Aplica auth a todo el router
router.use(authenticateToken, requireRole(['admin', 'coordinador']))
*/
/**
 * GET /api/cobranza
 * Query:
 *  - mes (1..12)
 *  - anio (YYYY)
 *  - page, pageSize
 *  - sortBy: 'vencimiento' | 'alumno' | 'monto'
 *  - sortDir: 'asc' | 'desc'
 */

/*
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // 1) Validar & normalizar query
    const filters: CobranzaFilters = cobranzaFiltersSchema.parse(req.query)
    const { mes, anio, page, pageSize, sortBy, sortDir } = filters

    // Rango del mes
    const start = new Date(anio, mes - 1, 1)
    const end = new Date(anio, mes, 0) // último día del mes
    const fechaIni = start.toISOString().slice(0, 10)
    const fechaFin = end.toISOString().slice(0, 10)

    // Orden
    const sortMap: Record<string, string> = {
      vencimiento: 'm.fecha_vencimiento',
      alumno: 'a.nombre',
      monto: 'm.monto',
    }
    const orderCol = sortMap[sortBy] ?? 'm.fecha_vencimiento'
    const orderDir = sortDir.toLowerCase() === 'desc' ? 'DESC' : 'ASC'
    const offset = (page - 1) * pageSize

    // 2) KPIs
    const kpis = await DatabaseService.queryOne<{
      esperado: number
      cobrado: number
      moratorio: number
      inscripciones: number
      alumnos_total: number
      alumnos_con_deuda: number
    }>(
      `
      SELECT
        COALESCE(SUM(CASE WHEN m.estatus IN ('pendiente','vencido')
                          AND m.fecha_vencimiento BETWEEN ? AND ?
                          THEN m.monto ELSE 0 END), 0) AS esperado,
        COALESCE((
          SELECT SUM(p.total)
          FROM pagos p
          WHERE DATE(p.fecha_pago) BETWEEN ? AND ?
            AND p.estatus = 'activo'
        ), 0) AS cobrado,
        COALESCE((
          SELECT SUM(p.moratorio)
          FROM pagos p
          WHERE DATE(p.fecha_pago) BETWEEN ? AND ?
            AND p.estatus = 'activo'
        ), 0) AS moratorio,
        COALESCE((
          SELECT SUM(p.total)
          FROM pagos p
          WHERE DATE(p.fecha_pago) BETWEEN ? AND ?
            AND p.estatus = 'activo'
            AND p.tipo_pago = 'inscripcion'
        ), 0) AS inscripciones,
        (SELECT COUNT(*) FROM alumnos) AS alumnos_total,
        COALESCE((
          SELECT COUNT(DISTINCT m2.alumno_id)
          FROM mensualidades m2
          WHERE m2.estatus IN ('pendiente','vencido')
        ), 0) AS alumnos_con_deuda
      `,
      [fechaIni, fechaFin, fechaIni, fechaFin, fechaIni, fechaFin, fechaIni, fechaFin]
    )

    // 3) Lista
    const totalRow = await DatabaseService.queryOne<{ total: number }>(
      `
      SELECT COUNT(*) AS total
      FROM mensualidades m
      JOIN alumnos a ON a.id = m.alumno_id
      WHERE m.estatus IN ('pendiente','vencido')
        AND m.fecha_vencimiento BETWEEN ? AND ?
      `,
      [fechaIni, fechaFin]
    )
    const total = totalRow?.total ?? 0

    const rows = await DatabaseService.query<any>(
      `
      SELECT
        a.id AS alumno_id,
        a.nombre AS alumno_nombre,
        a.matricula,
        a.telefono,
        m.id AS mensualidad_id,
        m.monto,
        m.fecha_vencimiento,
        DATEDIFF(CURDATE(), m.fecha_vencimiento) AS dias_vencido,
        CASE WHEN m.estatus='vencido' THEN
          ROUND( (DATEDIFF(CURDATE(), m.fecha_vencimiento)) * (m.monto * 0.012), 2)
        ELSE 0 END AS moratorio_estimado
      FROM mensualidades m
      JOIN alumnos a ON a.id = m.alumno_id
      WHERE m.estatus IN ('pendiente','vencido')
        AND m.fecha_vencimiento BETWEEN ? AND ?
      ORDER BY ${orderCol} ${orderDir}, a.id ASC
      LIMIT ? OFFSET ?
      `,
      [fechaIni, fechaFin, pageSize, offset]
    )

    res.json({
      success: true,
      kpis: {
        esperado: Number(kpis?.esperado ?? 0),
        cobrado: Number(kpis?.cobrado ?? 0),
        porcentaje_cobranza:
          Number(kpis?.esperado ?? 0) > 0
            ? Math.round((Number(kpis?.cobrado ?? 0) / Number(kpis?.esperado ?? 0)) * 1000) / 10
            : 0,
        moratorio: Number(kpis?.moratorio ?? 0),
        inscripciones: Number(kpis?.inscripciones ?? 0),
        alumnos_total: Number(kpis?.alumnos_total ?? 0),
        alumnos_con_deuda: Number(kpis?.alumnos_con_deuda ?? 0),
      },
      data: rows,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        range: { desde: fechaIni, hasta: fechaFin },
        sortBy,
        sortDir,
      },
    })
  } catch (err) {
    console.error('Error en GET /api/cobranza:', err)
    res.status(500).json({ success: false, error: 'Error obteniendo cobranza' })
  }
})

export default router
*/

import express, { Router, type Request, type Response } from 'express'
import { DatabaseService } from '@/core/db'
import { authenticateToken, requireRole } from '@/middleware/auth'
import { cobranzaFiltersSchema, type CobranzaFilters } from '@/core/validations'

const router: Router = express.Router()

router.use(authenticateToken, requireRole(['admin', 'coordinador']))

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const filters: CobranzaFilters = cobranzaFiltersSchema.parse(req.query)
    const { mes, anio, page, pageSize, sortBy, sortDir } = filters

    const start = new Date(anio, mes - 1, 1)
    const end = new Date(anio, mes, 0)
    const fechaIni = start.toISOString().slice(0, 10)
    const fechaFin = end.toISOString().slice(0, 10)

    const sortMap: Record<string, string> = {
      vencimiento: 'm.fecha_vencimiento',
      alumno: 'a.nombre',
      monto: 'm.monto',
    }
    const orderCol = sortMap[sortBy] ?? 'm.fecha_vencimiento'
    const orderDir = sortDir.toLowerCase() === 'desc' ? 'DESC' : 'ASC'
    const offset = (page - 1) * pageSize

    // ===== KPIs (FIX: 'esperado' calculado vía subconsulta, no usando alias 'm' sin FROM) =====
    const kpis = await DatabaseService.queryOne<{
      esperado: number
      cobrado: number
      moratorio: number
      inscripciones: number
      alumnos_total: number
      alumnos_con_deuda: number
    }>(
      `
      SELECT
        COALESCE((
          SELECT SUM(m.monto)
          FROM mensualidades m
          WHERE m.estatus IN ('pendiente','vencido')
            AND m.fecha_vencimiento BETWEEN ? AND ?
        ), 0) AS esperado,

        COALESCE((
          SELECT SUM(p.total)
          FROM pagos p
          WHERE DATE(p.fecha_pago) BETWEEN ? AND ?
            AND p.estatus = 'activo'
        ), 0) AS cobrado,

        COALESCE((
          SELECT SUM(p.moratorio)
          FROM pagos p
          WHERE DATE(p.fecha_pago) BETWEEN ? AND ?
            AND p.estatus = 'activo'
        ), 0) AS moratorio,

        COALESCE((
          SELECT SUM(p.total)
          FROM pagos p
          WHERE DATE(p.fecha_pago) BETWEEN ? AND ?
            AND p.estatus = 'activo'
            AND p.tipo_pago = 'inscripcion'
        ), 0) AS inscripciones,

        (SELECT COUNT(*) FROM alumnos) AS alumnos_total,

        COALESCE((
          SELECT COUNT(DISTINCT m2.alumno_id)
          FROM mensualidades m2
          WHERE m2.estatus IN ('pendiente','vencido')
        ), 0) AS alumnos_con_deuda
      `,
      [fechaIni, fechaFin, fechaIni, fechaFin, fechaIni, fechaFin, fechaIni, fechaFin]
    )

    // ===== Listado =====
    const totalRow = await DatabaseService.queryOne<{ total: number }>(
      `
      SELECT COUNT(*) AS total
      FROM mensualidades m
      JOIN alumnos a ON a.id = m.alumno_id
      WHERE m.estatus IN ('pendiente','vencido')
        AND m.fecha_vencimiento BETWEEN ? AND ?
      `,
      [fechaIni, fechaFin]
    )
    const total = totalRow?.total ?? 0

    const rows = await DatabaseService.query<any>(
      `
      SELECT
        a.id AS alumno_id,
        a.nombre AS alumno_nombre,
        a.matricula,
        a.telefono,
        m.id AS mensualidad_id,
        m.monto,
        m.fecha_vencimiento,
        DATEDIFF(CURDATE(), m.fecha_vencimiento) AS dias_vencido,
        CASE WHEN m.estatus='vencido' THEN
          ROUND( (DATEDIFF(CURDATE(), m.fecha_vencimiento)) * (m.monto * 0.012), 2)
        ELSE 0 END AS moratorio_estimado
      FROM mensualidades m
      JOIN alumnos a ON a.id = m.alumno_id
      WHERE m.estatus IN ('pendiente','vencido')
        AND m.fecha_vencimiento BETWEEN ? AND ?
      ORDER BY ${orderCol} ${orderDir}, a.id ASC
      LIMIT ? OFFSET ?
      `,
      [fechaIni, fechaFin, pageSize, offset]
    )

    res.json({
      success: true,
      kpis: {
        esperado: Number(kpis?.esperado ?? 0),
        cobrado: Number(kpis?.cobrado ?? 0),
        porcentaje_cobranza:
          Number(kpis?.esperado ?? 0) > 0
            ? Math.round((Number(kpis?.cobrado ?? 0) / Number(kpis?.esperado ?? 0)) * 1000) / 10
            : 0,
        moratorio: Number(kpis?.moratorio ?? 0),
        inscripciones: Number(kpis?.inscripciones ?? 0),
        alumnos_total: Number(kpis?.alumnos_total ?? 0),
        alumnos_con_deuda: Number(kpis?.alumnos_con_deuda ?? 0),
      },
      data: rows,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        range: { desde: fechaIni, hasta: fechaFin },
        sortBy,
        sortDir,
      },
    })
  } catch (err) {
    console.error('Error en GET /api/cobranza:', err)
    res.status(500).json({ success: false, error: 'Error obteniendo cobranza' })
  }
})

export default router
