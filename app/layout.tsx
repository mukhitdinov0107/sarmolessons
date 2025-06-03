"use client"

import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { MobileNavigation } from "@/components/mobile-navigation"
import { AuthProvider } from "@/hooks/useAuth"
import { ThemeProvider } from "@/providers/theme-provider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="min-h-screen flex flex-col">
              {/* Main content */}
              <main className="flex-1">
                {children}
              </main>

              {/* Navigation */}
              <MobileNavigation />
            </div>

            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
