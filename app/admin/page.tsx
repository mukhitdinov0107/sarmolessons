"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { BookCopy, Users, Settings, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const adminModules = [
    {
      title: "Kurslar boshqaruvi",
      description: "Kurslarni yaratish, tahrirlash va boshqarish",
      icon: <BookCopy className="h-6 w-6" />,
      href: "/admin/courses",
      color: "bg-blue-100 text-blue-700"
    },
    {
      title: "Foydalanuvchilar",
      description: "Foydalanuvchilarni ko'rish va boshqarish",
      icon: <Users className="h-6 w-6" />,
      href: "/admin/users",
      color: "bg-green-100 text-green-700"
    },
    {
      title: "Testlar",
      description: "AI testlarini yaratish va kurslarni testlar bilan boyitish",
      icon: <FileQuestion className="h-6 w-6" />,
      href: "/admin/quizzes",
      color: "bg-amber-100 text-amber-700"
    },
    {
      title: "Sozlamalar",
      description: "Tizim sozlamalarini o'zgartirish",
      icon: <Settings className="h-6 w-6" />,
      href: "/admin/settings",
      color: "bg-purple-100 text-purple-700"
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin boshqaruv paneli</h1>
        <p className="text-muted-foreground mt-2">
          SarmoLessons platformasining barcha funksiyalarini boshqarish uchun panel
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {adminModules.map((module) => (
          <Card key={module.href} className="overflow-hidden">
            <CardHeader className={`${module.color} p-4`}>
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white mb-2">
                {module.icon}
              </div>
              <CardTitle>{module.title}</CardTitle>
              <CardDescription className="text-foreground/70">
                {module.description}
              </CardDescription>
            </CardHeader>
            <CardFooter className="p-4">
              <Button asChild className="w-full">
                <Link href={module.href}>
                  Ko'rish
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
