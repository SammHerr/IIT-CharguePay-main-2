import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export interface ApiError extends Error {
  statusCode?: number
  code?: string
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error)

  // Error de validación Zod
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Datos inválidos',
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    })
  }

  // Errores de base de datos MySQL
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      error: 'Ya existe un registro con estos datos'
    })
  }

  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      error: 'Referencia inválida a otro registro'
    })
  }

  if (error.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      error: 'Error de conexión a la base de datos'
    })
  }

  // Error de autenticación
  if (error.name === 'UnauthorizedError' || error.statusCode === 401) {
    return res.status(401).json({
      success: false,
      error: 'No autorizado'
    })
  }

  // Error de permisos
  if (error.statusCode === 403) {
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado'
    })
  }

  // Error no encontrado
  if (error.statusCode === 404) {
    return res.status(404).json({
      success: false,
      error: 'Recurso no encontrado'
    })
  }

  // Error genérico del servidor
  const statusCode = error.statusCode || 500
  res.status(statusCode).json({
    success: false,
    error: error.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  })
}
