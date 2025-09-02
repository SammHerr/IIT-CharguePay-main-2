/*
//import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { DatabaseService } from '../config/database'
import { loginSchema, registerSchema } from '../validations/schemas'

//const router = Router()
import express, { Router } from 'express'

// en vez de: const router = Router()
const router: Router = express.Router()

// POST /api/auth/login - Iniciar sesión
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body)
    
    // Buscar usuario
    const user = await DatabaseService.queryOne(
      'SELECT id, email, password, rol, activo FROM usuarios WHERE email = ?',
      [email]
    )
    
    if (!user || !user.activo) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      })
    }
    
    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password)
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      })
    }
    
    // Generar token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        rol: user.rol 
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    )
    
    // Actualizar último acceso
    await DatabaseService.update(
      'UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    )
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          rol: user.rol
        }
      },
      message: 'Inicio de sesión exitoso'
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/auth/register - Registrar usuario (solo admin)
router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body)
    
    // Verificar si el email ya existe
    const existingUser = await DatabaseService.queryOne(
      'SELECT id FROM usuarios WHERE email = ?',
      [data.email]
    )
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'El email ya está registrado'
      })
    }
    
    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(data.password, 10)
    
    // Insertar usuario
    const userId = await DatabaseService.insert(
      'INSERT INTO usuarios (nombre, email, password, rol, activo) VALUES (?, ?, ?, ?, ?)',
      [data.nombre, data.email, hashedPassword, data.rol || 'cajero', true]
    )
    
    const newUser = await DatabaseService.queryOne(
      'SELECT id, nombre, email, rol, activo FROM usuarios WHERE id = ?',
      [userId]
    )
    
    res.status(201).json({
      success: true,
      data: newUser,
      message: 'Usuario registrado exitosamente'
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/auth/refresh - Renovar token
router.post('/refresh', async (req, res, next) => {
  try {
    const { token } = req.body
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token requerido'
      })
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
    
    // Verificar que el usuario existe y está activo
    const user = await DatabaseService.queryOne(
      'SELECT id, email, rol, activo FROM usuarios WHERE id = ?',
      [decoded.userId]
    )
    
    if (!user || !user.activo) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no válido'
      })
    }
    
    // Generar nuevo token
    const newToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        rol: user.rol 
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    )
    
    res.json({
      success: true,
      data: { token: newToken },
      message: 'Token renovado exitosamente'
    })
  } catch (error) {
    next(error)
  }
})

export default router
*/

import express, { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { DatabaseService } from '../config/database'
import { loginSchema, registerSchema } from '../validations/schemas'

const router: Router = express.Router()

// JWT secret (corchetes para evitar TS4111)
const JWT_SECRET: string = process.env['JWT_SECRET'] ?? 'secret'

// Helpers de tipos mínimos
type DbUser = {
  id: number
  nombre?: string
  email: string
  rol: string
  activo: boolean | number
  password?: string // viene de password_hash AS password
}

/**
 * POST /api/auth/login - Iniciar sesión
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = loginSchema.parse(req.body)

    // Buscar usuario (tomamos password_hash con alias para no cambiar tu lógica)
    const user = await DatabaseService.queryOne<DbUser>(
      `SELECT id, nombre, email, rol, activo, password_hash AS password
         FROM usuarios
        WHERE email = ?
        LIMIT 1`,
      [email]
    )

    if (!user || !user.activo) {
      res.status(401).json({ success: false, error: 'Credenciales inválidas' })
      return
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password ?? '')
    if (!isValidPassword) {
      res.status(401).json({ success: false, error: 'Credenciales inválidas' })
      return
    }

    // Generar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    // Actualizar último acceso
    await DatabaseService.update(
      'UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    )

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol
        }
      },
      message: 'Inicio de sesión exitoso'
    })
  } catch (error) {
    // delega al middleware de errores
    // (si el zod.parse falla entrará aquí)
    res.status(400).json({ success: false, error: 'Solicitud inválida' })
  }
})

/**
 * POST /api/auth/register - Registrar usuario (solo admin)
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = registerSchema.parse(req.body)

    // Verificar si el email ya existe
    const existingUser = await DatabaseService.queryOne<{ id: number }>(
      'SELECT id FROM usuarios WHERE email = ? LIMIT 1',
      [data.email]
    )
    if (existingUser) {
      res.status(409).json({ success: false, error: 'El email ya está registrado' })
      return
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // Insertar usuario (columna password_hash)
    const userId = await DatabaseService.insert(
      `INSERT INTO usuarios (nombre, email, password_hash, rol, activo)
       VALUES (?, ?, ?, ?, ?)`,
      [data.nombre, data.email, hashedPassword, data.rol || 'cajero', true]
    )

    const newUser = await DatabaseService.queryOne<DbUser>(
      'SELECT id, nombre, email, rol, activo FROM usuarios WHERE id = ?',
      [userId]
    )

    res.status(201).json({
      success: true,
      data: newUser,
      message: 'Usuario registrado exitosamente'
    })
  } catch (error) {
    res.status(400).json({ success: false, error: 'Solicitud inválida' })
  }
})

/**
 * POST /api/auth/refresh - Renovar token
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = (req.body ?? {}) as { token?: string }

    if (!token) {
      res.status(401).json({ success: false, error: 'Token requerido' })
      return
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number }

    // Verificar que el usuario existe y está activo
    const user = await DatabaseService.queryOne<DbUser>(
      'SELECT id, email, rol, activo FROM usuarios WHERE id = ?',
      [decoded.userId]
    )
    if (!user || !user.activo) {
      res.status(401).json({ success: false, error: 'Usuario no válido' })
      return
    }

    // Generar nuevo token
    const newToken = jwt.sign(
      { userId: user.id, email: user.email, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      success: true,
      data: { token: newToken },
      message: 'Token renovado exitosamente'
    })
  } catch (error) {
    res.status(401).json({ success: false, error: 'Token inválido o expirado' })
  }
})

export default router
