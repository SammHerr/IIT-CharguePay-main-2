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
import { Search, Plus, Filter, Eye, Edit, UserCheck, UserX, GraduationCap } from 'lucide-react'
import { useAlumnos, usePlanes, useCrud } from '@/hooks/use-api'
import { useToastContext } from '@/components/toast-provider'
import { Alumno } from '@/lib/types'

export default function StudentsPage() {
  const [filters, setFilters] = useState({
    search: '',
    estatus: '',
    page: 1,
    limit: 10
  })
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newStudent, setNewStudent] = useState({
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    telefono: '',
    email: '',
    plan_id: '',
    fecha_inscripcion: '',
    fecha_inicio: ''
  })

  const { data: studentsData, loading, error, refetch } = useAlumnos(filters)
  const { data: planes } = usePlanes(true)
  const { create, loading: creating } = useCrud<Alumno>('/api/alumnos')
  const toast = useToastContext()

  const students = studentsData?.data || []
  const pagination = studentsData?.pagination

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }))
  }

  const handleStatusFilter = (estatus: string) => {
    setFilters(prev => ({ ...prev, estatus: estatus === 'todos' ? '' : estatus, page: 1 }))
  }

  const handleAddStudent = async () => {
    if (!newStudent.nombre || !newStudent.apellido_paterno || !newStudent.plan_id) {
      toast.error('Error', 'Por favor completa los campos requeridos')
      return
    }

    const studentData = {
      ...newStudent,
      plan_id: parseInt(newStudent.plan_id),
      fecha_inscripcion: newStudent.fecha_inscripcion || new Date().toISOString().split('T')[0],
      fecha_inicio: newStudent.fecha_inicio || new Date().toISOString().split('T')[0]
    }

    const result = await create(studentData)
    
    if (result) {
      toast.success('Éxito', 'Alumno registrado exitosamente')
      setNewStudent({
        nombre: '',
        apellido_paterno: '',
        apellido_materno: '',
        telefono: '',
        email: '',
        plan_id: '',
        fecha_inscripcion: '',
        fecha_inicio: ''
      })
      setIsAddDialogOpen(false)
      refetch()
    } else {
      toast.error('Error', 'No se pudo registrar el alumno')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "activo":
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>
      case "graduado":
        return <Badge className="bg-blue-100 text-blue-800">Graduado</Badge>
      case "baja":
        return <Badge variant="destructive">Baja</Badge>
      case "suspendido":
        return <Badge className="bg-yellow-100 text-yellow-800">Suspendido</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading && !students.length) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Alumnos</h1>
            <p className="text-muted-foreground">Cargando alumnos...</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Alumnos</h1>
          <p className="text-muted-foreground">
            Administra el registro y seguimiento de estudiantes
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Alumno
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Alumno</DialogTitle>
              <DialogDescription>
                Completa la información del estudiante para crear su registro.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={newStudent.nombre}
                    onChange={(e) => setNewStudent({...newStudent, nombre: e.target.value})}
                    placeholder="Nombre del alumno"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="apellido_paterno">Apellido Paterno *</Label>
                  <Input
                    id="apellido_paterno"
                    value={newStudent.apellido_paterno}
                    onChange={(e) => setNewStudent({...newStudent, apellido_paterno: e.target.value})}
                    placeholder="Apellido paterno"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="apellido_materno">Apellido Materno</Label>
                  <Input
                    id="apellido_materno"
                    value={newStudent.apellido_materno}
                    onChange={(e) => setNewStudent({...newStudent, apellido_materno: e.target.value})}
                    placeholder="Apellido materno"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={newStudent.telefono}
                    onChange={(e) => setNewStudent({...newStudent, telefono: e.target.value})}
                    placeholder="Número de teléfono"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                  placeholder="Correo electrónico"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="plan">Plan Contratado *</Label>
                <Select value={newStudent.plan_id} onValueChange={(value) => setNewStudent({...newStudent, plan_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {planes?.map((plan: any) => (
                      <SelectItem key={plan.id} value={plan.id.toString()}>
                        {plan.nombre} - {plan.numero_mensualidades} meses - ${plan.precio_mensualidad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="fecha_inscripcion">Fecha de Inscripción</Label>
                  <Input
                    id="fecha_inscripcion"
                    type="date"
                    value={newStudent.fecha_inscripcion}
                    onChange={(e) => setNewStudent({...newStudent, fecha_inscripcion: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fecha_inicio">Fecha de Inicio</Label>
                  <Input
                    id="fecha_inicio"
                    type="date"
                    value={newStudent.fecha_inicio}
                    onChange={(e) => setNewStudent({...newStudent, fecha_inicio: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddStudent} disabled={creating}>
                {creating ? 'Registrando...' : 'Registrar Alumno'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alumnos</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination?.total || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {students.filter((s: any) => s.estatus === 'activo').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Graduados</CardTitle>
            <GraduationCap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {students.filter((s: any) => s.estatus === 'graduado').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bajas</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {students.filter((s: any) => s.estatus === 'baja').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Alumnos</CardTitle>
          <CardDescription>
            Busca y filtra estudiantes por nombre, matrícula o estatus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o matrícula..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={filters.estatus || 'todos'} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estatus</SelectItem>
                <SelectItem value="activo">Activos</SelectItem>
                <SelectItem value="graduado">Graduados</SelectItem>
                <SelectItem value="baja">Bajas</SelectItem>
                <SelectItem value="suspendido">Suspendidos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="text-red-500 text-sm mb-4">
              Error al cargar alumnos: {error}
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matrícula</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead>Estatus</TableHead>
                <TableHead>Saldo Pendiente</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student: any) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.matricula}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{student.nombre} {student.apellido_paterno}</div>
                      {student.telefono && (
                        <div className="text-sm text-muted-foreground">{student.telefono}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{student.plan_nombre}</TableCell>
                  <TableCell>{new Date(student.fecha_vigencia).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(student.estatus)}</TableCell>
                  <TableCell>
                    {student.saldo_pendiente > 0 ? (
                      <span className="text-red-600 font-medium">
                        ${student.saldo_pendiente.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-green-600">Al corriente</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
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
