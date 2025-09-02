//import { Router } from 'express'

//const router = Router()
import express, { Router } from 'express'

// en vez de: const router = Router()
const router: Router = express.Router()

// Stub: añade endpoints de reportes después
router.get('/', (_req, res) => {
  res.json({ ok: true, message: 'reportes route up' })
})

export default router
