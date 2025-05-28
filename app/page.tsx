"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { MobileNavigation } from "@/components/mobile-navigation"
import { BrainCircuit, Sparkles } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useFeaturedCourses } from "@/hooks/useCourses"
import { useEnrollments } from "@/hooks/useProgress"

export default function Home() {
  const { user } = useAuth()
  const { courses: featuredCourses, loading: coursesLoading } = useFeaturedCourses(3)
  const { enrollInCourse } = useEnrollments()

  const handleEnrollCourse = async (courseId: string) => {
    if (!user) {
      // Redirect to login
      window.location.href = '/login'
      return
    }

    const result = await enrollInCourse(courseId)
    if (result.success) {
      // Show success message or redirect
      console.log('Successfully enrolled!')
    } else {
      // Show error message
      console.error('Error enrolling:', result.error)
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 container px-4 py-8 pb-20">
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
            <BrainCircuit className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">SarmoTraining</h1>
          <p className="text-muted-foreground mb-6">O&apos;zbek tilidagi AI kurslari platformasi</p>
          <div className="flex gap-4">
            {user ? (
              <Button asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild>
                  <Link href="/login">Kirish</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/register">Ro&apos;yxatdan o&apos;tish</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mashhur kurslar</h2>
          <div className="grid grid-cols-1 gap-4">
            {coursesLoading ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <Skeleton className="h-40" />
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-6 w-full mb-1" />
                    <Skeleton className="h-4 w-3/4 mb-3" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : (
              featuredCourses.map((course) => (
                <Card key={course.id} className="overflow-hidden">
                  <div className="h-40 bg-muted relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <img
                        src={course.thumbnailUrl || "/placeholder.svg"}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {course.level}
                      </span>
                      <span className="text-sm text-muted-foreground">{course.lessonCount} darslar</span>
                    </div>
                    <h3 className="font-semibold mb-1">{course.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{course.shortDescription}</p>
                    <Button 
                      className="w-full"
                      onClick={() => handleEnrollCourse(course.id)}
                    >
                      Kursni ko&apos;rish
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Nima uchun SarmoTraining?</h2>
          <div className="grid grid-cols-1 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex gap-4 p-4 border rounded-lg">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <MobileNavigation />
    </main>
  )
}

const features = [
  {
    title: "O'zbek tilidagi kurslar",
    description: "Barcha materiallar ona tilimizda tayyorlangan",
  },
  {
    title: "Mobil qurilmalarga moslashgan",
    description: "Telegram Mini App orqali istalgan joyda o'rganing",
  },
  {
    title: "Amaliy mashg'ulotlar",
    description: "Nazariya va amaliyot birlashtirilgan kurslar",
  },
  {
    title: "Progress kuzatuvi",
    description: "O'z yutuqlaringizni kuzatib boring",
  },
]
