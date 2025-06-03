"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, BookOpen, User, BarChart, Sun } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function MobileNavigation() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { setTheme } = useTheme()

  const navItems = [
    {
      name: "Bosh sahifa",
      href: "/",
      icon: Home,
    },
    {
      name: "Kurslar",
      href: "/courses",
      icon: BookOpen,
    },
    {
      name: "Progress",
      href: "/progress",
      icon: BarChart,
    },
    {
      name: "Profil",
      href: "/profile",
      icon: User,
    }
  ]

  // Force light theme on mount
  useEffect(() => {
    setTheme('light')
  }, [setTheme])

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="grid grid-cols-4 gap-1 p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 text-xs font-medium rounded-md transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
