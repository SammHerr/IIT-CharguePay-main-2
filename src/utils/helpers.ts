// Utility para generar número de recibo
export function generateReceiptNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const timestamp = Date.now().toString().slice(-4)
  
  return `REC-${year}${month}${day}-${timestamp}`
}

// Utility para calcular moratorio
export function calculateMoratorio(
  monto: number,
  fechaVencimiento: string,
  porcentajeDiario: number = 1.0
): { diasVencido: number; moratorio: number } {
  const hoy = new Date()
  const vencimiento = new Date(fechaVencimiento)
  
  if (hoy <= vencimiento) {
    return { diasVencido: 0, moratorio: 0 }
  }
  
  const diasVencido = Math.floor((hoy.getTime() - vencimiento.getTime()) / (1000 * 60 * 60 * 24))
  const moratorio = Math.round(monto * (diasVencido * porcentajeDiario / 100) * 100) / 100
  
  
  return { diasVencido, moratorio }
}

// Utility para formatear fechas
export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

// Utility para validar email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Utility para generar matrícula
export function generateMatricula(year: number, count: number): string {
  return `IIT-${year}-${String(count + 1).padStart(3, '0')}`
}

// Utility para sanitizar strings
export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, '')
}
