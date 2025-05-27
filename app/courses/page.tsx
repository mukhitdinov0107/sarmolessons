'use client';

import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MobileNavigation } from "@/components/mobile-navigation"
import { BookOpen, Search, Loader2 } from "lucide-react"
import { CourseCard } from "./course-card"

export interface Course {
  id: string
  title: string
  description: string
  level: string
  lessons: any[]
  duration: string
  imageUrl: string
}

// This is a client component that fetches courses on the client side
export default function CoursesPage() {
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses')
        if (!response.ok) {
          throw new Error('Failed to fetch courses')
        }
        const result = await response.json()
        setAllCourses(Array.isArray(result.data) ? result.data : [])
      } catch (error) {
        console.error('Error fetching courses:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Yuklanmoqda...</span>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 container px-4 py-8 pb-20">
        <header className="mb-6">
          <h1 className="text-2xl font-bold mb-4">Kurslar</h1>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Kurslarni qidirish..." className="pl-9" />
          </div>
        </header>

        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="all">Barchasi</TabsTrigger>
            <TabsTrigger value="beginner">Boshlang'ich</TabsTrigger>
            <TabsTrigger value="intermediate">O'rta</TabsTrigger>
            <TabsTrigger value="advanced">Yuqori</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            {allCourses.map((course: Course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </TabsContent>
          
          <TabsContent value="beginner" className="space-y-4">
            {allCourses
              .filter((course: Course) => course.level === "Boshlang'ich")
              .map((course: Course) => (
                <CourseCard key={course.id} course={course} />
              ))}
          </TabsContent>
          
          <TabsContent value="intermediate" className="space-y-4">
            {allCourses
              .filter((course: Course) => course.level === "O'rta")
              .map((course: Course) => (
                <CourseCard key={course.id} course={course} />
              ))}
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4">
            {allCourses
              .filter((course: Course) => course.level === "Yuqori")
              .map((course: Course) => (
                <CourseCard key={course.id} course={course} />
              ))}
          </TabsContent>
        </Tabs>
      </div>
      <MobileNavigation />
    </main>
  )
}
