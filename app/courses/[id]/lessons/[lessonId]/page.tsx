"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { MobileNavigation } from "@/components/mobile-navigation"
import { ArrowLeft, ArrowRight, CheckCircle, Download, ExternalLink, Loader2 } from "lucide-react"
import { Lesson, Attachment, LessonLink } from "@/lib/types"
import { AttachmentIcon } from "@/components/ui/attachment-icon"
import { VideoPlayer } from "@/components/video-player"
import { ProgressService } from "@/lib/services/progress"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

interface LessonPageProps {
  params: Promise<{ id: string; lessonId: string }>
}

export default function LessonPage({ params }: LessonPageProps) {
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [allLessons, setAllLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [courseId, setCourseId] = useState<string>("")
  const [lessonId, setLessonId] = useState<string>("")
  const [videoProgress, setVideoProgress] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [savingCompletion, setSavingCompletion] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    const loadData = async () => {
      const resolvedParams = await params
      setCourseId(resolvedParams.id)
      setLessonId(resolvedParams.lessonId)
      
      try {
        const response = await fetch('/api/courses/' + resolvedParams.id + '/lessons/' + resolvedParams.lessonId)
        if (response.ok) {
          const data = await response.json()
          setLesson(data.lesson)
          setAllLessons(data.allLessons)
        } else {
          // Fallback to reading from JSON directly
          const coursesResponse = await fetch('/data/courses.json')
          const coursesData = await coursesResponse.json()
          
          const course = coursesData.courses.find((c: any) => c.id === resolvedParams.id)
          if (course && course.lessons) {
            const foundLesson = course.lessons.find((l: Lesson) => l.id === resolvedParams.lessonId)
            setLesson(foundLesson || null)
            setAllLessons(course.lessons)
          }
        }
      } catch (error) {
        console.error('Error loading lesson:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params])
  
  // Check if lesson is already completed when user is logged in
  useEffect(() => {
    const checkLessonCompletion = async () => {
      if (user?.uid && courseId && lessonId) {
        try {
          console.log('Checking lesson completion for:', user.uid, courseId, lessonId)
          const lessonProgress = await ProgressService.getLessonProgress(user.uid, courseId, lessonId)
          console.log('Lesson progress:', lessonProgress)
          if (lessonProgress) {
            setIsCompleted(true)
          }
        } catch (error) {
          console.error('Error checking lesson completion:', error)
        }
      }
    }
    
    if (user && !loading) {
      checkLessonCompletion()
    }
  }, [user, courseId, lessonId])

  const handleVideoProgress = (progress: number) => {
    setVideoProgress(progress)
    // Only auto-complete if progress is high enough
    if (progress >= 90 && !isCompleted && user?.uid) {
      completeLesson()
    }
  }
  
  const completeLesson = async () => {
    if (!user?.uid || !courseId || !lessonId || savingCompletion) return
    
    setSavingCompletion(true)
    try {
      console.log('Completing lesson:', user.uid, courseId, lessonId)
      const timeSpent = Math.floor(Math.random() * 10) + 5 // Mock time spent (5-15 minutes)
      const result = await ProgressService.completeLessonAndUpdateProgress(
        user.uid,
        courseId,
        lessonId,
        timeSpent,
        videoProgress
      )
      
      console.log('Completion result:', result)
      if (result.success) {
        setIsCompleted(true)
        toast.success('Dars muvaffaqiyatli tugallandi!', {
          description: 'Kurs progressingiz yangilandi',
          duration: 3000
        })
      } else {
        toast.error(result.error || 'Xatolik yuz berdi', {
          description: 'Darsni tugatishda xatolik yuz berdi',
          duration: 3000
        })
      }
    } catch (error) {
      console.error('Error completing lesson:', error)
      toast.error('Xatolik yuz berdi', {
        description: 'Darsni tugatishda xatolik yuz berdi',
        duration: 3000
      })
    } finally {
      setSavingCompletion(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col">
        <div className="flex-1 container px-4 py-8 pb-20 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Dars yuklanmoqda...</p>
          </div>
        </div>
        <MobileNavigation />
      </main>
    )
  }

  if (!lesson) {
    return (
      <main className="min-h-screen flex flex-col">
        <div className="flex-1 container px-4 py-8 pb-20 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Dars topilmadi</p>
            <Button asChild>
              <Link href={`/courses/${courseId}`}>Kursga qaytish</Link>
            </Button>
          </div>
        </div>
        <MobileNavigation />
      </main>
    )
  }

  // Find previous and next lessons
  const currentIndex = allLessons.findIndex(l => l.id === lessonId)
  const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 container px-4 py-8 pb-20">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href={`/courses/${courseId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kursga qaytish
          </Link>
        </Button>

        <h1 className="text-xl font-bold mb-4">{lesson.title}</h1>

        {/* Video Player */}
        <div className="mb-6">
          <VideoPlayer
            videoUrl={lesson.videoUrl || ""}
            title={lesson.title}
            onProgressUpdate={handleVideoProgress}
          />
        </div>

        {/* Overall Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Dars jarayoni</span>
            <span>{Math.round(videoProgress)}%</span>
          </div>
          <Progress value={videoProgress} className="h-2" />
        </div>

        {/* Lesson Content */}
        <div className="prose prose-sm max-w-none mb-8" dangerouslySetInnerHTML={{ __html: lesson.content }} />

        {/* Attachments Section */}
        {lesson.attachments && lesson.attachments.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Qo'shimcha materiallar
              </CardTitle>
              <CardDescription>Darsga tegishli fayllar va materiallar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lesson.attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <AttachmentIcon type={attachment.type} />
                      <div>
                        <p className="font-medium">{attachment.name}</p>
                        <p className="text-sm text-muted-foreground">{attachment.description}</p>
                        <p className="text-xs text-muted-foreground">{attachment.size}</p>
                      </div>
                    </div>
                    <Button size="sm" asChild>
                      <a href={attachment.url} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-1" />
                        Yuklab olish
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
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Foydali havolalar
              </CardTitle>
              <CardDescription>Darsga tegishli qo'shimcha resurslar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lesson.links.map((link) => (
                  <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <ExternalLink className="h-4 w-4" />
                      <div>
                        <p className="font-medium">{link.title}</p>
                        <p className="text-sm text-muted-foreground">{link.description}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        Ochish
                        <ExternalLink className="h-4 w-4 ml-1" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between mb-6">
          {previousLesson && (
            <Button variant="outline" asChild>
              <Link href={`/courses/${courseId}/lessons/${previousLesson.id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Oldingi dars
              </Link>
            </Button>
          )}
          
          <div className="flex-1" />
          
          {nextLesson && (
            <Button asChild>
              <Link href={`/courses/${courseId}/lessons/${nextLesson.id}`}>
                Keyingi dars
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>

        {/* Completion Button */}
        <div className="text-center">
          <Button 
            variant={isCompleted ? "default" : "outline"} 
            className="w-full"
            onClick={completeLesson}
            disabled={!user?.uid || savingCompletion || loading}
          >
            {savingCompletion ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saqlanmoqda...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                {isCompleted ? "Dars tugallandi!" : "Darsni tugatilgan deb belgilash"}
              </>
            )}
          </Button>
          {!user?.uid && (
            <p className="text-xs text-muted-foreground mt-2">
              Progressni saqlash uchun tizimga kiring
            </p>
          )}
        </div>
      </div>
      <MobileNavigation />
    </main>
  )
}
