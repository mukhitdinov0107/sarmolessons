import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { MobileNavigation } from "@/components/mobile-navigation"
import { ArrowLeft, BookOpen, Clock, User } from "lucide-react"

export default function CoursePage({ params }: { params: { id: string } }) {
  // In a real app, you would fetch the course data based on the ID
  const course = courses.find((c) => c.id === params.id) || courses[0]

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 container px-4 py-8 pb-20">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/courses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Orqaga
          </Link>
        </Button>

        <div className="h-48 bg-muted rounded-lg mb-6 relative overflow-hidden">
          <img src={course.image || "/placeholder.svg"} alt={course.title} className="w-full h-full object-cover" />
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm px-2 py-1 rounded-full bg-primary/10 text-primary">{course.level}</span>
            <span className="text-sm text-muted-foreground">
              {course.lessonCount} darslar • {course.duration}
            </span>
          </div>
          <h1 className="text-2xl font-bold mb-2">{course.title}</h1>
          <p className="text-muted-foreground mb-4">{course.description}</p>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">{course.instructor}</p>
              <p className="text-xs text-muted-foreground">{course.instructorTitle}</p>
            </div>
          </div>

          <Button className="w-full mb-4">{course.enrolled ? "Davom ettirish" : "Kursga yozilish"}</Button>

          {course.enrolled && (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Jarayon</span>
                <span>{course.progress}%</span>
              </div>
              <Progress value={course.progress} className="h-2" />
            </div>
          )}
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Kurs haqida</CardTitle>
            <CardDescription>Bu kurs nimalarni o&apos;z ichiga oladi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {course.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-3 h-3 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{feature.title}</p>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Darslar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {course.lessons.map((lesson, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                      {index + 1}
                    </div>
                    <h3 className="font-medium">{lesson.title}</h3>
                  </div>
                  {lesson.completed && (
                    <div className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">Tugallangan</div>
                  )}
                </div>
                <div className="flex items-center text-xs text-muted-foreground mb-2">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>{lesson.duration}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{lesson.description}</p>
                <Button
                  size="sm"
                  variant={lesson.available ? "default" : "outline"}
                  disabled={!lesson.available}
                  className="w-full"
                  asChild={lesson.available}
                >
                  {lesson.available ? (
                    <Link href={`/courses/${course.id}/lessons/${index + 1}`}>
                      {lesson.completed ? "Qayta ko'rish" : "Boshlash"}
                    </Link>
                  ) : (
                    <span>Qulflangan</span>
                  )}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <MobileNavigation />
    </main>
  )
}

const courses = [
  {
    id: "1",
    title: "Sun'iy intellekt asoslari",
    description: "AI texnologiyalari bilan tanishing va asosiy tushunchalarni o'rganing",
    level: "Boshlang'ich",
    lessonCount: 12,
    duration: "6 soat",
    image: "/placeholder.svg?height=192&width=384",
    instructor: "Alisher Isaev",
    instructorTitle: "AI mutaxassisi",
    enrolled: true,
    progress: 40,
    features: [
      {
        icon: BookOpen,
        title: "12 ta video darslar",
        description: "Har bir mavzu bo'yicha batafsil tushuntirishlar",
      },
      {
        icon: Clock,
        title: "O'z sur'atingizda o'rganing",
        description: "Darslarni istalgan vaqtda ko'rishingiz mumkin",
      },
      {
        icon: User,
        title: "Tajribali o'qituvchi",
        description: "AI sohasida 5 yillik tajribaga ega mutaxassis",
      },
    ],
    lessons: [
      {
        title: "Sun'iy intellekt nima?",
        description: "AI asoslari va uning qo'llanilish sohalari",
        duration: "30 daqiqa",
        completed: true,
        available: true,
      },
      {
        title: "Machine Learning asoslari",
        description: "ML algoritmlari va ularning ishlash printsiplari",
        duration: "45 daqiqa",
        completed: true,
        available: true,
      },
      {
        title: "Deep Learning kirish",
        description: "Neyron tarmoqlar va chuqur o'rganish asoslari",
        duration: "40 daqiqa",
        completed: true,
        available: true,
      },
      {
        title: "Natural Language Processing",
        description: "Tabiiy tilni qayta ishlash texnologiyalari",
        duration: "35 daqiqa",
        completed: true,
        available: true,
      },
      {
        title: "Computer Vision asoslari",
        description: "Kompyuter ko'rish texnologiyalari",
        duration: "50 daqiqa",
        completed: true,
        available: true,
      },
      {
        title: "AI etikasi va xavfsizligi",
        description: "AI texnologiyalarini mas'uliyatli qo'llash",
        duration: "25 daqiqa",
        completed: false,
        available: true,
      },
      {
        title: "AI loyihalarni rejalashtirish",
        description: "AI loyihalarni bosqichma-bosqich amalga oshirish",
        duration: "40 daqiqa",
        completed: false,
        available: false,
      },
      {
        title: "AI modellarni baholash",
        description: "AI modellar samaradorligini o'lchash usullari",
        duration: "30 daqiqa",
        completed: false,
        available: false,
      },
      {
        title: "Reinforcement Learning",
        description: "Kuchaytirilgan o'rganish asoslari",
        duration: "45 daqiqa",
        completed: false,
        available: false,
      },
      {
        title: "AI va Big Data",
        description: "Katta ma'lumotlar bilan ishlash",
        duration: "35 daqiqa",
        completed: false,
        available: false,
      },
      {
        title: "AI loyiha amaliyoti",
        description: "Amaliy loyiha ustida ishlash",
        duration: "60 daqiqa",
        completed: false,
        available: false,
      },
      {
        title: "Kelajakdagi AI texnologiyalari",
        description: "AI sohasidagi yangi yo'nalishlar",
        duration: "30 daqiqa",
        completed: false,
        available: false,
      },
    ],
  },
]
