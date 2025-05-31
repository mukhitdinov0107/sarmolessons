"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, BookOpen, User, BarChart, Settings } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { isUserAdmin } from "@/utils/isAdmin"

export function MainNavigation() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user?.uid) {
        const adminStatus = await isUserAdmin(user.uid)
        setIsAdmin(adminStatus)
      } else {
        setIsAdmin(false)
      }
    }
    
    checkAdminStatus()
  }, [user])

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
    },
    // Show admin link only for admin users
    ...(isAdmin ? [
      {
        name: "Admin",
        href: "/admin",
        icon: Settings,
      }
    ] : []),
  ]

  return (
    <nav className="hidden md:flex items-center space-x-4">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
              isActive 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <item.icon className="w-4 h-4 mr-2" />
            <span>{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}
