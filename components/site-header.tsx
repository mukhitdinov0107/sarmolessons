"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MainNavigation } from "./main-navigation"
import { MobileNavigation } from "./mobile-navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./theme-toggle"
import { useAuth } from "@/hooks/useAuth"

export function SiteHeader() {
  const { user } = useAuth()
  const pathname = usePathname()
  
  // Don't show header on admin pages since they have their own layout
  if (pathname.startsWith("/admin")) {
    return null
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold text-xl">ZamonAI</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <MainNavigation />

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {!user ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild size="sm">
                  <Link href="/login">Kirish</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">Ro&apos;yxatdan o&apos;tish</Link>
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      
      {/* Mobile bottom navigation */}
      <div className="md:hidden">
        <MobileNavigation />
      </div>
    </>
  )
}
