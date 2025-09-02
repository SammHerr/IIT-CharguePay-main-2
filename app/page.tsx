"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Users, DollarSign, AlertTriangle, TrendingUp, Calendar, FileText, CreditCard, UserCheck } from 'lucide-react'
import { useDashboard } from '@/hooks/use-api'

export default function Dashboard() {
  const { data: dashboardData, loading, error } = useDashboard()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard de Cobranza</h1>
            <p className="text-muted-foreground">Cargando datos...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard de Cobranza</h1>
            <p className="text-muted-foreground text-red-500">Error: {error}</p>
          </div>
        </div>
      </div>
    )
  }

  const stats = dashboardData?.estadisticas
  const pagosRecientes = dashboardData?.pagosRecientes || []
  const alumnosEnMora = dashboardData?.alumnosEnMora || []
  const cobranzaMes = dashboardData?.cobranzaMesActual
  const ingresosPorTipo = dashboardData?.ingresosPorTipo || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Cobranza</h1>
          <p className="text-muted-foreground">
            Resumen general del centro educativo
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4" />
          <span className="text-sm">{new Date().toLocaleDateString('es-MX', { 
            year: 'numeric', 
            month: 'long' 
          })}</span>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alumnos Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.alumnos_activos || 0}</div>
            <p className="text-xs text-muted-foreground">
              de {stats?.total_alumnos || 0} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cobranza del Mes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cobranzaMes?.porcentaje_cobranza || 0}%</div>
            <p className="text-xs text-muted-foreground">
              ${(cobranzaMes?.monto_cobrado || 0).toLocaleString()} de ${(cobranzaMes?.monto_esperado || 0).toLocaleString()}
            </p>
            <Progress value={cobranzaMes?.porcentaje_cobranza || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Vencidos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.mensualidades_vencidas || 0}</div>
            <p className="text-xs text-muted-foreground">
              ${(stats?.monto_vencido || 0).toLocaleString()} en mora
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats?.ingresos_mes_actual || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.pagos_mes_actual || 0} pagos registrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Desglose de ingresos */}
      <div className="grid gap-4 md:grid-cols-3">
        {ingresosPorTipo.map((ingreso: any, index: number) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                {ingreso.tipo_pago === 'mensualidad' ? 'Mensualidades' :
                 ingreso.tipo_pago === 'inscripcion' ? 'Inscripciones' :
                 ingreso.tipo_pago === 'moratorio' ? 'Moratorios' : 
                 ingreso.tipo_pago}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${ingreso.total_ingresos.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{ingreso.cantidad} pagos</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagos recientes y alumnos en mora */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Pagos Recientes
            </CardTitle>
            <CardDescription>Últimas transacciones registradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pagosRecientes.map((pago: any) => (
                <div key={pago.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{pago.alumno_nombre}</p>
                    <p className="text-sm text-muted-foreground">
                      {pago.numero_recibo} - {new Date(pago.fecha_pago).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${pago.total.toLocaleString()}</p>
                    <Badge variant={pago.estatus === 'activo' ? 'default' : 'destructive'}>
                      {pago.estatus === 'activo' ? 'Activo' : 'Cancelado'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-destructive" />
              Alumnos en Mora
            </CardTitle>
            <CardDescription>Requieren seguimiento inmediato</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alumnosEnMora.map((alumno: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{alumno.nombre}</p>
                    <p className="text-sm text-muted-foreground">
                      {alumno.plan} - {alumno.dias_maximo_vencido} días de retraso
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-destructive">
                      ${alumno.monto_vencido.toLocaleString()}
                    </p>
                    <Badge variant="destructive">
                      {alumno.mensualidades_vencidas} mora{alumno.mensualidades_vencidas > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
