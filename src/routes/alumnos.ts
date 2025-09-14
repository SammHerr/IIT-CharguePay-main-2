


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
    // ✅ Manejo de validación segura
    let filters: AlumnoFilters
    try {
      filters = alumnoFiltersSchema.parse(req.query) as AlumnoFilters
    } catch (validationError) {
      res.status(400).json({
        success: false,
        error: 'Parámetros inválidos',
        details: (validationError as Error).message
      })
      return
    }

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

    // ✅ Contar total con query independiente (evita replace raro)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM alumnos a
      JOIN planes p ON a.plan_id = p.id
      WHERE 1=1
    `
    const countRow = await DatabaseService.queryOne<{ total: number }>(countQuery, params)
    const total = Number(countRow?.total ?? 0)

    // ✅ Ordenamiento seguro
    const allowedSort = new Set([
      'id', 'nombre', 'matricula', 'fecha_inscripcion', 'fecha_inicio',
      'fecha_vigencia', 'estatus', 'plan_id'
    ])
    const sortBy = (filters.sortBy && allowedSort.has(filters.sortBy)) ? filters.sortBy : 'id'
    const sortOrder = (filters.sortOrder?.toLowerCase() === 'asc' ? 'asc' : 'desc')
    query += ` ORDER BY a.${sortBy} ${sortOrder.toUpperCase()}`

    // ✅ Paginación
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
    console.error("❌ Error listando alumnos:", error)
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

    // 🔧 Validar si ya existe la matrícula
    const existeMatricula = await DatabaseService.queryOne<{ total: number }>(
      'SELECT COUNT(*) as total FROM alumnos WHERE matricula = ?',
      [data.matricula]
    )
    if ((existeMatricula?.total ?? 0) > 0) {
      res.status(400).json({ success: false, error: 'La matrícula ya existe' })
      return
    }

    // Cargar datos del plan
    const plan = await DatabaseService.queryOne<{
      vigencia_meses: number
      numero_mensualidades: number
      precio_mensualidad: number
    }>(
      'SELECT vigencia_meses, numero_mensualidades, precio_mensualidad FROM planes WHERE id = ?',
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

    // Asegurar que tomamos el insertId correctamente
    const result = await DatabaseService.insert(insertQuery, insertParams)
    const alumnoId = (result as any).insertId ?? result

    // --------- generar calendario de mensualidades ----------
    const existeMensualidad = await DatabaseService.queryOne<{ total: number }>(
      'SELECT COUNT(*) as total FROM mensualidades WHERE alumno_id = ?',
      [alumnoId]
    )

    if ((existeMensualidad?.total ?? 0) === 0) {
      const diaInicio = fechaInicio.getDate()

      for (let i = 1; i <= plan.numero_mensualidades; i++) {
        const venc = new Date(fechaInicio)
        venc.setMonth(venc.getMonth() + (i - 1))
        venc.setDate(diaInicio)

        const fechaVenc = venc.toISOString().split('T')[0]

        await DatabaseService.insert(
          `INSERT INTO mensualidades
            (alumno_id, numero_mensualidad, monto, fecha_vencimiento, estatus)
            VALUES (?, ?, ?, ?, ?)`,
          [alumnoId, i, plan.precio_mensualidad, fechaVenc, 'pendiente']
        )
      }
    }
    // --------------------------------------------------------

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
    console.error("❌ Error en POST /api/alumnos:", error)
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

