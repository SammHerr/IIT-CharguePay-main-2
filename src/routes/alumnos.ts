/*
//import { Router } from 'express'
import { DatabaseService } from '../config/database'
import { alumnoSchema, alumnoUpdateSchema, alumnoFiltersSchema } from '../validations/schemas'
import { authenticateToken, requireRole } from '../middleware/auth'
import { ApiResponse, AlumnoFilters } from '../types'


//const router = Router()
import express, { Router } from 'express'

// en vez de: const router = Router()
const router: Router = express.Router()

// Aplicar autenticación a todas las rutas
router.use(authenticateToken)

// GET /api/alumnos - Obtener lista de alumnos
router.get('/', async (req, res, next) => {
  try {
    const filters = alumnoFiltersSchema.parse(req.query) as AlumnoFilters
    
    let query = `
      SELECT 
        a.*,
        p.nombre as plan_nombre,
        (SELECT COUNT(*) FROM mensualidades m WHERE m.alumno_id = a.id AND m.estatus = 'pagado') as mensualidades_pagadas,
        (SELECT COUNT(*) FROM mensualidades m WHERE m.alumno_id = a.id AND m.estatus = 'pendiente') as mensualidades_pendientes,
        (SELECT COUNT(*) FROM mensualidades m WHERE m.alumno_id = a.id AND m.estatus = 'vencido') as mensualidades_vencidas,
        (SELECT SUM(pg.total) FROM pagos pg WHERE pg.alumno_id = a.id AND pg.estatus = 'activo') as total_pagado,
        (SELECT SUM(m.monto) FROM mensualidades m WHERE m.alumno_id = a.id AND m.estatus IN ('pendiente', 'vencido')) as saldo_pendiente
      FROM alumnos a
      JOIN planes p ON a.plan_id = p.id
      WHERE 1=1
    `
    
    const params: any[] = []
    
    if (filters.search) {
      query += ` AND (a.nombre LIKE ? OR a.apellido_paterno LIKE ? OR a.matricula LIKE ? OR a.email LIKE ?)`
      const searchTerm = `%${filters.search}%`
      params.push(searchTerm, searchTerm, searchTerm, searchTerm)
    }
    
    if (filters.estatus) {
      query += ` AND a.estatus = ?`
      params.push(filters.estatus)
    }
    
    if (filters.plan_id) {
      query += ` AND a.plan_id = ?`
      params.push(filters.plan_id)
    }
    
    if (filters.fecha_inicio_desde) {
      query += ` AND a.fecha_inicio >= ?`
      params.push(filters.fecha_inicio_desde)
    }
    
    if (filters.fecha_inicio_hasta) {
      query += ` AND a.fecha_inicio <= ?`
      params.push(filters.fecha_inicio_hasta)
    }
    
    // Contar total
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM')
    const [{ total }] = await DatabaseService.query(countQuery, params)
    
    // Ordenamiento
    const sortBy = filters.sortBy || 'fecha_creacion'
    const sortOrder = filters.sortOrder || 'desc'
    query += ` ORDER BY a.${sortBy} ${sortOrder.toUpperCase()}`
    
    // Paginación
    const page = filters.page || 1
    const limit = filters.limit || 10
    const offset = (page - 1) * limit
    query += ` LIMIT ? OFFSET ?`
    params.push(limit, offset)
    
    const alumnos = await DatabaseService.query(query, params)
    
    const response: ApiResponse = {
      success: true,
      data: alumnos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
    
    res.json(response)
  } catch (error) {
    next(error)
  }
})

// POST /api/alumnos - Crear nuevo alumno
router.post('/', requireRole(['admin', 'coordinador']), async (req, res, next) => {
  try {
    const data = alumnoSchema.parse(req.body)
    
    // Generar matrícula si no se proporciona
    if (!data.matricula) {
      const year = new Date().getFullYear()
      const count = await DatabaseService.queryOne(
        'SELECT COUNT(*) as total FROM alumnos WHERE YEAR(fecha_creacion) = ?',
        [year]
      )
      data.matricula = `IIT-${year}-${String(count.total + 1).padStart(3, '0')}`
    }
    
    // Calcular fecha de vigencia
    const plan = await DatabaseService.queryOne(
      'SELECT vigencia_meses FROM planes WHERE id = ?',
      [data.plan_id]
    )
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan no encontrado'
      })
    }
    
    const fechaInicio = new Date(data.fecha_inicio)
    const fechaVigencia = new Date(fechaInicio)
    fechaVigencia.setMonth(fechaVigencia.getMonth() + plan.vigencia_meses)
    
    const insertQuery = `
      INSERT INTO alumnos (
        matricula, nombre, apellido_paterno, apellido_materno, fecha_nacimiento,
        genero, telefono, email, direccion, ciudad, estado, codigo_postal,
        contacto_emergencia, telefono_emergencia, relacion_emergencia,
        fecha_inscripcion, fecha_inicio, plan_id, fecha_vigencia, estatus,
        motivo_baja, notas, foto_url, documentos_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    
    const insertParams = [
      data.matricula, data.nombre, data.apellido_paterno, data.apellido_materno,
      data.fecha_nacimiento, data.genero, data.telefono, data.email,
      data.direccion, data.ciudad, data.estado, data.codigo_postal,
      data.contacto_emergencia, data.telefono_emergencia, data.relacion_emergencia,
      data.fecha_inscripcion, data.fecha_inicio, data.plan_id,
      fechaVigencia.toISOString().split('T')[0], data.estatus,
      data.motivo_baja, data.notas, data.foto_url,
      data.documentos_url ? JSON.stringify(data.documentos_url) : null
    ]
    
    const alumnoId = await DatabaseService.insert(insertQuery, insertParams)
    
    const nuevoAlumno = await DatabaseService.queryOne(`
      SELECT 
        a.*,
        p.nombre as plan_nombre
      FROM alumnos a
      JOIN planes p ON a.plan_id = p.id
      WHERE a.id = ?
    `, [alumnoId])
    
    res.status(201).json({
      success: true,
      data: nuevoAlumno,
      message: 'Alumno creado exitosamente'
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/alumnos/:id - Obtener alumno por ID
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      })
    }
    
    const alumno = await DatabaseService.queryOne(`
      SELECT 
        a.*,
        p.nombre as plan_nombre,
        p.numero_mensualidades,
        p.precio_mensualidad
      FROM alumnos a
      JOIN planes p ON a.plan_id = p.id
      WHERE a.id = ?
    `, [id])
    
    if (!alumno) {
      return res.status(404).json({
        success: false,
        error: 'Alumno no encontrado'
      })
    }
    
    res.json({
      success: true,
      data: alumno
    })
  } catch (error) {
    next(error)
  }
})

// PUT /api/alumnos/:id - Actualizar alumno
router.put('/:id', requireRole(['admin', 'coordinador']), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      })
    }
    
    const data = alumnoUpdateSchema.parse(req.body)
    
    const existingAlumno = await DatabaseService.queryOne(
      'SELECT id FROM alumnos WHERE id = ?',
      [id]
    )
    
    if (!existingAlumno) {
      return res.status(404).json({
        success: false,
        error: 'Alumno no encontrado'
      })
    }
    
    const updateFields: string[] = []
    const updateParams: any[] = []
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'documentos_url') {
          updateFields.push(`${key} = ?`)
          updateParams.push(JSON.stringify(value))
        } else {
          updateFields.push(`${key} = ?`)
          updateParams.push(value)
        }
      }
    })
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No hay campos para actualizar'
      })
    }
    
    updateParams.push(id)
    
    const updateQuery = `
      UPDATE alumnos 
      SET ${updateFields.join(', ')}, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    
    await DatabaseService.update(updateQuery, updateParams)
    
    const alumnoActualizado = await DatabaseService.queryOne(`
      SELECT 
        a.*,
        p.nombre as plan_nombre
      FROM alumnos a
      JOIN planes p ON a.plan_id = p.id
      WHERE a.id = ?
    `, [id])
    
    res.json({
      success: true,
      data: alumnoActualizado,
      message: 'Alumno actualizado exitosamente'
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/alumnos/:id - Eliminar alumno (soft delete)
router.delete('/:id', requireRole(['admin']), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      })
    }
    
    const existingAlumno = await DatabaseService.queryOne(
      'SELECT id, estatus FROM alumnos WHERE id = ?',
      [id]
    )
    
    if (!existingAlumno) {
      return res.status(404).json({
        success: false,
        error: 'Alumno no encontrado'
      })
    }
    
    await DatabaseService.update(
      'UPDATE alumnos SET estatus = ?, motivo_baja = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?',
      ['baja', 'Eliminado por sistema', id]
    )
    
    res.json({
      success: true,
      message: 'Alumno eliminado exitosamente'
    })
  } catch (error) {
    next(error)
  }
})

export default router

*/

