"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Filter, Receipt, AlertTriangle, CheckCircle, Clock, DollarSign } from 'lucide-react'
import { usePagos, useAlumnos, useCrud } from '@/hooks/use-api'
import { useToastContext } from '@/components/toast-provider'
import { Pago } from '@/lib/types'

export default function PaymentsPage() {
  const [filters, setFilters] = useState({
    search: '',
    estatus: '',
    tipo_pago: '',
    page: 1,
    limit: 10
  })
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newPayment, setNewPayment] = useState({
    alumno_id: '',
    tipo_pago: 'mensualidad',
    concepto: '',
    monto: '',
    moratorio: '0',
    forma_pago: 'efectivo',
    referencia: '',
    fecha_pago: new Date().toISOString().split('T')[0],
    observaciones: ''
  })

  const { data: paymentsData, loading, error, refetch } = usePagos(filters)
  const { data: alumnosData } = useAlumnos({ limit: 100 })
  const { create, loading: creating } = useCrud<Pago>('/api/pagos')
  const toast = useToastContext()

  const payments = paymentsData?.data || []
  const pagination = paymentsData?.pagination
  const alumnos = alumnosData?.data || []

  const handleAddPayment = async () => {
    if (!newPayment.alumno_id || !newPayment.concepto || !newPayment.monto) {
      toast.error('Error', 'Por favor completa los campos requeridos')
      return
    }

    const paymentData = {
      ...newPayment,
      alumno_id: parseInt(newPayment.alumno_id),
      monto: parseFloat(newPayment.monto),
      moratorio: parseFloat(newPayment.moratorio),
      descuento: 0
    }

    const result = await create(paymentData)
    
    if (result) {
      toast.success('Éxito', 'Pago registrado exitosamente')
      setNewPayment({
        alumno_id: '',
        tipo_pago: 'mensualidad',
        concepto: '',
        monto: '',
        moratorio: '0',
        forma_pago: 'efectivo',
        referencia: '',
        fecha_pago: new Date().toISOString().split('T')[0],
        observaciones: ''
      })
      setIsAddDialogOpen(false)
      refetch()
    } else {
      toast.error('Error', 'No se pudo registrar el pago')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "activo":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Activo</Badge>
      case "cancelado":
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Cancelado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // Calcular estadísticas
  const totalPagado = payments.filter((p: any) => p.estatus === 'activo').reduce((sum: number, p: any) => sum + p.total, 0)
  const totalCancelado = payments.filter((p: any) => p.estatus === 'cancelado').reduce((sum: number, p: any) => sum + p.total, 0)
  const totalMoratorios = payments.reduce((sum: number, p: any) => sum + p.moratorio, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Control de Pagos</h1>
          <p className="text-muted-foreground">
            Gestiona los pagos, moratorios y recibos de los alumnos
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Pago
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Pago</DialogTitle>
              <DialogDescription>
                Completa la información del pago recibido.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="alumno">Alumno *</Label>
                <Select value={newPayment.alumno_id} onValueChange={(value) => setNewPayment({...newPayment, alumno_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un alumno" />
                  </SelectTrigger>
                  <SelectContent>
                    {alumnos.map((alumno: any) => (
                      <SelectItem key={alumno.id} value={alumno.id.toString()}>
                        {alumno.matricula} - {alumno.nombre} {alumno.apellido_paterno}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="tipo_pago">Tipo de Pago</Label>
                  <Select value={newPayment.tipo_pago} onValueChange={(value) => setNewPayment({...newPayment, tipo_pago: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensualidad">Mensualidad</SelectItem>
                      <SelectItem value="inscripcion">Inscripción</SelectItem>
                      <SelectItem value="moratorio">Moratorio</SelectItem>
                      <SelectItem value="extension">Extensión</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="forma_pago">Forma de Pago</Label>
                  <Select value={newPayment.forma_pago} onValueChange={(value) => setNewPayment({...newPayment, forma_pago: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="tarjeta_debito">Tarjeta de Débito</SelectItem>
                      <SelectItem value="tarjeta_credito">Tarjeta de Crédito</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="concepto">Concepto *</Label>
                <Input
                  id="concepto"
                  value={newPayment.concepto}
                  onChange={(e) => setNewPayment({...newPayment, concepto: e.target.value})}
                  placeholder="Descripción del pago"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="monto">Monto *</Label>
                  <Input
                    id="monto"
                    type="number"
                    step="0.01"
                    value={newPayment.monto}
                    onChange={(e) => setNewPayment({...newPayment, monto: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="moratorio">Moratorio</Label>
                  <Input
                    id="moratorio"
                    type="number"
                    step="0.01"
                    value={newPayment.moratorio}
                    onChange={(e) => setNewPayment({...newPayment, moratorio: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="fecha_pago">Fecha de Pago</Label>
                  <Input
                    id="fecha_pago"
                    type="date"
                    value={newPayment.fecha_pago}
                    onChange={(e) => setNewPayment({...newPayment, fecha_pago: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="referencia">Referencia</Label>
                  <Input
                    id="referencia"
                    value={newPayment.referencia}
                    onChange={(e) => setNewPayment({...newPayment, referencia: e.target.value})}
                    placeholder="Número de referencia"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Input
                  id="observaciones"
                  value={newPayment.observaciones}
                  onChange={(e) => setNewPayment({...newPayment, observaciones: e.target.value})}
                  placeholder="Notas adicionales"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddPayment} disabled={creating}>
                {creating ? 'Registrando...' : 'Registrar Pago'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estadísticas de pagos */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cobrado</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalPagado.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {payments.filter((p: any) => p.estatus === 'activo').length} pagos activos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelados</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${totalCancelado.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {payments.filter((p: any) => p.estatus === 'cancelado').length} pagos cancelados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moratorios</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${totalMoratorios.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Recargos por retraso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pagos</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payments.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Registros totales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de pagos */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Pagos</CardTitle>
          <CardDescription>
            Historial completo de pagos, moratorios y recibos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por alumno, recibo o matrícula..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={filters.estatus || 'todos'} onValueChange={(value) => setFilters(prev => ({ ...prev, estatus: value === 'todos' ? '' : value, page: 1 }))}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por estatus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estatus</SelectItem>
                <SelectItem value="activo">Activos</SelectItem>
                <SelectItem value="cancelado">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="text-red-500 text-sm mb-4">
              Error al cargar pagos: {error}
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recibo</TableHead>
                <TableHead>Alumno</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Moratorio</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Forma Pago</TableHead>
                <TableHead>Estatus</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment: any) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.numero_recibo}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{payment.alumno_nombre}</div>
                      <div className="text-sm text-muted-foreground">{payment.alumno_matricula}</div>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(payment.fecha_pago).toLocaleDateString()}</TableCell>
                  <TableCell>{payment.concepto}</TableCell>
                  <TableCell>${payment.monto.toLocaleString()}</TableCell>
                  <TableCell>
                    {payment.moratorio > 0 ? (
                      <span className="text-orange-600 font-medium">
                        ${payment.moratorio.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">$0</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    ${payment.total.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {payment.forma_pago.replace('_', ' ')}
                  </TableCell>
                  <TableCell>{getStatusBadge(payment.estatus)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Receipt className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Paginación */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} resultados
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page <= 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
