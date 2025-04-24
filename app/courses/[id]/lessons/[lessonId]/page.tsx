"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { MobileNavigation } from "@/components/mobile-navigation"
import { ArrowLeft, ArrowRight, CheckCircle, PlayCircle } from "lucide-react"

export default function LessonPage({
  params,
}: {
  params: { id: string; lessonId: string }
}) {
  const [videoProgress, setVideoProgress] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)

  // In a real app, you would fetch the course and lesson data based on the IDs
  const courseId = params.id
  const lessonId = Number.parseInt(params.lessonId)

  // Mock data for the current lesson
  const lesson = {
    title: "AI etikasi va xavfsizligi",
    description: "AI texnologiyalarini mas'uliyatli qo'llash",
    videoUrl: "/placeholder.svg?height=480&width=640",
    duration: "25 daqiqa",
    content: `
      <h2>AI etikasi va xavfsizligi</h2>
      <p>Sun'iy intellekt texnologiyalari kundan-kunga rivojlanib bormoqda. Bu esa etika va xavfsizlik masalalarini ko'ndalang qo'ymoqda.</p>
      <h3>Asosiy etik masalalar:</h3>
      <ul>
        <li>Shaxsiy ma'lumotlar maxfiyligi</li>
        <li>Algoritm adolati va shaffofligi</li>
        <li>AI qarorlarining mas'uliyati</li>
        <li>Ish o'rinlari va iqtisodiy ta'sir</li>
      </ul>
      <p>AI tizimlarini ishlab chiqishda va qo'llashda ushbu masalalarni hisobga olish muhim.</p>
      <h3>Xavfsizlik choralari:</h3>
      <ul>
        <li>Ma'lumotlarni himoyalash</li>
        <li>Algoritm zaifliklarini bartaraf etish</li>
        <li>Tizimni muntazam tekshirish</li>
        <li>Foydalanuvchilar xavfsizligini ta'minlash</li>
      </ul>
      <p>AI texnologiyalarini mas'uliyatli qo'llash orqali jamiyatga foyda keltirish mumkin.</p>
    `,
  }

  // Simulate video progress
  const handleVideoProgress = () => {
    if (videoProgress < 100) {
      const newProgress = Math.min(videoProgress + 10, 100)
      setVideoProgress(newProgress)

      if (newProgress === 100) {
        setIsCompleted(true)
      }
    }
  }

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

        <div className="bg-muted rounded-lg mb-6 relative aspect-video overflow-hidden">
          <img src={lesson.videoUrl || "/placeholder.svg"} alt={lesson.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-16 h-16 bg-background/80"
              onClick={handleVideoProgress}
            >
              <PlayCircle className="h-8 w-8" />
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Video jarayoni</span>
            <span>{videoProgress}%</span>
          </div>
          <Progress value={videoProgress} className="h-2" />
        </div>

        <div className="prose prose-sm max-w-none mb-8" dangerouslySetInnerHTML={{ __html: lesson.content }} />

        <div className="flex justify-between">
          {lessonId > 1 && (
            <Button variant="outline" asChild>
              <Link href={`/courses/${courseId}/lessons/${lessonId - 1}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Oldingi dars
              </Link>
            </Button>
          )}

          <div className="flex-1" />

          <Button
            disabled={!isCompleted}
            onClick={() => setIsCompleted(true)}
            className={isCompleted ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {isCompleted ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Tugallangan
              </>
            ) : (
              "Darsni tugatish"
            )}
          </Button>

          <div className="ml-2">
            <Button asChild>
              <Link href={`/courses/${courseId}/lessons/${lessonId + 1}`}>
                Keyingi dars
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <MobileNavigation />
    </main>
  )
}
