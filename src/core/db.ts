import 'dotenv/config'
import mysql, {
    Pool,
    PoolOptions,
    PoolConnection,
    RowDataPacket,
    ResultSetHeader,
} from 'mysql2/promise'

type QueryPrimitive = string | number | boolean | null | Date | Buffer
type QueryParams = QueryPrimitive[] | Record<string, QueryPrimitive>

class _DatabaseService {
  private pool: Pool

  constructor() {
    const cfg: PoolOptions = {
        host: process.env['DB_HOST'] ?? '127.0.0.1',
        port: Number(process.env['DB_PORT'] ?? 3306),
        user: process.env['DB_USER'] ?? 'root',
        password: process.env['DB_PASSWORD'] ?? '',
        database: process.env['DB_NAME'] ?? 'gestion_educativa',
        waitForConnections: true,
        connectionLimit: Number(process.env['DB_POOL'] ?? 10),
        timezone: 'Z',
        dateStrings: false,
    }
    this.pool = mysql.createPool(cfg)
}

    async testConnection(): Promise<boolean> {
    const conn = await this.pool.getConnection()
    try {
        await conn.ping()
        return true
    } finally {
        conn.release()
    }
}

    async query<T = any>(sql: string, params?: QueryParams): Promise<T[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(sql, params as any)
    return rows as unknown as T[]
}

    async queryOne<T = any>(sql: string, params?: QueryParams): Promise<T | null> {
    const rows = await this.query<T>(sql, params)
    const first = rows[0] // T | undefined porque noUncheckedIndexedAccess está activo
    return first === undefined ? null : (first as T)
}

    async insert(sql: string, params?: QueryParams): Promise<number> {
    const [res] = await this.pool.query<ResultSetHeader>(sql, params as any)
    return res.insertId
}

    async update(sql: string, params?: QueryParams): Promise<number> {
    const [res] = await this.pool.query<ResultSetHeader>(sql, params as any)
    return res.affectedRows
}

    async transaction<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
    const conn = await this.pool.getConnection()
    try {
        await conn.beginTransaction()
        const out = await fn(conn)
        await conn.commit()
        return out
    } catch (e) {
        await conn.rollback()
        throw e
    } finally {
        conn.release()
    }
    }
}

export const DatabaseService = new _DatabaseService()
