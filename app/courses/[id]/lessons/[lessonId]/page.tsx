"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, ArrowRight, CheckCircle, Download, ExternalLink, Loader2, PlayCircle, Beaker, Lock } from "lucide-react"
import { Lesson, Attachment, Course } from "@/lib/types"
import { AttachmentIcon } from "@/components/ui/attachment-icon"
import { VideoPlayer } from "@/components/video-player"
import { ProgressService } from "@/lib/services/progress"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { useParams, useRouter } from 'next/navigation'
import { Skeleton } from "@/components/ui/skeleton"
import { Quiz } from "@/components/quiz"
import { generateQuizForLesson } from '@/utils/mockQuizData'

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
  const [isCompleted, setIsCompleted] = useState(false)
  const [quizPassed, setQuizPassed] = useState(false)

  // Validate route params
  useEffect(() => {
    if (!courseId || !lessonId) {
      setError("Invalid lesson URL")
      setLoading(false)
      return
    }
  }, [courseId, lessonId])

  useEffect(() => {
    if (!courseId || !lessonId || !user) return
    
    let isMounted = true
    
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`)
        if (!response.ok) {
          throw new Error('Failed to load lesson')
        }
        
        const data = await response.json()
        if (!data.success) {
          throw new Error(data.error || 'Failed to load lesson')
        }

        if (isMounted) {
          // Generate quiz for the lesson immediately
          const lessonData = data.data.lesson;
          const quiz = generateQuizForLesson(
            lessonId,
            lessonData.title,
            lessonData.content || ''
          );
          
          setLesson({
            ...lessonData,
            quiz
          });
          
          setCourse({
            ...data.data.course,
            lessons: Array.isArray(data.data.allLessons) ? data.data.allLessons : []
          });
          
          // Check if the lesson is already completed
          const lessonProgress = await ProgressService.getLessonProgress(user.uid, courseId, lessonId)
          if (lessonProgress && lessonProgress.completedAt) {
            setIsCompleted(true)
            setQuizPassed(true)
          }
          
          // Show quiz immediately
          setShowQuiz(true)
        }
      } catch (err: any) {
        console.error('Error fetching lesson:', err.message || err)
        if (isMounted) {
          setError(err.message || 'Failed to load lesson')
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

  const handleQuizComplete = async (score: number, total: number, passed: boolean) => {
    if (!user) return
    
    const percentage = (score / total) * 100
    
    try {
      await ProgressService.completeLessonAndUpdateProgress(
        user.uid,
        courseId,
        lessonId,
        0,
        100,
        {
          quizScore: percentage,
          passed
        }
      )
      
      setIsCompleted(true)
      setQuizPassed(passed)
      
      if (passed) {
        toast.success('Congratulations! You can now proceed to the next lesson.')
        // If there's a next lesson, enable navigation to it
        if (nextLesson) {
          router.push(`/courses/${courseId}/lessons/${nextLesson.id}`)
        } else {
          toast.success('You have completed all lessons in this course!')
          router.push(`/courses/${courseId}`)
        }
      } else {
        toast.error('Please try again. You need to score at least 7/10 to proceed.')
      }
    } catch (error) {
      console.error('Error saving quiz results:', error)
      toast.error('Failed to save quiz results')
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
                <h2 className="text-lg font-semibold">Error</h2>
                <p>{error || 'Lesson not found'}</p>
              </div>
              <div className="flex justify-center space-x-4">
                <Button variant="outline" onClick={() => router.push(`/courses/${courseId}`)}>
                  Back to Course
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Retry
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Navigation Bar */}
        <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-slate-900/80 -mx-4 px-4 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => router.push(`/courses/${courseId}`)}
              className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Course
            </Button>
            <div className="flex items-center gap-3">
              {previousLesson && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/courses/${courseId}/lessons/${previousLesson.id}`)}
                  className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
              )}
              {nextLesson && (
                <Button
                  variant={!isCompleted || !quizPassed ? "outline" : "default"}
                  onClick={() => router.push(`/courses/${courseId}/lessons/${nextLesson.id}`)}
                  disabled={!isCompleted || !quizPassed}
                  className="hover:bg-primary/90 transition-colors"
                >
                  {!isCompleted || !quizPassed ? (
                    <>
                      Complete Quiz
                      <Lock className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Next Lesson
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </nav>

        <div className="space-y-8">
          {/* Title Section */}
          <div className="space-y-4 text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {lesson.title}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              {lesson.description}
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Video Section */}
            {lesson.videoUrl && (
              <Card className="overflow-hidden shadow-xl rounded-xl border-0 bg-white dark:bg-slate-900">
                <CardContent className="p-0">
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <VideoPlayer 
                      videoUrl={lesson.videoUrl} 
                      title={lesson.title}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Content Section */}
            {lesson.content && (
              <Card className="shadow-xl rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                <CardContent className="prose prose-slate dark:prose-invert max-w-none p-8 lg:p-10">
                  <div 
                    dangerouslySetInnerHTML={{ __html: lesson.content }}
                    className="[&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:mb-4 [&>p]:text-lg [&>p]:leading-relaxed [&>p]:mb-6 [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:list-decimal [&>ol]:pl-6"
                  />
                </CardContent>
              </Card>
            )}

            {/* Quiz Section */}
            {showQuiz && lesson.quiz && (
              <div className="mt-12">
                <Card className="shadow-xl rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                  <CardHeader className="space-y-4 px-8 pt-8 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Beaker className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-2xl font-bold">Knowledge Check</CardTitle>
                    </div>
                    <p className="text-lg text-muted-foreground">
                      Test your understanding of this lesson. Score at least 7/10 to unlock the next lesson.
                    </p>
                  </CardHeader>
                  <CardContent className="p-8">
                    <Quiz 
                      quiz={lesson.quiz}
                      onComplete={handleQuizComplete}
                      onRetry={() => {
                        setShowQuiz(false)
                        setTimeout(() => setShowQuiz(true), 500)
                      }}
                    />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
