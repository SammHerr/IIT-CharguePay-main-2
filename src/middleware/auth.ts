import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { DatabaseService } from '../config/database'

export interface AuthRequest extends Request {
  user?: {
    id: number
    email: string
    rol: string
  }
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token de acceso requerido'
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
        error: 'Usuario no válido o inactivo'
      })
    }

    req.user = {
      id: user.id,
      email: user.email,
      rol: user.rol
    }

    next()
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Token inválido'
    })
  }
}

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      })
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        error: 'Permisos insuficientes'
      })
    }

    next()
  }
}
