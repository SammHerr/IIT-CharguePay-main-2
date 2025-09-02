/*import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'sistema_educativo',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
}

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig)

export class DatabaseService {
  static async query(sql: string, params: any[] = []): Promise<any[]> {
    try {
      const [rows] = await pool.execute(sql, params)
      return rows as any[]
    } catch (error) {
      console.error('Database query error:', error)
      throw error
    }
  }

  static async queryOne(sql: string, params: any[] = []): Promise<any> {
    const rows = await this.query(sql, params)
    return rows[0] || null
  }

  static async insert(sql: string, params: any[] = []): Promise<number> {
    try {
      const [result] = await pool.execute(sql, params) as any
      return result.insertId
    } catch (error) {
      console.error('Database insert error:', error)
      throw error
    }
  }

  static async update(sql: string, params: any[] = []): Promise<number> {
    try {
      const [result] = await pool.execute(sql, params) as any
      return result.affectedRows
    } catch (error) {
      console.error('Database update error:', error)
      throw error
    }
  }

  static async delete(sql: string, params: any[] = []): Promise<number> {
    try {
      const [result] = await pool.execute(sql, params) as any
      return result.affectedRows
    } catch (error) {
      console.error('Database delete error:', error)
      throw error
    }
  }

  static async transaction<T>(callback: (connection: mysql.Connection) => Promise<T>): Promise<T> {
    const connection = await pool.getConnection()
    await connection.beginTransaction()
    
    try {
      const result = await callback(connection)
      await connection.commit()
      return result
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  static async testConnection(): Promise<boolean> {
    try {
      await pool.execute('SELECT 1')
      return true
    } catch (error) {
      console.error('Database connection test failed:', error)
      return false
    }
  }
}

export default pool

*/

// cambios realizados para mejorar la conexion a la base de datos
import mysql, { PoolOptions } from 'mysql2/promise'
import dotenv from 'dotenv'
dotenv.config()

const dbConfig: PoolOptions = {
  host: process.env['DB_HOST'] ?? 'localhost',
  port: Number(process.env['DB_PORT'] ?? 3306),
  user: process.env['DB_USER'] ?? 'root',
  password: process.env['DB_PASSWORD'] ?? '1234',
  database: process.env['DB_NAME'] ?? 'gestion_educativa',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // mejor usa connectTimeout en lugar de timeout:
  connectTimeout: 10000,
  // quita opciones que no existen en mysql2: acquireTimeout, timeout, reconnect
}

const pool = mysql.createPool(dbConfig)

export class DatabaseService {
  static async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const [rows] = await pool.execute(sql, params)
    return rows as T[]
  }
  static async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const [rows] = await pool.execute(sql, params)
    return (rows as T[])[0] ?? null
  }
  static async insert(sql: string, params: any[] = []): Promise<number> {
    const [result]: any = await pool.execute(sql, params)
    return result.insertId
  }
  static async update(sql: string, params: any[] = []): Promise<number> {
    const [result]: any = await pool.execute(sql, params)
    return result.affectedRows
  }
  static async testConnection(): Promise<boolean> {
    try { await pool.query('SELECT 1'); return true } catch { return false }
  }
}
