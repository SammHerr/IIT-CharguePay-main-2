"use client"

import { useState } from "react"
/*import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Download, AlertTriangle, CheckCircle, Clock, DollarSign, TrendingUp, Users, Phone, Mail } from 'lucide-react'
import { useReportes } from '@/hooks/use-api'*/

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Progress } from "../../components/ui/progress"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Calendar, Download, AlertTriangle, CheckCircle, Clock, DollarSign, TrendingUp, Users, Phone, Mail } from 'lucide-react'
import { useReportes } from '../../hooks/use-api'

export default function CollectionPage() {
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM
  const [statusFilter, setStatusFilter] = useState("todos")

  const { data: reporteData, loading, error } = useReportes({
    tipo_reporte: 'cobranza',
    periodo: selectedPeriod
  })

  const reporteCobranza = reporteData?.reporteCobranza || []
  const resumenCobranza = reporteData?.resumenCobranza

  const filteredList = reporteCobranza.filter((item: any) => {
    if (statusFilter === "todos") return true
    return item.estatus === statusFilter
  })

  const getStatusBadge = (status: string, diasVencido: number) => {
    switch (status) {
      case "pagado":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Pagado</Badge>
      case "pendiente":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>
      case "vencido":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Vencido ({diasVencido}d)
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityColor = (diasVencido: number) => {
    if (diasVencido === 0) return "text-green-600"
    if (diasVencido <= 7) return "text-yellow-600"
    if (diasVencido <= 15) return "text-orange-600"
    return "text-red-600"
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cobranza Automatizada</h1>
            <p className="text-muted-foreground">Cargando datos de cobranza...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cobranza Automatizada</h1>
          <p className="text-muted-foreground">
            Lista de cobranza mensual y seguimiento de morosidad
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4" />
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date()
                date.setMonth(date.getMonth() - i)
                const value = date.toISOString().slice(0, 7)
                const label = date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long' })
                return (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Exportar Lista
          </Button>
        </div>
      </div>

      {/* Resumen de cobranza */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cobranza del Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumenCobranza?.porcentaje_cobranza || 0}%</div>
            <p className="text-xs text-muted-foreground">
              ${(resumenCobranza?.monto_cobrado || 0).toLocaleString()} de ${(resumenCobranza?.monto_esperado || 0).toLocaleString()}
            </p>
            <Progress value={resumenCobranza?.porcentaje_cobranza || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alumnos que Pagaron</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{resumenCobranza?.pagos_realizados || 0}</div>
            <p className="text-xs text-muted-foreground">
              de {resumenCobranza?.total_alumnos || 0} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Vencidos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{resumenCobranza?.pagos_vencidos || 0}</div>
            <p className="text-xs text-muted-foreground">
              Requieren seguimiento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{resumenCobranza?.pagos_pendientes || 0}</div>
            <p className="text-xs text-muted-foreground">
              Aún dentro del plazo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Desglose por estatus */}
      {/* <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Pagos Completados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{collectionData.alumnosPagaron}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((collectionData.alumnosPagaron / collectionData.alumnosActivos) * 100)}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2 text-yellow-600" />
              Pagos Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{collectionData.alumnosPendientes}</div>
            <p className="text-xs text-muted-foreground">
              Aún dentro del plazo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
              Pagos Vencidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{collectionData.alumnosVencidos}</div>
            <p className="text-xs text-muted-foreground">
              Con moratorios aplicados
            </p>
          </CardContent>
        </Card>
      </div> */}

      {/* Lista de cobranza */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Cobranza - {new Date(selectedPeriod + '-01').toLocaleDateString('es-MX', { year: 'numeric', month: 'long' })}</CardTitle>
          <CardDescription>
            Seguimiento detallado de pagos mensuales y morosidad
          </CardDescription>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por estatus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pagado">Pagados</SelectItem>
                <SelectItem value="pendiente">Pendientes</SelectItem>
                <SelectItem value="vencido">Vencidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-red-500 text-sm mb-4">
              Error al cargar datos: {error}
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alumno</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Mensualidad</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Moratorio</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estatus</TableHead>
                <TableHead>Contacto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredList.map((item: any, index: number) => (
                <TableRow key={index} className={item.estatus === 'vencido' ? 'bg-red-50' : ''}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.nombre_alumno}</div>
                      <div className="text-sm text-muted-foreground">{item.matricula}</div>
                    </div>
                  </TableCell>
                  <TableCell>{item.plan}</TableCell>
                  <TableCell>#{item.numero_mensualidad}</TableCell>
                  <TableCell>
                    <div className={getPriorityColor(item.dias_vencido)}>
                      {new Date(item.fecha_vencimiento).toLocaleDateString()}
                      {item.dias_vencido > 0 && (
                        <div className="text-xs">
                          {item.dias_vencido} días vencido
                        </div>
                      )}
                    </div>
                  </TableCell>
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
                  <TableCell className="font-medium">
                    ${(item.monto + item.moratorio).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(item.estatus, item.dias_vencido)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {item.telefono && (
                        <Button variant="ghost" size="sm" title={`Llamar a ${item.telefono}`}>
                          <Phone className="h-3 w-3" />
                        </Button>
                      )}
                      {item.email && (
                        <Button variant="ghost" size="sm" title={`Enviar email a ${item.email}`}>
                          <Mail className="h-3 w-3" />
                        </Button>
                      )}
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
