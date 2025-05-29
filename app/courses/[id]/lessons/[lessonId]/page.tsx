"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, ArrowRight, CheckCircle, Download, ExternalLink, Loader2 } from "lucide-react"
import { Lesson, Attachment, LessonLink } from "@/lib/types"
import { AttachmentIcon } from "@/components/ui/attachment-icon"
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
  const [videoProgress, setVideoProgress] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    let isMounted = true
    let progressInterval: NodeJS.Timeout | null = null
    
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
          setCourse({
            ...data.data.course,
            lessons: data.data.allLessons
          })
          
          // Start tracking progress if user is logged in
          if (user) {
            try {
              await ProgressService.updateLessonProgress(user.uid, courseId, lessonId, 0, false)
              
              // Start periodic progress updates
              progressInterval = setInterval(async () => {
                try {
                  await ProgressService.updateLessonProgress(user.uid, courseId, lessonId, 1, false)
                } catch (err) {
                  console.error('Error updating progress:', err)
                }
              }, 60000) // Update every minute
            } catch (err) {
              console.error('Error initializing progress:', err)
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
      if (progressInterval) {
        clearInterval(progressInterval)
      }
    }
  }, [courseId, lessonId, user])

  const handleVideoProgress = async (progress: number) => {
    setVideoProgress(progress)
    if (progress >= 90 && !isCompleted) {
      setIsCompleted(true)
      try {
        await ProgressService.updateLessonProgress(user!.uid, courseId, lessonId, 0, true)
        if (lesson?.quiz) {
          setShowQuiz(true)
        }
      } catch (err) {
        console.error('Error marking lesson as completed:', err)
      }
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
        <div className="flex items-center justify-between">
          <div>
            <Link
              href={`/courses/${courseId}`}
              className="text-sm text-muted-foreground hover:text-foreground mb-2 flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {course.title}
            </Link>
            <h1 className="text-2xl font-bold">{lesson.title}</h1>
            <p className="text-muted-foreground mt-1">{lesson.description}</p>
          </div>
          {isCompleted && (
            <div className="flex items-center text-green-500">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span>Tugatildi</span>
            </div>
          )}
        </div>

        {lesson.videoUrl && (
          <Card>
            <CardContent className="p-0 aspect-video">
              <VideoPlayer
                url={lesson.videoUrl}
                onProgress={handleVideoProgress}
              />
            </CardContent>
          </Card>
        )}

        {lesson.content && (
          <Card>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none py-6">
              <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
            </CardContent>
          </Card>
        )}

        {lesson.attachments && lesson.attachments.length > 0 && (
          <Card>
            <CardContent className="py-6">
              <h3 className="text-lg font-semibold mb-4">Qo'shimcha materiallar</h3>
              <div className="space-y-4">
                {lesson.attachments.map((attachment: Attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AttachmentIcon type={attachment.type} className="w-8 h-8 mr-3" />
                      <div>
                        <p className="font-medium">{attachment.title}</p>
                        <p className="text-sm text-muted-foreground">{attachment.description}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={attachment.url} target="_blank">
                        <Download className="w-4 h-4 mr-2" />
                        Yuklab olish
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {lesson.links && lesson.links.length > 0 && (
          <Card>
            <CardContent className="py-6">
              <h3 className="text-lg font-semibold mb-4">Foydali havolalar</h3>
              <div className="space-y-4">
                {lesson.links.map((link: LessonLink) => (
                  <div key={link.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{link.title}</p>
                      <p className="text-sm text-muted-foreground">{link.description}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={link.url} target="_blank">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Ochish
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
                <ArrowLeft className="mr-2 h-4 w-4" />
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
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Link href={`/courses/${courseId}`}>
              <Button>
                Kursni tugatish
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
