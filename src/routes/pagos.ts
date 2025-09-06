//import { Router } from 'express'

//const router = Router()
/*
import express, { Router } from 'express'

// en vez de: const router = Router()
const router: Router = express.Router()


// Stub: por ahora solo confirma que la ruta existe
router.get('/', async (_req, res) => {
  res.json({ ok: true, data: [], message: 'pagos route up' })
})

export default router*/
/*
// src/routes/pagos.ts
import express, { Router, type Request, type Response } from 'express'
import { DatabaseService } from '../config/database'
import { pagoSchema } from '../validations/schemas'
import { authenticateToken, requireRole } from '../middleware/auth'
import { calculateMoratorio } from '../core/http' // tu función
import { generateReceiptNumber } from '../utils/helpers' // ya la tienes

const router: Router = express.Router()

// Todas las rutas de pagos requieren estar autenticado
router.use(authenticateToken)

/** Utilidad: recalcular estatus del alumno según sus mensualidades */
/*async function recalcularEstatusAlumno(alumnoId: number): Promise<'activo' | 'saldo_pendiente' | 'moratorio'> {
  const row = await DatabaseService.queryOne<{
    vencidos: number
    pendientes: number
  }>(
    `SELECT
       SUM(CASE WHEN estatus = 'vencido' THEN 1 ELSE 0 END) AS vencidos,
       SUM(CASE WHEN estatus = 'pendiente' THEN 1 ELSE 0 END) AS pendientes
     FROM mensualidades
     WHERE alumno_id = ?`,
    [alumnoId]
  )

  let nuevo = 'activo' as 'activo' | 'saldo_pendiente' | 'moratorio'
  const v = Number(row?.vencidos ?? 0)
  const p = Number(row?.pendientes ?? 0)

  if (v > 0) nuevo = 'moratorio'
  else if (p > 0) nuevo = 'saldo_pendiente'
  else nuevo = 'activo'

  await DatabaseService.update(
    `UPDATE alumnos
       SET estatus = ?, fecha_actualizacion = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [nuevo, alumnoId]
  )

  return nuevo
}

/**
 * POST /api/pagos
 * Registra un pago de mensualidad (o de otro tipo si quieres extenderlo).
 */

