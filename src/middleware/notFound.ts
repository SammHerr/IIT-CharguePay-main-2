import { Request, Response } from 'express'

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Ruta ${req.originalUrl} no encontrada`
  })
}
