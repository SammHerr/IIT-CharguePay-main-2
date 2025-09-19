
// src/routes/dashboard.ts
import express, { Router, type Request, type Response } from "express"
import { DatabaseService } from "@/core/db"
import { authenticateToken } from "@/middleware/auth"

const router: Router = express.Router()

/**
 * GET /api/dashboard/summary?year=2025&month=9
 * Devuelve métricas de dashboard basadas en tu esquema real.
 */
router.get(
  "/summary",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      // req.query es ParsedQs => acceder con corchetes o castear
      const q = req.query as Record<string, string | undefined>

      const now = new Date()
      const year = Number(q["year"] ?? now.getFullYear())
      const month = Number(q["month"] ?? now.getMonth() + 1) // 1..12

      // Rango [start, end) en UTC (usaremos DATE() en SQL, así que importa menos el TZ)
      const start = new Date(Date.UTC(year, month - 1, 1))
      const end = new Date(Date.UTC(year, month, 1))

      // Para usar en MySQL como 'YYYY-MM-DD'
      const startStr = start.toISOString().slice(0, 10)
      const endStr = end.toISOString().slice(0, 10)

      // 1) Total de alumnos / activos
      const totalStudentsRow = await DatabaseService.queryOne<{ c: number }>(
        "SELECT COUNT(*) AS c FROM alumnos"
      )
      const activeStudentsRow = await DatabaseService.queryOne<{ c: number }>(
        "SELECT COUNT(*) AS c FROM alumnos WHERE estatus = 'activo'"
      )
      const totalStudents = Number(totalStudentsRow?.c ?? 0)
      const activeStudents = Number(activeStudentsRow?.c ?? 0)

      // 2) Monto esperado del mes: mensualidades que VENCEN en el mes
      const expectedRow = await DatabaseService.queryOne<{ expected: number }>(
        `SELECT COALESCE(SUM(monto),0) AS expected
         FROM mensualidades
         WHERE fecha_vencimiento >= ? AND fecha_vencimiento < ?`,
        [startStr, endStr]
      )
      const expectedAmount = Number(expectedRow?.expected ?? 0)

      // 3) Cobrado del mes: pagos ACTIVO cuyo fecha_pago cae en el mes (usar TOTAL)
      const collectedRow = await DatabaseService.queryOne<{ collected: number }>(
        `SELECT COALESCE(SUM(total),0) AS collected
         FROM pagos
         WHERE estatus = 'activo'
           AND fecha_pago >= ? AND fecha_pago < ?`,
        [startStr, `${endStr} 23:59:59`] // por seguridad, aunque comparamos DATETIME
      )
      const collectedAmount = Number(collectedRow?.collected ?? 0)

      /*
      // 4) Desglose por tipo de pago (mensualidad / moratorio / inscripcion)
      const byType = async (tipo: string) => {
        const row = await DatabaseService.queryOne<{ amount: number }>(
          `SELECT COALESCE(SUM(total),0) AS amount
           FROM pagos
           WHERE estatus = 'activo' AND tipo_pago = ?
             AND fecha_pago >= ? AND fecha_pago < ?`,
          [tipo, startStr, `${endStr} 23:59:59`]
        )
        return Number(row?.amount ?? 0)
      }

      const monthlyNormal = await byType("mensualidad")
      const totalLateFees = await byType("moratorio")
      const inscriptions = await byType("inscripcion")*/

      // 4) Desglose por tipo de pago (TODOS los tipos)
      type ByTypeRow = {
        mensualidad: number
        inscripcion: number
        moratorio: number
        extension: number
        otro: number
        ajuste: number
        collected: number
        moratorio_column: number
      }

      const byType = await DatabaseService.queryOne<ByTypeRow>(
        `
        SELECT
          COALESCE(SUM(CASE WHEN LOWER(TRIM(tipo_pago)) = 'mensualidad' THEN total ELSE 0 END), 0) AS mensualidad,
          COALESCE(SUM(CASE WHEN LOWER(TRIM(tipo_pago)) = 'inscripcion'  THEN total ELSE 0 END), 0) AS inscripcion,
          COALESCE(SUM(CASE WHEN LOWER(TRIM(tipo_pago)) = 'moratorio'    THEN total ELSE 0 END), 0) AS moratorio,
          COALESCE(SUM(CASE WHEN LOWER(TRIM(tipo_pago)) = 'extension'    THEN total ELSE 0 END), 0) AS extension,
          COALESCE(SUM(CASE WHEN LOWER(TRIM(tipo_pago)) = 'otro'         THEN total ELSE 0 END), 0) AS otro,
          COALESCE(SUM(CASE WHEN LOWER(TRIM(tipo_pago)) = 'ajuste'       THEN total ELSE 0 END), 0) AS ajuste,
          COALESCE(SUM(total), 0) AS collected,
          COALESCE(SUM(moratorio), 0) AS moratorio_column
        FROM pagos
        WHERE estatus = 'activo'
          AND fecha_pago >= ? AND fecha_pago < ?
        `,
        [startStr, `${endStr} 23:59:59`]
      )

      // Si en tu operación no usas tipo_pago='moratorio' pero sí llenas la columna moratorio:
      const moratorioTipificado = Number(byType?.moratorio ?? 0)
      const moratorioEmbebido  = Number(byType?.moratorio_column ?? 0)
      // Para no perder dinero, sumamos ambos. Si prefieres usar solo uno, cambia esta línea.
      const moratorioTotal = moratorioTipificado + moratorioEmbebido
      const totalLateFees = moratorioTotal

      // Resultado del desglose
      // Si byType es undefined (no hay pagos), forzamos 0 en todo

      const breakdown = {
        monthlyNormal: Number(byType?.mensualidad ?? 0),
        inscriptions: Number(byType?.inscripcion ?? 0),
        lateFees: moratorioTotal,
        extension: Number(byType?.extension ?? 0),
        other: Number(byType?.otro ?? 0),
        adjustment: Number(byType?.ajuste ?? 0),
        // opcional: total cobrado por todos los tipos en el mes
        collectedByTypes: Number(byType?.collected ?? 0),
      }


      // 5) Pagos vencidos: mensualidades con estatus = 'vencido'
      // Si lo quieres SOLO del mes, agrega "AND fecha_vencimiento >= ? AND fecha_vencimiento < ?"
      const overdueRow = await DatabaseService.queryOne<{ c: number }>(
        `SELECT COUNT(*) AS c
         FROM mensualidades
         WHERE estatus = 'vencido'`
      )
      const overduePayments = Number(overdueRow?.c ?? 0)

      // 6) Porcentaje de cobranza (sobre lo esperado del mes)
      const collectionPercentage =
        expectedAmount > 0
          ? Number(((collectedAmount / expectedAmount) * 100).toFixed(1))
          : 0
          
      res.json({
        success: true,
        data: { 
          period: { year, month },
          totalStudents, 
          activeStudents,
          expectedAmount, 
          collectedAmount, 
          collectionPercentage,
          overduePayments,
          totalLateFees,
          breakdown,
        }
      })
    } catch (err) {
      res.status(500).json({ success: false, error: "Error al calcular resumen" })
    }
  }
)

export default router
