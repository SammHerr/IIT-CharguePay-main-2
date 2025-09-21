//import { Router } from 'express'

/*
import { DatabaseService } from '../config/database'

//const router = Router()
import express, { Router } from 'express'

// en vez de: const router = Router()
const router: Router = express.Router()

// Lista de planes (lectura real desde MariaDB)
router.get('/', async (_req, res, next) => {
  try {
    const planes = await DatabaseService.query<{
      id: number
      nombre: string
      vigencia_meses: number
      numero_mensualidades: number
      precio_mensualidad: number
    }>(
      `SELECT id, nombre, vigencia_meses, numero_mensualidades, precio_mensualidad
       FROM planes
       ORDER BY id`
    )
    res.json({ ok: true, data: planes })
  } catch (e) {
    next(e)
  }
})

export default router

*/

// src/routes/planes.ts
// src/routes/planes.ts
import express, { Router } from 'express'
import { DatabaseService } from '@/core/db'
import { planSchema } from '@/core/validations'
import { authenticateToken, requireRole } from '@/middleware/auth'
import { Request, Response } from 'express'
import { planUpdateSchema } from '@/validations/schemas'


const router: Router = express.Router()

// GET /api/planes
router.get('/', async (_req, res, next) => {
  try {
    const planes = await DatabaseService.query<{
      id: number
      nombre: string
      descripcion: string | null
      vigencia_meses: number
      numero_mensualidades: number
      precio_mensualidad: string // DECIMAL suele venir como string
      precio_inscripcion: string // idem
      extension_meses: number
      activo: number
    }>(`
      SELECT id, nombre, descripcion, vigencia_meses, numero_mensualidades,
             precio_mensualidad, precio_inscripcion, extension_meses, activo
      FROM planes
      ORDER BY id
    `)

    res.json({ ok: true, data: planes })
  } catch (e) {
    next(e)
  }
})

// POST /api/planes
router.post('/', authenticateToken,
  requireRole(['admin']), async (req, res, next) => {
  try {
    // valida contra TU planSchema existente
    const data = planSchema.parse(req.body)

    const insertId = await DatabaseService.insert(
      `INSERT INTO planes (
        nombre, descripcion, numero_mensualidades,
        precio_mensualidad, precio_inscripcion,
        vigencia_meses, extension_meses, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.nombre,
        data.descripcion ?? null,
        data.numero_mensualidades,
        data.precio_mensualidad,
        data.precio_inscripcion,
        data.vigencia_meses ?? 12,
        data.extension_meses ?? 4,
        data.activo ? 1 : 0
      ]
    )

    const nuevo = await DatabaseService.queryOne(`
      SELECT id, nombre, descripcion, numero_mensualidades,
             precio_mensualidad, precio_inscripcion,
             vigencia_meses, extension_meses, activo
      FROM planes
      WHERE id = ?
    `, [insertId])

    res.status(201).json({ ok: true, data: nuevo })
  } catch (e) {
    next(e)
  }
})

router.put(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  async (req: Request, res: Response, next) => {
    try {
      const id = Number(req.params['id'])
      if (!Number.isFinite(id)) {
        return res.status(400).json({ ok: false, error: 'ID inválido' })
      }

      // ¿Existe el plan?
      const existe = await DatabaseService.queryOne<{ id: number }>(
        'SELECT id FROM planes WHERE id = ?',
        [id]
      )
      if (!existe) {
        return res.status(404).json({ ok: false, error: 'Plan no encontrado' })
      }

      // Validamos y armamos SET dinámico
      const data = planUpdateSchema.parse(req.body)

      const colMap: Record<string, string> = {
        nombre: 'nombre',
        descripcion: 'descripcion',
        numero_mensualidades: 'numero_mensualidades',
        precio_mensualidad: 'precio_mensualidad',
        precio_inscripcion: 'precio_inscripcion',
        vigencia_meses: 'vigencia_meses',
        extension_meses: 'extension_meses',
        activo: 'activo'
      }

      const setParts: string[] = []
      const params: any[] = []

      for (const key of Object.keys(data)) {
        if (!(key in colMap)) continue
        const col = colMap[key]
        // normalizamos booleano->tinyint en "activo"
        if (key === 'activo') {
          setParts.push(`${col} = ?`)
          params.push((data as any)[key] ? 1 : 0)
        } else {
          setParts.push(`${col} = ?`)
          params.push((data as any)[key])
        }
      }

      if (setParts.length === 0) {
        return res.status(400).json({ ok: false, error: 'Nada para actualizar' })
      }

      await DatabaseService.update(
        `UPDATE planes SET ${setParts.join(', ')} WHERE id = ?`,
        [...params, id]
      )

      const actualizado = await DatabaseService.queryOne(
        `SELECT id, nombre, descripcion, numero_mensualidades,
                precio_mensualidad, precio_inscripcion,
                vigencia_meses, extension_meses, activo
         FROM planes
         WHERE id = ?`,
        [id]
      )

      return res.json({ ok: true, data: actualizado })
    } catch (e) {
      next(e)
    }
  }
)

// ====== DELETE (DELETE /api/planes/:id) — solo admin ======

router.delete(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  async (req: Request, res: Response, next) => {
    try {
      const id = Number(req.params['id'])
      if (!Number.isFinite(id)) {
        return res.status(400).json({ ok: false, error: 'ID inválido' })
      }

      // ¿Existe?
      const existe = await DatabaseService.queryOne<{ id: number }>(
        'SELECT id FROM planes WHERE id = ?',
        [id]
      )
      if (!existe) {
        return res.status(404).json({ ok: false, error: 'Plan no encontrado' })
      }

      // ¿Está referenciado por alumnos?
      const ref = await DatabaseService.queryOne<{ cnt: number }>(
        'SELECT COUNT(*) AS cnt FROM alumnos WHERE plan_id = ?',
        [id]
      )
      if ((ref?.cnt ?? 0) > 0) {
        return res.status(409).json({
          ok: false,
          error: 'No se puede eliminar: existen alumnos asociados a este plan',
          meta: { referencias: ref?.cnt ?? 0 }
        })
      }

      // Borrado físico. Si prefieres "soft delete": UPDATE planes SET activo = 0 WHERE id = ?
      await DatabaseService.update('DELETE FROM planes WHERE id = ?', [id])

      return res.json({ ok: true, message: 'Plan eliminado' })
    } catch (e: any) {
      // Manejo fino de FK si no hiciste el COUNT anterior o si hay otras tablas que refieren al plan
      if (e?.code === 'ER_ROW_IS_REFERENCED_2' || e?.code === 'ER_ROW_IS_REFERENCED') {
        return res.status(409).json({
          ok: false,
          error: 'No se puede eliminar: el plan está referenciado en otras tablas'
        })
      }
      next(e)
    }
  }
)

export default router

