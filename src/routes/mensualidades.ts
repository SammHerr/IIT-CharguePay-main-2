import express, { Router, Request, Response } from 'express'
import { DatabaseService } from '../config/database'
import { authenticateToken, requireRole } from '../middleware/auth'

const router: Router = express.Router()
router.use(authenticateToken)

router.get('/', requireRole(['admin', 'coordinador']), async (req: Request, res: Response) => {
  try {
    const alumno_id = Number(req.query['alumno_id'])
    if (!Number.isFinite(alumno_id)) {
      return res.status(400).json({ success: false, error: 'alumno_id inválido' })
    }

    const rows = await DatabaseService.query<any>(
      `
      SELECT id, alumno_id, numero_mensualidad, monto, fecha_vencimiento, estatus
      FROM mensualidades
      WHERE alumno_id = ? AND estatus IN ('pendiente','vencido')
      ORDER BY numero_mensualidad ASC
      `,
      [alumno_id]
    )

    // Si no hay pendientes, calculamos un "siguiente sugerido" (opcional)
    let siguiente: { numero_mensualidad: number, fecha_vencimiento: string } | null = null
    if (!rows || rows.length === 0) {
      // Tomamos la última mensualidad del alumno (cualquiera)
      const last = await DatabaseService.queryOne<any>(
        `
        SELECT numero_mensualidad, fecha_vencimiento
        FROM mensualidades
        WHERE alumno_id = ?
        ORDER BY numero_mensualidad DESC
        LIMIT 1
        `,
        [alumno_id]
      )

      if (last) {
        const num = Number(last.numero_mensualidad) + 1
        const base = new Date(last.fecha_vencimiento)
        const d = new Date(base); d.setMonth(d.getMonth() + 1)
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        siguiente = { numero_mensualidad: num, fecha_vencimiento: `${y}-${m}-${day}` }
      }
    }

    return res.json({ success: true, data: rows, sugerido: siguiente })
  } catch (e) {
    console.error('Error listando mensualidades:', e)
    return res.status(500).json({ success: false, error: 'Error listando mensualidades' })
  }
})

export default router
