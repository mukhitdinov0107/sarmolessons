'use client';

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { BookOpen, Check, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useEnrollments } from "@/hooks/useProgress"
import { useEffect, useState } from "react"

export interface CourseCardProps {
  course: {
    id: string
    title: string
    description: string
    level: string
    lessons?: any[]
    duration: string
    imageUrl?: string
    shortDescription?: string
    instructor?: string
    isFeatured?: boolean
  }
}

export function CourseCard({ course }: CourseCardProps) {
  const { user } = useAuth()
  const { enrollments, loading, isEnrolled, getEnrollment, enrollInCourse } = useEnrollments()
  const [isEnrolledState, setIsEnrolledState] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (user) {
      const enrolled = isEnrolled(course.id)
      setIsEnrolledState(enrolled)
      
      if (enrolled) {
        const enrollment = getEnrollment(course.id)
        const completedLessons = Array.isArray(enrollment?.progress?.completedLessons) 
          ? enrollment.progress.completedLessons.length 
          : 0
        const totalLessons = course.lessons?.length || 1
        setProgress(Math.round((completedLessons / totalLessons) * 100))
      }
    }
  }, [user, enrollments, course.id])

  const handleEnroll = async () => {
    if (!user) {
      window.location.href = '/login'
      return
    }
    
    setIsLoading(true)
    try {
      await enrollInCourse(course.id)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="w-20 h-20 rounded-md bg-muted flex-shrink-0 overflow-hidden">
              <img src={course.imageUrl || "/placeholder.svg"} alt={course.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{course.level}</span>
              </div>
              <h3 className="font-medium mb-1">{course.title}</h3>
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {course.shortDescription || course.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-muted-foreground">
                  <BookOpen className="w-3 h-3 mr-1" />
                  <span>{(course.lessons?.length || 0) > 0 ? `${course.lessons?.length} dars` : 'Darslar mavjud emas'} • {course.duration}</span>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/login?redirect=/courses/${course.id}`}>Kirish</Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="w-20 h-20 rounded-md bg-muted flex-shrink-0 overflow-hidden">
            <img 
              src={imageError || !course.imageUrl ? "/placeholder.svg" : course.imageUrl} 
              alt={course.title} 
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{course.level}</span>
              {isEnrolledState && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                  Yozilgansiz
                </span>
              )}
            </div>
            <h3 className="font-medium mb-1">{course.title}</h3>
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{course.description}</p>
            
            {isEnrolledState && progress > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                <div 
                  className="bg-green-600 h-1.5 rounded-full" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs text-muted-foreground">
                <BookOpen className="w-3 h-3 mr-1" />
                <span>
                  {course.lessons?.length || 0} darslar • {course.duration}
                </span>
              </div>
              
              {isEnrolledState ? (
                <Button asChild size="sm">
                  <Link href={`/courses/${course.id}`}>
                    {progress > 0 ? 'Davom etish' : 'Boshlash'}
                  </Link>
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  onClick={handleEnroll}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Yozilmoqda...
                    </>
                  ) : "Kursga yozilish"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
