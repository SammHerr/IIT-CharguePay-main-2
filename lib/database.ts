// Configuración de conexión a MySQL
import mysql from 'mysql2/promise'

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gestion_educativa',
  port: parseInt(process.env.DB_PORT || '3306'),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
}

// Pool de conexiones
const pool = mysql.createPool(dbConfig)

export class DatabaseService {
  
  /**
   * Ejecutar consulta SQL
   */
  static async query(sql: string, params: any[] = []): Promise<any> {
    try {
      const [results] = await pool.execute(sql, params)
      return results
    } catch (error) {
      console.error('Database query error:', error)
      throw new Error('Error en la consulta a la base de datos')
    }
  }

  /**
   * Obtener un solo registro
   */
  static async queryOne(sql: string, params: any[] = []): Promise<any> {
    const results = await this.query(sql, params)
    return Array.isArray(results) && results.length > 0 ? results[0] : null
  }

  /**
   * Insertar registro y obtener ID
   */
  static async insert(sql: string, params: any[] = []): Promise<number> {
    const result: any = await this.query(sql, params)
    return result.insertId
  }

  /**
   * Actualizar registro
   */
  static async update(sql: string, params: any[] = []): Promise<number> {
    const result: any = await this.query(sql, params)
    return result.affectedRows
  }

  /**
   * Eliminar registro
   */
  static async delete(sql: string, params: any[] = []): Promise<number> {
    const result: any = await this.query(sql, params)
    return result.affectedRows
  }

  /**
   * Ejecutar transacción
   */
  static async transaction(queries: { sql: string; params?: any[] }[]): Promise<any[]> {
    const connection = await pool.getConnection()
    
    try {
      await connection.beginTransaction()
      
      const results = []
      for (const query of queries) {
        const [result] = await connection.execute(query.sql, query.params || [])
        results.push(result)
      }
      
      await connection.commit()
      return results
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  /**
   * Cerrar pool de conexiones
   */
  static async close(): Promise<void> {
    await pool.end()
  }
}

// Modelos de datos
export interface Alumno {
  id?: number
  matricula: string
  nombre: string
  apellido_paterno: string
  apellido_materno?: string
  fecha_nacimiento?: string
  telefono?: string
  email?: string
  direccion?: string
  contacto_emergencia?: string
  telefono_emergencia?: string
  fecha_inscripcion: string
  fecha_inicio: string
  plan_id: number
  fecha_vigencia: string
  estatus: 'activo' | 'graduado' | 'baja' | 'suspendido'
  motivo_baja?: string
  foto_url?: string
  documentos_url?: string[]
}

export interface Plan {
  id?: number
  nombre: string
  numero_mensualidades: number
  precio_mensualidad: number
  precio_inscripcion: number
  vigencia_meses: number
  extension_meses: number
  activo: boolean
}

export interface Pago {
  id?: number
  numero_recibo: string
  alumno_id: number
  mensualidad_id?: number
  tipo_pago: 'mensualidad' | 'inscripcion' | 'moratorio' | 'otro'
  concepto: string
  monto: number
  moratorio: number
  total: number
  forma_pago: 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque'
  referencia?: string
  fecha_pago: string
  fecha_vencimiento?: string
  dias_retraso: number
  usuario_id: number
  observaciones?: string
  comprobante_url?: string
  estatus: 'activo' | 'cancelado'
}

export interface Mensualidad {
  id?: number
  alumno_id: number
  numero_mensualidad: number
  fecha_vencimiento: string
  monto: number
  estatus: 'pendiente' | 'pagado' | 'vencido' | 'cancelado'
}
