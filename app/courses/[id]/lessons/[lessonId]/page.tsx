"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, ArrowRight, CheckCircle, Download, ExternalLink, Loader2 } from "lucide-react"
import { Lesson, Attachment, Course } from "@/lib/types"
import { AttachmentIcon } from "@/components/ui/attachment-icon"
import { VideoPlayer } from "@/components/video-player"
import { ProgressService } from "@/lib/services/progress"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { useParams, useRouter } from 'next/navigation'
import { Skeleton } from "@/components/ui/skeleton"
import { Quiz } from "@/components/Quiz"

interface Link {
  id: string;
  url: string;
  title?: string;
  description?: string;
}

interface LessonPageProps {}

export default function LessonPage({}: LessonPageProps) {
  const router = useRouter()
  const params = useParams<{ id: string; lessonId: string }>()
  const courseId = Array.isArray(params.id) ? params.id[0] : params.id || ''
  const lessonId = Array.isArray(params.lessonId) ? params.lessonId[0] : params.lessonId || ''
  
  const { user } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showQuiz, setShowQuiz] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)

  // Validate route params
  useEffect(() => {
    if (!courseId || !lessonId) {
      setError("Noto'g'ri dars manzili")
      setLoading(false)
      return
    }
  }, [courseId, lessonId])

  useEffect(() => {
    if (!courseId || !lessonId || !user) return
    
    let isMounted = true
    let progressInterval: NodeJS.Timeout | null = null
    let lastProgressUpdate = Date.now()
    
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
            lessons: Array.isArray(data.data.allLessons) ? data.data.allLessons : []
          })
          
          // Initialize progress
          await ProgressService.updateLessonProgress(user.uid, courseId, lessonId, 0, false)
              
          // Update progress every 2 minutes, but only if there's been activity
          progressInterval = setInterval(async () => {
            const now = Date.now()
            if (now - lastProgressUpdate >= 120000) { // 2 minutes
              try {
                await ProgressService.updateLessonProgress(user.uid, courseId, lessonId, 1, false)
                lastProgressUpdate = now
              } catch (err) {
                console.error('Error updating progress:', err)
              }
            }
          }, 120000) // Check every 2 minutes
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
    if (progress >= 90 && !isCompleted && user?.uid) {
      try {
        await ProgressService.updateLessonProgress(user.uid, courseId, lessonId, 0, true)
        setIsCompleted(true)
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
          <div className="flex items-center space-x-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  if (error || !lesson || !course) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-destructive space-y-2">
                <h2 className="text-lg font-semibold">Xatolik yuz berdi</h2>
                <p>{error || 'Dars topilmadi'}</p>
              </div>
              <div className="flex justify-center space-x-4">
                <Button variant="outline" onClick={() => router.push(`/courses/${courseId}`)}>
                  Kursga qaytish
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Qayta yuklash
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentIndex = course.lessons?.findIndex((l: { id: string }) => l.id === lessonId) ?? -1
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
                videoUrl={lesson.videoUrl} 
                title={lesson.title}
                onProgressUpdate={handleVideoProgress}
                className="w-full h-full"
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
                        <p className="font-medium">{attachment.name}</p>
                        <p className="text-sm text-muted-foreground">{attachment.description}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={attachment.url} download>
                        <Download className="w-4 h-4 mr-2" />
                        Yuklab olish
                      </a>
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
                {lesson.links.map((link) => (
                  <div key={link.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{link.title}</p>
                      <p className="text-sm text-muted-foreground">{link.description}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Ochish
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!isCompleted && (
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">Darsni tugatish</h3>
                  <p className="text-sm text-muted-foreground">
                    Darsni tugatish uchun videoni oxirigacha ko'ring yoki tugmani bosing
                  </p>
                </div>
                <Button 
                  onClick={async () => {
                    if (!user?.uid) return
                    try {
                      await ProgressService.updateLessonProgress(user.uid, courseId, lessonId, 100, true)
                      setIsCompleted(true)
                      if (lesson?.quiz) {
                        setShowQuiz(true)
                      }
                      toast.success("Dars muvaffaqiyatli tugatildi!")
                    } catch (err) {
                      console.error('Error marking lesson as completed:', err)
                      toast.error("Xatolik yuz berdi")
                    }
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Yuklanmoqda...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Darsni tugatish
                    </>
                  )}
                </Button>
              </div>
              <Progress value={videoProgress} className="mt-4" />
            </CardContent>
          </Card>
        )}

        {lesson.quiz && (showQuiz || !lesson.videoUrl) && (
          <Card>
            <CardContent className="py-6">
              <Quiz
                courseId={courseId}
                lessonId={lessonId}
                quiz={lesson.quiz}
              />
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between mt-8">
          <Button 
            variant="outline" 
            onClick={() => previousLesson && router.push(`/courses/${courseId}/lessons/${previousLesson.id}`)} 
            disabled={!previousLesson}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Oldingi dars
          </Button>
          <Button 
            onClick={() => nextLesson 
              ? router.push(`/courses/${courseId}/lessons/${nextLesson.id}`)
              : router.push(`/courses/${courseId}`)
            }
          >
            {nextLesson ? 'Keyingi dars' : 'Kursni tugatish'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}
