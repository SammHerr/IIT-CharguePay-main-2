//import { Router } from 'express'
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
