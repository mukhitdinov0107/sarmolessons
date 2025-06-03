"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MobileNavigation } from "@/components/mobile-navigation"
import { BookOpen, Clock, Trophy, TrendingUp, Award, RefreshCw, AlertCircle, LogIn } from "lucide-react"
import { useDashboard } from "@/hooks/useDashboard"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

// Loading state component
const LoadingState = () => (
  <main className="min-h-screen flex flex-col">
    <div className="flex-1 container px-4 py-8 pb-20">
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="mb-8">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-16 h-16 rounded-md" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48 mb-2" />
                    <Skeleton className="h-3 w-32 mb-2" />
                    <Skeleton className="h-2 w-full mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="w-12 h-12 rounded-full mx-auto mb-2" />
              <Skeleton className="h-4 w-20 mx-auto mb-1" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </Card>
          ))}
        </div>
      </div>
    </div>
    <MobileNavigation />
  </main>
);

// Unauthenticated state component
const UnauthenticatedState = () => (
  <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted">
    <div className="w-full max-w-md px-4 py-8 text-center">
      <div className="mb-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <LogIn className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">SarmoTraining ga xush kelibsiz!</h1>
        <p className="text-muted-foreground mb-6">
          O'zbek tilidagi AI kurslarini o'rganish uchun tizimga kiring
        </p>
      </div>
      
      <div className="space-y-4">
        <Button asChild className="w-full" size="lg">
          <Link href="/login">
            Tizimga kirish
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full" size="lg">
          <Link href="/register">
            Ro'yxatdan o'tish
          </Link>
        </Button>
      </div>
    </div>
  </main>
);

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const {
    stats,
    inProgressCourses,
    recommendedCourses,
    loading,
    error,
    preferences,
    updateLastVisitedCourse,
    refreshDashboard
  } = useDashboard()

  // Handle hydration
  const [isClient, setIsClient] = useState(false)
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user && isClient) {
      router.push('/login')
    }
  }, [user, loading, router, isClient])

  const handleCourseClick = (courseId: string) => {
    updateLastVisitedCourse(courseId)
  }

  const formatLearningTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} daqiqa`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (remainingMinutes === 0) {
      return `${hours} soat`
    }
    return `${hours}s ${remainingMinutes}d`
  }

  // Handle server-side rendering
  if (!isClient) {
    return <LoadingState />
  }

  if (loading) {
    return <LoadingState />
  }

  if (!user) {
    return <UnauthenticatedState />
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 container px-4 py-8 pb-20">
        {/* Header with personalized greeting */}
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Salom, {user.firstName || user.displayName?.split(' ')[0] || 'Foydalanuvchi'}!
            </h1>
            <p className="text-muted-foreground">O'rganishni davom ettiring</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={refreshDashboard}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </header>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Statistics Overview */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Umumiy statistika</h2>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold">{stats.completedLessons}</p>
              <p className="text-xs text-muted-foreground">Tugallangan darslar</p>
            </Card>
            
            <Card className="p-4 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold">{formatLearningTime(stats.totalLearningTime)}</p>
              <p className="text-xs text-muted-foreground">O'rganish vaqti</p>
            </Card>
            
            <Card className="p-4 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                <Trophy className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold">{stats.completedCourses}</p>
              <p className="text-xs text-muted-foreground">Tugallangan kurslar</p>
            </Card>
          </div>
        </section>

        {/* In Progress Courses */}
        {inProgressCourses.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Davom ettirilayotgan kurslar</h2>
            <div className="space-y-4">
              {inProgressCourses.map((enrollment) => (
                <Card key={enrollment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-md bg-muted flex-shrink-0 overflow-hidden">
                        <img
                          src="/placeholder.svg"
                          alt="Course"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium mb-1">Kurs #{enrollment.courseId}</h3>
                        <div className="flex items-center text-xs text-muted-foreground mb-2">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>
                            {enrollment.progress.completedLessons.length} darslar tugallangan
                          </span>
                        </div>
                        <Progress 
                          value={enrollment.progress.progressPercentage} 
                          className="h-2 mb-2" 
                        />
                        <div className="text-xs text-muted-foreground">
                          {Math.round(enrollment.progress.progressPercentage)}% tugallangan
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button 
                      asChild 
                      className="w-full"
                      onClick={() => handleCourseClick(enrollment.courseId)}
                    >
                      <Link href={`/courses/${enrollment.courseId}`}>
                        Davom ettirish
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Recommended Courses */}
        {recommendedCourses.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Tavsiya etilgan kurslar</h2>
            <div className="space-y-4">
              {recommendedCourses.map((course) => (
                <Card key={course.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-md bg-muted flex-shrink-0 overflow-hidden">
                        <img
                          src={course.imageUrl || "/placeholder.svg"}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {course.category}
                          </span>
                        </div>
                        <h3 className="font-medium mb-1">{course.title}</h3>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <BookOpen className="w-3 h-3 mr-1" />
                          <span>{course.lessons?.length || 0} darslar</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button 
                      asChild 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleCourseClick(course.id)}
                    >
                      <Link href={`/courses/${course.id}`}>Batafsil</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {inProgressCourses.length === 0 && recommendedCourses.length === 0 && !loading && (
          <Card className="p-8 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Hali kurslar mavjud emas</h3>
            <p className="text-muted-foreground mb-4">
              O'rganishni boshlash uchun qiziqarli kurslarni ko'ring
            </p>
            <Button asChild>
              <Link href="/courses">Kurslarni ko'rish</Link>
            </Button>
          </Card>
        )}
      </div>
      <MobileNavigation />
    </main>
  )
}