/*
router.post('/', requireRole(['admin', 'coordinador', 'caja']), async (req: Request, res: Response) => {
  try {
    const data = pagoSchema.parse(req.body)

    // 1) Resolver mensualidad objetivo: si no viene, tomar la próxima pendiente/vencida
    let mensualidad = null as null | {
      id: number
      alumno_id: number
      monto: number
      fecha_vencimiento: string
      estatus: string
      numero_mensualidad: number
    }

    if (data.mensualidad_id) {
      mensualidad = await DatabaseService.queryOne<typeof mensualidad>(
        `SELECT id, alumno_id, monto, fecha_vencimiento, estatus, numero_mensualidad
         FROM mensualidades WHERE id = ?`,
        [data.mensualidad_id]
      )
      if (!mensualidad) {
        res.status(404).json({ success: false, error: 'Mensualidad no encontrada' })
        return
      }
    } else {
      mensualidad = await DatabaseService.queryOne<typeof mensualidad>(
        `SELECT id, alumno_id, monto, fecha_vencimiento, estatus, numero_mensualidad
           FROM mensualidades
          WHERE alumno_id = ?
            AND estatus IN ('pendiente','vencido')
       ORDER BY numero_mensualidad ASC
          LIMIT 1`,
        [data.alumno_id]
      )
      if (!mensualidad) {
        res.status(400).json({ success: false, error: 'No hay mensualidades pendientes para este alumno' })
        return
      }
    }

    // 2) Obtener % moratorio desde configuración y calcular cargo real
    const cfg = await DatabaseService.queryOne<{ valor: string }>(
      'SELECT valor FROM configuracion WHERE clave = ?',
      ['moratorio_porcentaje']
    )
    const porcentaje = cfg ? parseFloat(cfg.valor) : 1.0

    const { moratorio } = calculateMoratorio(
      mensualidad.monto,
      mensualidad.fecha_vencimiento,
      porcentaje
    )

    const descuento = data.descuento ?? 0
    const totalRequerido = Math.max(0, mensualidad.monto + moratorio - descuento)

    // 3) Validar monto (por ahora no aceptamos pagos parciales para mensualidad)
    if (data.tipo_pago === 'mensualidad' && data.monto < totalRequerido) {
      res.status(400).json({
        success: false,
        error: `Monto insuficiente. Requerido: ${totalRequerido}`
      })
      return
    }

    // 4) Insertar pago
    const folio = generateReceiptNumber()
    const total = data.monto - descuento + moratorio

    const pagoId = await DatabaseService.insert(
      `INSERT INTO pagos (
         alumno_id, mensualidad_id, tipo_pago, concepto, monto, descuento, moratorio,
         forma_pago, referencia, banco, fecha_pago, observaciones, total, folio, estatus
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.alumno_id,
        mensualidad.id,
        data.tipo_pago,
        data.concepto,
        data.monto,
        descuento,
        moratorio,
        data.forma_pago,
        data.referencia ?? null,
        data.banco ?? null,
        data.fecha_pago,
        data.observaciones ?? null,
        total,
        folio,
        'activo'
      ]
    )

    // 5) Actualizar mensualidad a 'pagado' (cuando es pago de mensualidad)
    if (data.tipo_pago === 'mensualidad') {
      await DatabaseService.update(
        `UPDATE mensualidades
            SET estatus = 'pagado',
                fecha_pago = ?,
                fecha_actualizacion = CURRENT_TIMESTAMP
          WHERE id = ?`,
        [data.fecha_pago, mensualidad.id]
      )
    }

    // 6) Recalcular estatus del alumno
    const nuevoEstatus = await recalcularEstatusAlumno(mensualidad.alumno_id)

    // 7) Responder
    const pago = await DatabaseService.queryOne<any>(
      `SELECT * FROM pagos WHERE id = ?`,
      [pagoId]
    )

    res.status(201).json({
      success: true,
      data: {
        pago,
        mensualidad: { id: mensualidad.id, numero: mensualidad.numero_mensualidad },
        estatusAlumno: nuevoEstatus
      },
      message: 'Pago registrado correctamente'
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error registrando pago' })
  }
})

/**
 * (Opcional sencillo) POST /api/pagos/ajuste
 * Ajuste contable (positivo o negativo), no toca mensualidad.
 */


//AQUI DEBO ANALIZAR ESTE METODO PARA VER SI LO DEJO O NO
/*
router.post('/ajuste', requireRole(['admin', 'coordinador']), async (req: Request, res: Response) => {
  try {
    // Reusar el esquema pero sin mensualidad_id y con tipo_pago='ajuste'
    const body = { ...req.body, tipo_pago: 'ajuste' as const }
    const data = pagoSchema.parse(body)

    const folio = generateReceiptNumber()
    const total = data.monto - (data.descuento ?? 0) // sin moratorio

    const pagoId = await DatabaseService.insert(
      `INSERT INTO pagos (
         alumno_id, mensualidad_id, tipo_pago, concepto, monto, descuento, moratorio,
         forma_pago, referencia, banco, fecha_pago, observaciones, total, folio, estatus
       ) VALUES (?, NULL, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.alumno_id,
        'ajuste',
        data.concepto,
        data.monto,
        data.descuento ?? 0,
        data.forma_pago,
        data.referencia ?? null,
        data.banco ?? null,
        data.fecha_pago,
        data.observaciones ?? null,
        total,
        folio,
        'activo'
      ]
    )

    const pago = await DatabaseService.queryOne<any>(
      `SELECT * FROM pagos WHERE id = ?`,
      [pagoId]
    )

    res.status(201).json({
      success: true,
      data: { pago },
      message: 'Ajuste contable registrado'
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error registrando ajuste' })
  }
})

export default router

*/

// src/routes/pagos.ts

import express, { Router, Request, Response } from 'express'
import { DatabaseService } from '@/core/db'
import { authenticateToken, requireRole } from '@/middleware/auth'
import { pagoSchema } from '@/validations/schemas'
import { calculateMoratorio } from '@/utils/helpers'   // <- ajusta si lo tienes en otro lugar
import { generateReceiptNumber } from '@/utils/helpers' // <- idem
import { recalcularEstatusAlumno } from '@/core/http' // si aún no lo creas, puedes comentar esta línea temporalmente
import { pagosFiltersSchema } from '@/validations/schemas' // <- asegúrate de tener este esquema

