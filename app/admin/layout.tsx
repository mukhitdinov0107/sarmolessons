"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { isUserAdmin } from "@/utils/isAdmin";
import { 
  BookCopy, 
  Users, 
  Settings, 
  FileQuestion, 
  ChevronLeft,
  Loader2
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user?.uid) {
        const adminStatus = await isUserAdmin(user.uid);
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
    };
    
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-destructive">Ruxsat yo'q</h1>
          <p className="text-muted-foreground">
            Bu sahifaga faqat administratorlar kirishi mumkin
          </p>
        </div>
        <Button asChild>
          <Link href="/">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Asosiy sahifaga qaytish
          </Link>
        </Button>
      </div>
    );
  }

  const navItems = [
    {
      title: "Kurslar",
      href: "/admin/courses",
      icon: <BookCopy className="h-4 w-4 mr-2" />,
    },
    {
      title: "Foydalanuvchilar",
      href: "/admin/users",
      icon: <Users className="h-4 w-4 mr-2" />,
    },
    {
      title: "Testlar",
      href: "/admin/quizzes",
      icon: <FileQuestion className="h-4 w-4 mr-2" />,
    },
    {
      title: "Sozlamalar",
      href: "/admin/settings",
      icon: <Settings className="h-4 w-4 mr-2" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Admin header */}
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center px-4 sm:px-6">
          <Link href="/" className="flex items-center">
            <h1 className="text-lg font-bold">SarmoLessons Admin</h1>
          </Link>

          <nav className="ml-auto flex items-center space-x-1">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Asosiy sahifa
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <div className="flex-1 container grid grid-cols-1 md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] gap-0">
        {/* Side nav */}
        <aside className="hidden md:block border-r">
          <nav className="p-4 space-y-2 sticky top-0 pt-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Button
                  key={item.href}
                  asChild
                  variant={isActive ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  <Link href={item.href}>
                    {item.icon}
                    {item.title}
                  </Link>
                </Button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden p-4 border-b overflow-x-auto flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Button
                key={item.href}
                asChild
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                className="mr-2"
              >
                <Link href={item.href}>
                  {item.icon}
                  {item.title}
                </Link>
              </Button>
            );
          })}
        </div>

        {/* Main content */}
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