import express, { Router, type Request, type Response } from 'express'
import { DatabaseService } from '../config/database'
import { alumnoSchema, alumnoUpdateSchema, alumnoFiltersSchema } from '../validations/schemas'
import { authenticateToken, requireRole } from '../middleware/auth'
import { ApiResponse, AlumnoFilters } from '../types'

const router: Router = express.Router()

// ---- helpers ----
function getParamId(req: Request, res: Response): number | null {
  const idRaw = (req.params as Record<string, string | undefined>)['id']
  const id = Number(idRaw)
  if (!idRaw || Number.isNaN(id)) {
    res.status(400).json({ success: false, error: 'ID inválido' })
    return null
  }
  return id
}

// Aplicar autenticación a todas las rutas
router.use(authenticateToken)

// GET /api/alumnos - Obtener lista de alumnos
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = alumnoFiltersSchema.parse(req.query) as AlumnoFilters

    let query = `
      SELECT 
        a.*,
        p.nombre as plan_nombre,
        (SELECT COUNT(*) FROM mensualidades m WHERE m.alumno_id = a.id AND m.estatus = 'pagado') as mensualidades_pagadas,
        (SELECT COUNT(*) FROM mensualidades m WHERE m.alumno_id = a.id AND m.estatus = 'pendiente') as mensualidades_pendientes,
        (SELECT COUNT(*) FROM mensualidades m WHERE m.alumno_id = a.id AND m.estatus = 'vencido') as mensualidades_vencidas,
        (SELECT SUM(pg.total) FROM pagos pg WHERE pg.alumno_id = a.id AND pg.estatus = 'activo') as total_pagado,
        (SELECT SUM(m.monto) FROM mensualidades m WHERE m.alumno_id = a.id AND m.estatus IN ('pendiente', 'vencido')) as saldo_pendiente
      FROM alumnos a
      JOIN planes p ON a.plan_id = p.id
      WHERE 1=1
    `

    const params: any[] = []

    if (filters.search) {
      query += ` AND (a.nombre LIKE ? OR a.apellido_paterno LIKE ? OR a.matricula LIKE ? OR a.email LIKE ?)`
      const searchTerm = `%${filters.search}%`
      params.push(searchTerm, searchTerm, searchTerm, searchTerm)
    }

    if (filters.estatus) {
      query += ` AND a.estatus = ?`
      params.push(filters.estatus)
    }

    if (filters.plan_id) {
      query += ` AND a.plan_id = ?`
      params.push(filters.plan_id)
    }

    if (filters.fecha_inicio_desde) {
      query += ` AND a.fecha_inicio >= ?`
      params.push(filters.fecha_inicio_desde)
    }

    if (filters.fecha_inicio_hasta) {
      query += ` AND a.fecha_inicio <= ?`
      params.push(filters.fecha_inicio_hasta)
    }

    // Contar total
    // const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM')
    // const [{ total }] = await DatabaseService.query<{ total: number }>(countQuery, params)

    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM')
    const countRow = await DatabaseService.queryOne<{ total: number }>(countQuery, params)
    const total = Number(countRow?.total ?? 0)

    // Ordenamiento
    const sortBy = filters.sortBy || 'fecha_creacion'
    const sortOrder = (filters.sortOrder || 'desc').toUpperCase()
    query += ` ORDER BY a.${sortBy} ${sortOrder}`

    // Paginación
    const page = filters.page || 1
    const limit = filters.limit || 10
    const offset = (page - 1) * limit
    query += ` LIMIT ? OFFSET ?`
    params.push(limit, offset)

    const alumnos = await DatabaseService.query<any>(query, params)

    const response: ApiResponse = {
      success: true,
      data: alumnos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }

    res.json(response)
  } catch (error) {
    // delega al middleware de errores global
    res.status(500).json({ success: false, error: 'Error listando alumnos' })
  }
})

