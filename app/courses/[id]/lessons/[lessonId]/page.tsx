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
          
          // Check if the lesson is already completed
          const lessonProgress = await ProgressService.getLessonProgress(user.uid, courseId, lessonId)
          if (lessonProgress && lessonProgress.completedAt) {
            setIsCompleted(true)
            setVideoProgress(100)
            console.log('[LessonPage] Lesson already completed:', lessonId)
          } else {
            // Initialize progress if not completed
            await ProgressService.updateLessonProgress(user.uid, courseId, lessonId, 0, false)
          }
              
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
        await ProgressService.completeLessonAndUpdateProgress(user.uid, courseId, lessonId, 5, 100)
        setIsCompleted(true)
        if (lesson?.quiz) {
          setShowQuiz(true)
        }
        toast.success("Dars muvaffaqiyatli tugatildi!")
      } catch (err) {
        console.error('Error marking lesson as completed:', err)
        toast.error("Darsni tugatishda xatolik yuz berdi")
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
    <div className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-3">
            <Link
              href={`/courses/${courseId}`}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {course.title}
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{lesson.title}</h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">{lesson.description}</p>
            </div>
          </div>
          {isCompleted && (
            <div className="flex items-center px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="font-medium">Tugatildi</span>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid gap-8">
          {/* Video Section */}
          {lesson.videoUrl && (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-video">
                  <VideoPlayer 
                    videoUrl={lesson.videoUrl} 
                    title={lesson.title}
                    onProgressUpdate={handleVideoProgress}
                    className="w-full h-full"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content Section */}
          {lesson.content && (
            <Card>
              <CardContent className="prose prose-slate dark:prose-invert max-w-none py-8">
                <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
              </CardContent>
            </Card>
          )}

          {/* Progress Section */}
          {!isCompleted && (
            <Card>
              <CardContent className="py-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-semibold">Darsni tugatish</h3>
                    <p className="text-sm text-muted-foreground">
                      Darsni tugatish uchun videoni oxirigacha ko'ring yoki tugmani bosing
                    </p>
                  </div>
                  <Button 
                    size="lg"
                    onClick={async () => {
                      if (!user?.uid) return
                      try {
                        await ProgressService.completeLessonAndUpdateProgress(user.uid, courseId, lessonId, 5, 100)
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
                <Progress value={videoProgress} className="mt-6" />
              </CardContent>
            </Card>
          )}

          {/* Resources Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Attachments Section */}
            {lesson.attachments && lesson.attachments.length > 0 && (
              <Card>
                <CardContent className="py-6">
                  <h3 className="text-lg font-semibold mb-4">Qo'shimcha materiallar</h3>
                  <div className="space-y-3">
                    {lesson.attachments.map((attachment: Attachment) => (
                      <div 
                        key={attachment.id} 
                        className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <AttachmentIcon type={attachment.type} className="w-8 h-8 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{attachment.name}</p>
                            {attachment.description && (
                              <p className="text-sm text-muted-foreground">{attachment.description}</p>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={attachment.url} download className="flex items-center">
                            <Download className="w-4 h-4 mr-1" />
                            <span className="sr-only">Yuklab olish</span>
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Links Section */}
            {lesson.links && lesson.links.length > 0 && (
              <Card>
                <CardContent className="py-6">
                  <h3 className="text-lg font-semibold mb-4">Foydali havolalar</h3>
                  <div className="space-y-3">
                    {lesson.links.map((link) => (
                      <div 
                        key={link.id} 
                        className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium">{link.title}</p>
                          {link.description && (
                            <p className="text-sm text-muted-foreground">{link.description}</p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <a 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            <span className="sr-only">Ochish</span>
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quiz Section */}
          {lesson.quiz && (showQuiz || !lesson.videoUrl) && (
            <Card>
              <CardContent className="py-8">
                <Quiz
                  courseId={courseId}
                  lessonId={lessonId}
                  quiz={lesson.quiz}
                />
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={() => previousLesson && router.push(`/courses/${courseId}/lessons/${previousLesson.id}`)} 
              disabled={!previousLesson}
              className="min-w-[120px]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Oldingi dars
            </Button>
            <Button 
              onClick={() => nextLesson 
                ? router.push(`/courses/${courseId}/lessons/${nextLesson.id}`)
                : router.push(`/courses/${courseId}`)
              }
              className="min-w-[120px]"
            >
              {nextLesson ? 'Keyingi dars' : 'Kursni tugatish'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
