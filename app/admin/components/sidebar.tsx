"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Users,
  FileQuestion,
  Settings,
  BarChart,
  Layout,
  Folder,
} from "lucide-react";

const navItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: Layout,
  },
  {
    title: "Kurslar",
    href: "/admin/courses",
    icon: BookOpen,
  },
  {
    title: "Darslar",
    href: "/admin/lessons",
    icon: Folder,
  },
  {
    title: "Testlar",
    href: "/admin/quizzes",
    icon: FileQuestion,
  },
  {
    title: "Foydalanuvchilar",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Statistika",
    href: "/admin/analytics",
    icon: BarChart,
  },
  {
    title: "Sozlamalar",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-background">
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Button
              key={item.href}
              asChild
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                isActive && "bg-secondary"
              )}
            >
              <Link href={item.href}>
                <Icon className="mr-2 h-4 w-4" />
                {item.title}
              </Link>
            </Button>
          );
        })}
      </nav>
    </aside>
  );
} 