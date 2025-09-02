"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Download, Calendar, Users, DollarSign, AlertTriangle, TrendingUp, BarChart3, PieChart } from 'lucide-react'
import { useReportes, usePlanes } from '@/hooks/use-api'

export default function ReportsPage() {
  const [reportType, setReportType] = useState('resumen')
  const [filters, setFilters] = useState({
    periodo: new Date().toISOString().slice(0, 7),
    fecha_desde: '',
    fecha_hasta: '',
    plan_id: '',
    alumno_id: ''
  })

  const { data: reportData, loading, error } = useReportes({
    tipo_reporte: reportType,
    ...filters
  })

  const { data: planes } = usePlanes(true)

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const exportReport = (format: 'pdf' | 'excel') => {
    // TODO: Implementar exportación
    console.log(`Exportando reporte en formato ${format}`)
  }

  const renderResumenReport = () => {
    if (!reportData) return null

    const { estadisticasGenerales, distribucionPlanes, tendenciaCobranza } = reportData

    return (
      <div className="space-y-6">
        {/* Estadísticas Generales */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Alumnos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticasGenerales?.total_alumnos || 0}</div>
              <p className="text-xs text-muted-foreground">
                {estadisticasGenerales?.alumnos_activos || 0} activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Graduados</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {estadisticasGenerales?.alumnos_graduados || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Completaron sus estudios
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(estadisticasGenerales?.ingresos_totales || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Histórico acumulado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Morosidad</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${(estadisticasGenerales?.monto_vencido || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {estadisticasGenerales?.mensualidades_vencidas || 0} mensualidades
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Distribución por Planes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-4 w-4 mr-2" />
              Distribución por Planes
            </CardTitle>
            <CardDescription>
              Cantidad de alumnos por plan educativo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Total Alumnos</TableHead>
                  <TableHead>Activos</TableHead>
                  <TableHead>Precio Mensual</TableHead>
                  <TableHead>Duración</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {distribucionPlanes?.map((plan: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{plan.plan}</TableCell>
                    <TableCell>{plan.cantidad_alumnos}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">
                        {plan.alumnos_activos}
                      </Badge>
                    </TableCell>
                    <TableCell>${plan.precio_mensualidad.toLocaleString()}</TableCell>
                    <TableCell>{plan.numero_mensualidades} meses</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Tendencia de Cobranza */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Tendencia de Cobranza (Últimos 6 Meses)
            </CardTitle>
            <CardDescription>
              Evolución del porcentaje de cobranza mensual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead>Monto Esperado</TableHead>
                  <TableHead>Monto Cobrado</TableHead>
                  <TableHead>% Cobranza</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tendenciaCobranza?.map((periodo: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{periodo.periodo_nombre}</TableCell>
                    <TableCell>${periodo.monto_esperado.toLocaleString()}</TableCell>
                    <TableCell>${periodo.monto_cobrado.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={periodo.porcentaje_cobranza >= 80 ? 'default' : 
                                periodo.porcentaje_cobranza >= 60 ? 'secondary' : 'destructive'}
                      >
                        {periodo.porcentaje_cobranza}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderCobranzaReport = () => {
    if (!reportData) return null

    const { reporteCobranza, resumenCobranza } = reportData

    return (
      <div className="space-y-6">
        {/* Resumen de Cobranza */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monto Esperado</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(resumenCobranza?.monto_esperado || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monto Cobrado</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${(resumenCobranza?.monto_cobrado || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">% Cobranza</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {resumenCobranza?.porcentaje_cobranza || 0}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagos Vencidos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {resumenCobranza?.pagos_vencidos || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detalle de Cobranza */}
        <Card>
          <CardHeader>
            <CardTitle>Detalle de Cobranza</CardTitle>
            <CardDescription>
              Lista detallada de mensualidades por alumno
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Alumno</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Mensualidad</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Moratorio</TableHead>
                  <TableHead>Estatus</TableHead>
                  <TableHead>Contacto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reporteCobranza?.map((item: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.matricula}</TableCell>
                    <TableCell>{item.nombre_alumno}</TableCell>
                    <TableCell>{item.plan}</TableCell>
                    <TableCell>#{item.numero_mensualidad}</TableCell>
                    <TableCell>{new Date(item.fecha_vencimiento).toLocaleDateString()}</TableCell>
                    <TableCell>${item.monto.toLocaleString()}</TableCell>
                    <TableCell>
                      {item.moratorio > 0 ? (
                        <span className="text-orange-600 font-medium">
                          ${item.moratorio.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">$0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={item.estatus === 'pagado' ? 'default' : 
                                item.estatus === 'pendiente' ? 'secondary' : 'destructive'}
                      >
                        {item.estatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {item.telefono && <div>{item.telefono}</div>}
                        {item.email && <div className="text-muted-foreground">{item.email}</div>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderMorosidadReport = () => {
    if (!reportData) return null

    const { reporteMorosidad, resumenMorosidad } = reportData

    return (
      <div className="space-y-6">
        {/* Resumen de Morosidad */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alumnos en Mora</CardTitle>
              <Users className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {resumenMorosidad?.alumnos_en_mora || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensualidades Vencidas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {resumenMorosidad?.mensualidades_vencidas || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monto Vencido</CardTitle>
              <DollarSign className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${(resumenMorosidad?.monto_vencido || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Moratorios</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                ${(resumenMorosidad?.total_moratorios || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detalle de Morosidad */}
        <Card>
          <CardHeader>
            <CardTitle>Detalle de Morosidad</CardTitle>
            <CardDescription>
              Alumnos con pagos vencidos y moratorios calculados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Alumno</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Mensualidad</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Días Vencido</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Moratorio</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Contacto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reporteMorosidad?.map((item: any, index: number) => (
                  <TableRow key={index} className="bg-red-50">
                    <TableCell className="font-medium">{item.matricula}</TableCell>
                    <TableCell>{item.nombre_alumno}</TableCell>
                    <TableCell>{item.plan_nombre}</TableCell>
                    <TableCell>#{item.numero_mensualidad}</TableCell>
                    <TableCell>{new Date(item.fecha_vencimiento).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">
                        {item.dias_vencido} días
                      </Badge>
                    </TableCell>
                    <TableCell>${item.monto.toLocaleString()}</TableCell>
                    <TableCell className="text-orange-600 font-medium">
                      ${item.moratorio_calculado.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-bold">
                      ${(item.monto + item.moratorio_calculado).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {item.telefono && <div>{item.telefono}</div>}
                        {item.email && <div className="text-muted-foreground">{item.email}</div>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderAlumnosReport = () => {
    if (!reportData) return null

    const { reporteAlumnos } = reportData

    return (
      <Card>
        <CardHeader>
          <CardTitle>Reporte de Alumnos</CardTitle>
          <CardDescription>
            Información detallada de todos los alumnos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matrícula</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Inscripción</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead>Estatus</TableHead>
                <TableHead>Pagadas</TableHead>
                <TableHead>Pendientes</TableHead>
                <TableHead>Vencidas</TableHead>
                <TableHead>Total Pagado</TableHead>
                <TableHead>Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reporteAlumnos?.map((alumno: any, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{alumno.matricula}</TableCell>
                  <TableCell>{alumno.nombre_completo}</TableCell>
                  <TableCell>{alumno.plan}</TableCell>
                  <TableCell>{new Date(alumno.fecha_inscripcion).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(alumno.fecha_vigencia).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={alumno.estatus === 'activo' ? 'default' : 
                              alumno.estatus === 'graduado' ? 'secondary' : 'destructive'}
                    >
                      {alumno.estatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800">
                      {alumno.mensualidades_pagadas}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {alumno.mensualidades_pendientes}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="destructive">
                      {alumno.mensualidades_vencidas}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-green-600 font-medium">
                    ${alumno.total_pagado.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {alumno.saldo_pendiente > 0 ? (
                      <span className="text-red-600 font-medium">
                        ${alumno.saldo_pendiente.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-green-600">Al corriente</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground">
            Genera reportes detallados del sistema educativo
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportReport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button variant="outline" onClick={() => exportReport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Configuración de Reporte
          </CardTitle>
          <CardDescription>
            Selecciona el tipo de reporte y configura los filtros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="grid gap-2">
              <Label htmlFor="reportType">Tipo de Reporte</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resumen">Resumen General</SelectItem>
                  <SelectItem value="cobranza">Reporte de Cobranza</SelectItem>
                  <SelectItem value="alumnos">Reporte de Alumnos</SelectItem>
                  <SelectItem value="morosidad">Reporte de Morosidad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(reportType === 'cobranza' || reportType === 'morosidad') && (
              <div className="grid gap-2">
                <Label htmlFor="periodo">Período</Label>
                <Input
                  id="periodo"
                  type="month"
                  value={filters.periodo}
                  onChange={(e) => handleFilterChange('periodo', e.target.value)}
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="fecha_desde">Fecha Desde</Label>
              <Input
                id="fecha_desde"
                type="date"
                value={filters.fecha_desde}
                onChange={(e) => handleFilterChange('fecha_desde', e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fecha_hasta">Fecha Hasta</Label>
              <Input
                id="fecha_hasta"
                type="date"
                value={filters.fecha_hasta}
                onChange={(e) => handleFilterChange('fecha_hasta', e.target.value)}
              />
            </div>

            {reportType === 'alumnos' && (
              <div className="grid gap-2">
                <Label htmlFor="plan">Plan</Label>
                <Select value={filters.plan_id} onValueChange={(value) => handleFilterChange('plan_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los planes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los planes</SelectItem>
                    {planes?.map((plan: any) => (
                      <SelectItem key={plan.id} value={plan.id.toString()}>
                        {plan.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contenido del Reporte */}
      {loading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-2">Generando reporte...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="text-red-500 text-center">
              Error al generar el reporte: {error}
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && reportData && (
        <>
          {reportType === 'resumen' && renderResumenReport()}
          {reportType === 'cobranza' && renderCobranzaReport()}
          {reportType === 'morosidad' && renderMorosidadReport()}
          {reportType === 'alumnos' && renderAlumnosReport()}
        </>
      )}
    </div>
  )
}