// POST /api/alumnos - Crear nuevo alumno
router.post('/', requireRole(['admin', 'coordinador']), async (req: Request, res: Response): Promise<void> => {
  try {
    const data = alumnoSchema.parse(req.body)

    // Generar matrícula si no se proporciona
    if (!data.matricula) {
      const year = new Date().getFullYear()
      const count = await DatabaseService.queryOne<{ total: number }>(
        'SELECT COUNT(*) as total FROM alumnos WHERE YEAR(fecha_creacion) = ?',
        [year]
      )
      const consecutivo = String((count?.total ?? 0) + 1).padStart(3, '0')
      data.matricula = `IIT-${year}-${consecutivo}`
    }

    // Calcular fecha de vigencia
    const plan = await DatabaseService.queryOne<{ vigencia_meses: number }>(
      'SELECT vigencia_meses FROM planes WHERE id = ?',
      [data.plan_id]
    )

    if (!plan) {
      res.status(404).json({ success: false, error: 'Plan no encontrado' })
      return
    }

    const fechaInicio = new Date(data.fecha_inicio)
    const fechaVigencia = new Date(fechaInicio)
    fechaVigencia.setMonth(fechaVigencia.getMonth() + plan.vigencia_meses)

    const insertQuery = `
      INSERT INTO alumnos (
        matricula, nombre, apellido_paterno, apellido_materno, fecha_nacimiento,
        genero, telefono, email, direccion, ciudad, estado, codigo_postal,
        contacto_emergencia, telefono_emergencia, relacion_emergencia,
        fecha_inscripcion, fecha_inicio, plan_id, fecha_vigencia, estatus,
        motivo_baja, notas, foto_url, documentos_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    const insertParams = [
      data.matricula, data.nombre, data.apellido_paterno, data.apellido_materno,
      data.fecha_nacimiento, data.genero, data.telefono, data.email,
      data.direccion, data.ciudad, data.estado, data.codigo_postal,
      data.contacto_emergencia, data.telefono_emergencia, data.relacion_emergencia,
      data.fecha_inscripcion, data.fecha_inicio, data.plan_id,
      fechaVigencia.toISOString().split('T')[0], data.estatus,
      data.motivo_baja, data.notas, data.foto_url,
      data.documentos_url ? JSON.stringify(data.documentos_url) : null
    ]

    const alumnoId = await DatabaseService.insert(insertQuery, insertParams)

    const nuevoAlumno = await DatabaseService.queryOne<any>(`
      SELECT 
        a.*,
        p.nombre as plan_nombre
      FROM alumnos a
      JOIN planes p ON a.plan_id = p.id
      WHERE a.id = ?
    `, [alumnoId])

    res.status(201).json({
      success: true,
      data: nuevoAlumno,
      message: 'Alumno creado exitosamente'
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error creando alumno' })
  }
})

// GET /api/alumnos/:id - Obtener alumno por ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = getParamId(req, res)
    if (id === null) return

    const alumno = await DatabaseService.queryOne<any>(`
      SELECT 
        a.*,
        p.nombre as plan_nombre,
        p.numero_mensualidades,
        p.precio_mensualidad
      FROM alumnos a
      JOIN planes p ON a.plan_id = p.id
      WHERE a.id = ?
    `, [id])

    if (!alumno) {
      res.status(404).json({ success: false, error: 'Alumno no encontrado' })
      return
    }

    res.json({ success: true, data: alumno })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error obteniendo alumno' })
  }
})

// PUT /api/alumnos/:id - Actualizar alumno
router.put('/:id', requireRole(['admin', 'coordinador']), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = getParamId(req, res)
    if (id === null) return

    const data = alumnoUpdateSchema.parse(req.body)

    const existingAlumno = await DatabaseService.queryOne<{ id: number }>(
      'SELECT id FROM alumnos WHERE id = ?',
      [id]
    )

    if (!existingAlumno) {
      res.status(404).json({ success: false, error: 'Alumno no encontrado' })
      return
    }

    const updateFields: string[] = []
    const updateParams: any[] = []

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'documentos_url') {
          updateFields.push(`${key} = ?`)
          updateParams.push(JSON.stringify(value))
        } else {
          updateFields.push(`${key} = ?`)
          updateParams.push(value)
        }
      }
    })

    if (updateFields.length === 0) {
      res.status(400).json({ success: false, error: 'No hay campos para actualizar' })
      return
    }

    updateParams.push(id)

    const updateQuery = `
      UPDATE alumnos 
      SET ${updateFields.join(', ')}, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `

    await DatabaseService.update(updateQuery, updateParams)

    const alumnoActualizado = await DatabaseService.queryOne<any>(`
      SELECT 
        a.*,
        p.nombre as plan_nombre
      FROM alumnos a
      JOIN planes p ON a.plan_id = p.id
      WHERE a.id = ?
    `, [id])

    res.json({
      success: true,
      data: alumnoActualizado,
      message: 'Alumno actualizado exitosamente'
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error actualizando alumno' })
  }
})

// DELETE /api/alumnos/:id - Eliminar alumno (soft delete)
router.delete('/:id', requireRole(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = getParamId(req, res)
    if (id === null) return

    const existingAlumno = await DatabaseService.queryOne<{ id: number; estatus: string }>(
      'SELECT id, estatus FROM alumnos WHERE id = ?',
      [id]
    )

    if (!existingAlumno) {
      res.status(404).json({ success: false, error: 'Alumno no encontrado' })
      return
    }

    await DatabaseService.update(
      'UPDATE alumnos SET estatus = ?, motivo_baja = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?',
      ['baja', 'Eliminado por sistema', id]
    )

    res.json({ success: true, message: 'Alumno eliminado exitosamente' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error eliminando alumno' })
  }
})

export default router

