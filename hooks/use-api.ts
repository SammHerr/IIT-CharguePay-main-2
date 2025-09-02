import { useState, useEffect } from 'react'
import { ApiResponse, PaginationParams } from '@/lib/types'

// Hook genérico para llamadas a API
export function useApi<T>(
  url: string,
  options?: RequestInit,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers
          },
          ...options
        })
        
        const result: ApiResponse<T> = await response.json()
        
        if (result.success) {
          setData(result.data || null)
        } else {
          setError(result.error || 'Error desconocido')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de conexión')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, dependencies)

  return { data, loading, error, refetch: () => setLoading(true) }
}

// Hook para operaciones CRUD
export function useCrud<T>(baseUrl: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = async (data: Partial<T>): Promise<T | null> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      const result: ApiResponse<T> = await response.json()
      
      if (result.success) {
        return result.data || null
      } else {
        setError(result.error || 'Error al crear')
        return null
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión')
      return null
    } finally {
      setLoading(false)
    }
  }

  const update = async (id: number, data: Partial<T>): Promise<T | null> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`${baseUrl}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      const result: ApiResponse<T> = await response.json()
      
      if (result.success) {
        return result.data || null
      } else {
        setError(result.error || 'Error al actualizar')
        return null
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión')
      return null
    } finally {
      setLoading(false)
    }
  }

  const remove = async (id: number): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`${baseUrl}/${id}`, {
        method: 'DELETE'
      })
      
      const result: ApiResponse = await response.json()
      
      if (result.success) {
        return true
      } else {
        setError(result.error || 'Error al eliminar')
        return false
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión')
      return false
    } finally {
      setLoading(false)
    }
  }

  return { create, update, remove, loading, error }
}

// Hook específico para alumnos
export function useAlumnos(filters?: any) {
  const queryString = filters ? '?' + new URLSearchParams(filters).toString() : ''
  return useApi(`/api/alumnos${queryString}`, undefined, [filters])
}

// Hook específico para pagos
export function usePagos(filters?: any) {
  const queryString = filters ? '?' + new URLSearchParams(filters).toString() : ''
  return useApi(`/api/pagos${queryString}`, undefined, [filters])
}

// Hook específico para dashboard
export function useDashboard() {
  return useApi('/api/dashboard')
}

// Hook específico para reportes
export function useReportes(filters?: any) {
  const queryString = filters ? '?' + new URLSearchParams(filters).toString() : ''
  return useApi(`/api/reportes${queryString}`, undefined, [filters])
}

// Hook específico para planes
export function usePlanes(activo?: boolean) {
  const queryString = activo !== undefined ? `?activo=${activo}` : ''
  return useApi(`/api/planes${queryString}`, undefined, [activo])
}
