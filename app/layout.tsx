import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SarmoLessons - AI o'rganish platformasi",
  description: "O'zbekistonda AI va ML texnologiyalarini o'rganish uchun eng yaxshi platforma",
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "any"
      }
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180"
      }
    ]
  },
  manifest: "/site.webmanifest"
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head />
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