const router: Router = express.Router()

// Crear pago
//router.post('/', requireRole(['admin', 'coordinador']), async (req: Request, res: Response) => {
router.post(
  '/',
  authenticateToken,                      // primero
  requireRole(['admin', 'coordinador']),  // después
  async (req: Request, res: Response) => {
  try {
    const data = pagoSchema.parse(req.body)

    // Validar alumno
    const alumno = await DatabaseService.queryOne<{ id: number }>(
      'SELECT id FROM alumnos WHERE id = ?',
      [data.alumno_id]
    )
    if (!alumno) {
      return res.status(404).json({ success: false, error: 'Alumno no encontrado' })
    }

    // Si es mensualidad, obtenemos info de la mensualidad para moratorio y fecha_vencimiento
    let fechaVencimiento: string | null = null
    let diasRetraso = 0
    let moratorioCalc = 0

    if (data.tipo_pago === 'mensualidad' && data.mensualidad_id) {
      const mensu = await DatabaseService.queryOne<{
        id: number
        monto: number
        fecha_vencimiento: string
        estatus: string
      }>(
        'SELECT id, monto, fecha_vencimiento, estatus FROM mensualidades WHERE id = ? AND alumno_id = ?',
        [data.mensualidad_id, data.alumno_id]
      )

      if (!mensu) {
        return res.status(404).json({ success: false, error: 'Mensualidad no encontrada' })
      }

      fechaVencimiento = mensu.fecha_vencimiento

      // calcular moratorio si corresponde (vencida)
      const { diasVencido, moratorio } = calculateMoratorio(
        mensu.monto,
        mensu.fecha_vencimiento,
        1.0 // % diario; si luego tienes config en BD cámbialo
      )
      diasRetraso = diasVencido
      moratorioCalc = moratorio
    }

    const numeroRecibo = generateReceiptNumber()
    const descuento = data.descuento ?? 0
    const moratorio = data.moratorio ?? moratorioCalc
    const total = Number(data.monto) - Number(descuento) + Number(moratorio)

    // IMPORTANTE: columnas alineadas a tu tabla (captura)
    const insertSql = `
      INSERT INTO pagos (
        numero_recibo, alumno_id, mensualidad_id, tipo_pago, concepto,
        monto, descuento, moratorio, total,
        forma_pago, referencia, banco,
        fecha_pago, fecha_vencimiento, dias_retraso,
        usuario_id, observaciones, comprobante_url,
        estatus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    const insertParams = [
      numeroRecibo,
      data.alumno_id,
      data.mensualidad_id ?? null,
      data.tipo_pago,
      data.concepto,
      data.monto,
      descuento,
      moratorio,
      total,
      data.forma_pago,
      data.referencia ?? null,
      data.banco ?? null,
      data.fecha_pago,                    // DATETIME
      fechaVencimiento,                  // DATE o NULL
      diasRetraso,                       // INT
      (req as any).user?.id ?? null,     // si tienes user en req
      data.observaciones ?? null,
      data.comprobante_url ?? null,
      'activo'
    ]

    const pagoId = await DatabaseService.insert(insertSql, insertParams)

    // Si se pagó mensualidad, marcamos mensualidad como pagada
    if (data.tipo_pago === 'mensualidad' && data.mensualidad_id) {
      await DatabaseService.update(
        `UPDATE mensualidades
         SET estatus = 'pagado', fecha_pago = ?
         WHERE id = ?`,
        [data.fecha_pago, data.mensualidad_id]
      )
    }

    // Recalcular estatus del alumno
    try {
      await recalcularEstatusAlumno(data.alumno_id)
    } catch (_) { /* */ }

    // Respuesta
    const nuevoPago = await DatabaseService.queryOne<any>(
      `SELECT * FROM pagos WHERE id = ?`,
      [pagoId]
    )

    res.status(201).json({
      success: true,
      data: nuevoPago,
      message: 'Pago registrado correctamente'
    })
  } catch (error: any) {
    console.error(error)
    res.status(500).json({ success: false, error: 'Error registrando pago' })
  }
})

router.post(
  '/ajuste',
  authenticateToken,
  requireRole(['admin', 'coordinador']),
  async (req: Request, res: Response): Promise<Response> => {
    try {
      // forzamos tipo_pago y mensualidad_id null ANTES del parse
      const payload = { ...req.body, tipo_pago: 'ajuste' as const, mensualidad_id: null }
      const data = pagoSchema.parse(payload)

      // (opcional) valida que el alumno exista si quieres replicar el flujo del create
      const alumno = await DatabaseService.queryOne<{ id: number }>(
        'SELECT id FROM alumnos WHERE id = ?',
        [data.alumno_id]
      )
      if (!alumno) {
        return res.status(404).json({ success: false, error: 'Alumno no encontrado' })
      }

      const numeroRecibo = generateReceiptNumber()
      const descuento = data.descuento ?? 0
      const total = Number(data.monto) - Number(descuento)

      // Mismas columnas que el insert principal, poniendo constantes para lo que no aplica
      const sql = `
        INSERT INTO pagos (
          numero_recibo, alumno_id, mensualidad_id, tipo_pago, concepto,
          monto, descuento, moratorio, total,
          forma_pago, referencia, banco,
          fecha_pago, fecha_vencimiento, dias_retraso,
          usuario_id, observaciones, comprobante_url,
          estatus
        ) VALUES (?, ?, NULL, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, NULL, 0, ?, ?, ?, 'activo')
      `

      const params = [
        numeroRecibo,
        data.alumno_id,
        'ajuste',
        data.concepto,
        data.monto,
        descuento,
        total,
        data.forma_pago,
        data.referencia ?? null,
        data.banco ?? null,
        data.fecha_pago,
        (req as any).user?.id ?? null,
        data.observaciones ?? null,
        data.comprobante_url ?? null
      ]

      const result = await DatabaseService.insert(sql, params)
      const pagoId = (result as any).insertId ?? result

      const pago = await DatabaseService.queryOne<any>('SELECT * FROM pagos WHERE id = ?', [pagoId])

      return res.status(201).json({
        success: true,
        data: pago,
        message: 'Ajuste contable registrado'
      })
    } catch (error) {
      console.error('Error registrando ajuste:', error)
      return res.status(500).json({ success: false, error: 'Error registrando ajuste' })
    }
  }
)
// ---------------- GET /api/pagos (lista con filtros y paginación) ----------------
router.get(
  '/',
  authenticateToken,
  requireRole(['admin', 'coordinador']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const filters = pagosFiltersSchema.parse(req.query)

      const where: string[] = []
      const params: any[] = []

      if (filters.alumno_id) {
        where.push('p.alumno_id = ?')
        params.push(filters.alumno_id)
      }
      if (filters.alumno) {
        where.push('(a.nombre LIKE ? OR a.matricula LIKE ?)')
        const like = `%${filters.alumno}%`
        params.push(like, like)
      }
      if (filters.forma_pago) {
        where.push('p.forma_pago = ?')
        params.push(filters.forma_pago)
      }
      if (filters.estatus) {
        where.push('p.estatus = ?')
        params.push(filters.estatus)
      }
      if (filters.fecha_ini) {
        where.push('DATE(p.fecha_pago) >= ?')
        params.push(filters.fecha_ini)
      }
      if (filters.fecha_fin) {
        where.push('DATE(p.fecha_pago) <= ?')
        params.push(filters.fecha_fin)
      }

      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

      const sortMap: Record<string, string> = {
        fecha_pago: 'p.fecha_pago',
        total: 'p.total',
        id: 'p.id',
        alumno: 'a.nombre'
      }
      const orderCol = sortMap[filters.sortBy] ?? 'p.fecha_pago'
      const orderDir = filters.sortDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
      const orderSql = `ORDER BY ${orderCol} ${orderDir}, p.id DESC`

      const page = filters.page
      const pageSize = filters.pageSize
      const offset = (page - 1) * pageSize

      const totalRow = await DatabaseService.queryOne<{ total: number }>(
        `
        SELECT COUNT(*) AS total
        FROM pagos p
        JOIN alumnos a ON a.id = p.alumno_id
        ${whereSql}
        `,
        params
      )
      const total = totalRow?.total ?? 0
      const totalPages = Math.ceil(total / pageSize)

      const rows = await DatabaseService.query<any>(
        `
        SELECT p.*, a.nombre AS alumno_nombre
        FROM pagos p
        JOIN alumnos a ON a.id = p.alumno_id
        ${whereSql}
        ${orderSql}
        LIMIT ? OFFSET ?
        `,
        [...params, pageSize, offset]
      )

      const sums = await DatabaseService.queryOne<{
        suma_total: number; suma_moratorio: number; suma_descuento: number
      }>(
        `
        SELECT
          COALESCE(SUM(p.total), 0)     AS suma_total,
          COALESCE(SUM(p.moratorio), 0) AS suma_moratorio,
          COALESCE(SUM(p.descuento), 0) AS suma_descuento
        FROM pagos p
        JOIN alumnos a ON a.id = p.alumno_id
        ${whereSql}
        `,
        params
      )

      return void res.json({
        success: true,
        data: rows,
        meta: { page, pageSize, total, totalPages, sums },
        filters: {
          alumno: filters.alumno,
          alumno_id: filters.alumno_id,
          forma_pago: filters.forma_pago,
          estatus: filters.estatus,
          fecha_ini: filters.fecha_ini,
          fecha_fin: filters.fecha_fin,
          sortBy: filters.sortBy,
          sortDir: filters.sortDir
        }
      })
    } catch (error) {
      console.error('Error obteniendo pagos:', error)
      return void res.status(500).json({ success: false, error: 'Error obteniendo pagos' })
    }
  }
)

// ---------------- GET /api/pagos/:id (detalle/recibo) ----------------
router.get(
  '/:id',
  authenticateToken,
  requireRole(['admin', 'coordinador']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params['id'])
      if (!Number.isFinite(id)) {
        return void res.status(400).json({ success: false, error: 'ID inválido' })
      }

      const pago = await DatabaseService.queryOne<any>(
        `
        SELECT
          p.*,
          a.id                AS alumno_id,
          a.nombre            AS alumno_nombre,
          a.matricula         AS alumno_matricula,
          pl.id               AS plan_id,
          pl.nombre           AS plan_nombre,
          m.id                AS mensualidad_id,
          m.monto             AS mensualidad_monto,
          m.fecha_vencimiento AS mensualidad_vencimiento
        FROM pagos p
        JOIN alumnos a       ON a.id = p.alumno_id
        LEFT JOIN mensualidades m ON m.id = p.mensualidad_id
        LEFT JOIN planes pl       ON pl.id = a.plan_id
        WHERE p.id = ?
        `,
        [id]
      )

      if (!pago) {
        return void res.status(404).json({ success: false, error: 'Pago no encontrado' })
      }

      const recibo = {
        numero_recibo: pago.numero_recibo,
        fecha_pago: pago.fecha_pago,
        alumno: {
          id: pago.alumno_id,
          nombre: pago.alumno_nombre,
          matricula: pago.alumno_matricula ?? null,
          plan: pago.plan_nombre ?? null
        },
        pago: {
          tipo: pago.tipo_pago,
          concepto: pago.concepto,
          monto: Number(pago.monto),
          descuento: Number(pago.descuento ?? 0),
          moratorio: Number(pago.moratorio ?? 0),
          total: Number(pago.total),
          forma_pago: pago.forma_pago,
          referencia: pago.referencia ?? null,
          banco: pago.banco ?? null,
          estatus: pago.estatus
        },
        mensualidad: pago.mensualidad_id
          ? { id: pago.mensualidad_id, monto: Number(pago.mensualidad_monto), fecha_vencimiento: pago.mensualidad_vencimiento }
          : null,
        observaciones: pago.observaciones ?? null,
        comprobante_url: pago.comprobante_url ?? null,
        usuario_id: pago.usuario_id ?? null
      }

      return void res.json({ success: true, data: pago, recibo })
    } catch (error) {
      console.error('Error obteniendo detalle de pago:', error)
      return void res.status(500).json({ success: false, error: 'Error obteniendo detalle de pago' })
    }
  }
)


export default router
