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
    if (!courseId || !lessonId) return
    
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
            lessons: Array.isArray(data.data.allLessons) ? data.data.allLessons : []
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
          <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6">
            {lesson.videoUrl ? (
              <VideoPlayer 
                videoUrl={lesson.videoUrl} 
                title={lesson.title}
                onProgressUpdate={handleVideoProgress}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <p className="text-muted-foreground">Video mavjud emas</p>
              </div>
            )}
          </div>
        )}

        {lesson.content && (
          <Card>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none py-6">
              <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
            </CardContent>
          </Card>
        )}

        {lesson.attachments && lesson.attachments.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Yuklab olish uchun fayllar</h3>
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {lesson.attachments.map((attachment: Attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.url}
                  download
                  className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <AttachmentIcon type={attachment.type} className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">{attachment.name}</span>
                  <Download className="h-4 w-4 ml-auto text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>
        )}

        {lesson.links && lesson.links.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Foydali havolalar</h3>
            <div className="space-y-2">
              {lesson.links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{link.title || 'Havola'}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {lesson.quiz && (showQuiz || !lesson.videoUrl) && (
          <div className="mt-8">
            <Quiz
              courseId={courseId}
              lessonId={lessonId}
              quiz={lesson.quiz}
            />
          </div>
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
