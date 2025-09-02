import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ToastProvider } from "@/components/toast-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sistema de Gestión Educativa",
  description: "Aplicación para gestión de cobranza y control de alumnos",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ToastProvider>
          <SidebarProvider>
            <AppSidebar />
            <main className="flex-1 p-6">
              {children}
            </main>
          </SidebarProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
