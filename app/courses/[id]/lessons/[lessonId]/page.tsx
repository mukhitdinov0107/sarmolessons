"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { MobileNavigation } from "@/components/mobile-navigation"
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Lesson, Course } from "@/lib/types"
import { VideoPlayer } from "@/components/video-player"
import { ProgressService } from "@/lib/services/progress"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { useParams } from 'next/navigation'
import { Skeleton } from "@/components/ui/skeleton"
import { Quiz } from "@/components/Quiz"

export default function LessonPage() {
  const { id: courseId, lessonId } = useParams() as { id: string; lessonId: string }
  const { user } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showQuiz, setShowQuiz] = useState(false)

  useEffect(() => {
    let isMounted = true
    
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`)
        if (!response.ok) {
          throw new Error('Darsni yuklashda xatolik yuz berdi')
        }
        
        const data = await response.json()
        if (!data.success) {
          throw new Error(data.error || 'Darsni yuklashda xatolik yuz berdi')
        }

        if (isMounted) {
          setLesson(data.data.lesson)
          // Reconstruct the course object with lessons
          setCourse({
            ...data.data.course,
            lessons: data.data.allLessons
          })
          
          // Start tracking progress if user is logged in
          if (user) {
            try {
              await ProgressService.updateLessonProgress(user.uid, courseId, lessonId, 0, false)
            } catch (err) {
              console.error('Error updating progress:', err)
              // Don't throw error here as it's not critical
            }
          }
        }
      } catch (err: any) {
        console.error('Error fetching lesson:', err)
        if (isMounted) {
          setError(err.message || 'Darsni yuklashda xatolik yuz berdi')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()
    
    return () => {
      isMounted = false
    }
  }, [courseId, lessonId, user])

  const handleVideoEnd = async () => {
    if (!user || !lesson) return
    
    try {
      await ProgressService.updateLessonProgress(user.uid, courseId, lessonId, 0, true)
      if (lesson.quiz) {
        setShowQuiz(true)
      }
    } catch (err) {
      console.error('Error updating progress:', err)
      toast.error('Progressni saqlashda xatolik yuz berdi')
    }
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="space-y-8">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-32" />
        </div>
      </div>
    )
  }

  if (error || !lesson || !course) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <p>{error || 'Dars topilmadi'}</p>
              <Link href={`/courses/${courseId}`}>
                <Button variant="outline" className="mt-4">
                  Kursga qaytish
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentIndex = course.lessons?.findIndex(l => l.id === lessonId) ?? -1
  const previousLesson = currentIndex > 0 ? course.lessons?.[currentIndex - 1] : null
  const nextLesson = currentIndex < (course.lessons?.length ?? 0) - 1 
    ? course.lessons?.[currentIndex + 1] 
    : null

  return (
    <div className="container py-8">
      <div className="space-y-8">
        <div>
          <Link
            href={`/courses/${courseId}`}
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            ← {course.title}
          </Link>
          <h1 className="text-2xl font-bold mb-2">{lesson.title}</h1>
          <p className="text-muted-foreground">{lesson.description}</p>
        </div>

        {lesson.videoUrl && (
          <Card>
            <CardContent className="p-0 aspect-video">
              <video
                className="w-full h-full"
                src={lesson.videoUrl}
                controls
                onEnded={handleVideoEnd}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none py-6">
            <div dangerouslySetInnerHTML={{ __html: lesson.content || '' }} />
          </CardContent>
        </Card>

        {lesson.quiz && (showQuiz || !lesson.videoUrl) && (
          <Quiz
            courseId={courseId}
            lessonId={lessonId}
            quiz={lesson.quiz}
          />
        )}

        <div className="flex justify-between mt-8">
          {previousLesson ? (
            <Link href={`/courses/${courseId}/lessons/${previousLesson.id}`}>
              <Button variant="outline">
                <ChevronLeft className="mr-2 h-4 w-4" />
                {previousLesson.title}
              </Button>
            </Link>
          ) : (
            <div />
          )}

          {nextLesson ? (
            <Link href={`/courses/${courseId}/lessons/${nextLesson.id}`}>
              <Button>
                {nextLesson.title}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Link href={`/courses/${courseId}`}>
              <Button>
                Kursni tugatish
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
