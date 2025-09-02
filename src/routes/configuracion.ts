//import { Router } from 'express'

//const router = Router()
import express, { Router } from 'express'

// en vez de: const router = Router()
const router: Router = express.Router()

// Stub: lectura de configuración del sistema
router.get('/', (_req, res) => {
    res.json({ ok: true, message: 'configuracion route up' })
})

export default router
