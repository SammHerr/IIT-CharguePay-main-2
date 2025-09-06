//import { Router } from 'express'
import { DatabaseService } from '../core/db'

//const router = Router()
import express, { Router } from 'express'

// en vez de: const router = Router()
const router: Router = express.Router()

// KPIs básicos del tablero (lecturas simples)
router.get('/', async (_req, res, next) => {
  try {
    const [alumnos] = await DatabaseService.query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM alumnos WHERE estatus <> 'baja'`
    )
    const [ingresos] = await DatabaseService.query<{ total: number }>(
      `SELECT IFNULL(SUM(total),0) AS total FROM pagos WHERE estatus = 'activo'`
    )
    const [pendientes] = await DatabaseService.query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM mensualidades WHERE estatus = 'pendiente'`
    )
    const [vencidas] = await DatabaseService.query<{ total: number }>(
      `SELECT COUNT(*) AS total
         FROM mensualidades
        WHERE estatus IN ('vencida','vencido')`
    )

    res.json({
      ok: true,
      data: {
        alumnos: alumnos?.total ?? 0,
        ingresos: ingresos?.total ?? 0,
        pendientes: pendientes?.total ?? 0,
        vencidas: vencidas?.total ?? 0
      }
    })
  } catch (e) {
    next(e)
  }
})

export default router
