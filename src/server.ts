
/*
// src/server.ts
import express, { type Request, type Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'

import alumnosRoutes from './routes/alumnos'
import pagosRoutes from './routes/pagos'
import planesRoutes from './routes/planes'
import dashboardRoutes from './routes/dashboard'
import reportesRoutes from './routes/reportes'
import configuracionRoutes from './routes/configuracion'
import authRoutes from './routes/auth'

import { errorHandler } from './middleware/errorHandler'
import { notFound } from './middleware/notFound'
import { rateLimiter } from './middleware/rateLimiter'
// opcional: health DB
// import { DatabaseService } from './config/database'

dotenv.config()

const app: express.Application = express()

// Lee env con notación de corchetes para evitar TS4111
const PORT = Number(process.env['PORT'] ?? 3001)
const FRONTEND_URL = process.env['FRONTEND_URL'] ?? 'http://localhost:3000'
const APP_VERSION = process.env['npm_package_version'] ?? '1.0.0'
const NODE_ENV = process.env['NODE_ENV'] ?? 'development'

// Seguridad
app.use(helmet())
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}))

// Generales
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Rate limiting
app.use(rateLimiter)

// Health HTTP
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
  })
})

// Health DB (opcional)
// app.get('/health-db', async (_req: Request, res: Response) => {
//   res.json({ ok: await DatabaseService.testConnection() })
// })

// Rutas API
app.use('/api/auth', authRoutes)
app.use('/api/alumnos', alumnosRoutes)
app.use('/api/pagos', pagosRoutes)
app.use('/api/planes', planesRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/reportes', reportesRoutes)
app.use('/api/configuracion', configuracionRoutes)

// 404 y errores
app.use(notFound)
app.use(errorHandler)

// Start
app.listen(PORT, () => {
  console.log(`🚀 Servidor API ejecutándose en puerto ${PORT}`)
  console.log(`📊 Health: http://localhost:${PORT}/health`)
  console.log(`🌍 Entorno: ${NODE_ENV}`)
  
})

export default app
*/

// src/server.ts
import express, { type Request, type Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser' // ← NUEVOs

import alumnosRoutes from './routes/alumnos'
import pagosRoutes from './routes/pagos'
import planesRoutes from './routes/planes'
import dashboardRoutes from './routes/dashboard'
import reportesRoutes from './routes/reportes'
import configuracionRoutes from './routes/configuracion'
import authRoutes from './routes/auth'

import { errorHandler } from './middleware/errorHandler'
import { notFound } from './middleware/notFound'
import { rateLimiter } from './middleware/rateLimiter'
// opcional: health DB
// import { DatabaseService } from './config/database'

dotenv.config()

const app: express.Application = express()

// Lee env con notación de corchetes para evitar TS4111
const PORT = Number(process.env['PORT'] ?? 3001)
const FRONTEND_URL = process.env['FRONTEND_URL'] ?? 'http://localhost:3000'
const APP_VERSION = process.env['npm_package_version'] ?? '1.0.0'
const NODE_ENV = process.env['NODE_ENV'] ?? 'development'

app.set("etag", false);
app.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

// Seguridad
app.use(helmet())
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}))

// Generales
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser()) // ← NUEVO: habilita lectura/escritura de cookies (token)

// Rate limiting
app.use(rateLimiter)

// Health HTTP
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
  })
})

// Health DB (opcional)
// app.get('/health-db', async (_req: Request, res: Response) => {
//   res.json({ ok: await DatabaseService.testConnection() })
// })

// Rutas API
app.use('/api/auth', authRoutes)
app.use('/api/alumnos', alumnosRoutes)
app.use('/api/pagos', pagosRoutes)
app.use('/api/planes', planesRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/reportes', reportesRoutes)
app.use('/api/configuracion', configuracionRoutes)

// 404 y errores
app.use(notFound)
app.use(errorHandler)

// Start
app.listen(PORT, () => {
  console.log(`🚀 Servidor API ejecutándose en puerto ${PORT}`)
  console.log(`📊 Health: http://localhost:${PORT}/health`)
  console.log(`🌍 Entorno: ${NODE_ENV}`)
  
})

export default app
