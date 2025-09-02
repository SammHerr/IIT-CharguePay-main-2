//import { Router } from 'express'

//const router = Router()

import express, { Router } from 'express'

// en vez de: const router = Router()
const router: Router = express.Router()


// Stub: por ahora solo confirma que la ruta existe
router.get('/', async (_req, res) => {
  res.json({ ok: true, data: [], message: 'pagos route up' })
})

export default router
