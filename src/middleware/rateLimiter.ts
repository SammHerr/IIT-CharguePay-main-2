/*import { Request, Response, NextFunction } from 'express'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}
const WINDOW_MS = 15 * 60 * 1000 // 15 minutos
const MAX_REQUESTS = 100 // máximo 100 requests por ventana

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown'
  const now = Date.now()
  
  // Limpiar entradas expiradas
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
  
  // Inicializar o actualizar contador para esta IP
  if (!store[ip]) {
    store[ip] = {
      count: 1,
      resetTime: now + WINDOW_MS
    }
  } else {
    store[ip].count++
  }
  
  // Verificar límite
  if (store[ip].count > MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
      retryAfter: Math.ceil((store[ip].resetTime - now) / 1000)
    })
  }
  
  // Agregar headers informativos
  res.set({
    'X-RateLimit-Limit': MAX_REQUESTS.toString(),
    'X-RateLimit-Remaining': (MAX_REQUESTS - store[ip].count).toString(),
    'X-RateLimit-Reset': new Date(store[ip].resetTime).toISOString()
  })
  
  next()
}
*/

import { Request, Response, NextFunction } from 'express'

interface RateLimitEntry {
  count: number
  resetTime: number
}
interface RateLimitStore {
  [key: string]: RateLimitEntry | undefined
}

const store: RateLimitStore = {}
const WINDOW_MS = 15 * 60 * 1000 // 15 minutos
const MAX_REQUESTS = 100          // máximo 100 requests por ventana

export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const ip = req.ip ?? req.socket?.remoteAddress ?? 'unknown'
  const now = Date.now()

  // Limpiar entradas expiradas
  for (const key of Object.keys(store)) {
    const entry = store[key]
    if (entry && entry.resetTime < now) {
      delete store[key]
    }
  }

  // Inicializar o actualizar contador para esta IP
  let record = store[ip]
  if (!record) {
    record = store[ip] = {
      count: 1,
      resetTime: now + WINDOW_MS,
    }
  } else {
    record.count++
  }

  // Verificar límite
  if (record.count > MAX_REQUESTS) {
    res.status(429).json({
      success: false,
      error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
      retryAfter: Math.ceil((record.resetTime - now) / 1000),
    })
    return
  }

  // Agregar headers informativos
  res.set({
    'X-RateLimit-Limit': String(MAX_REQUESTS),
    'X-RateLimit-Remaining': String(MAX_REQUESTS - record.count),
    'X-RateLimit-Reset': new Date(record.resetTime).toISOString(),
  })

  next()
}
