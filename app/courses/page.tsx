import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { MobileNavigation } from "@/components/mobile-navigation"
import { BookOpen, Search } from "lucide-react"

export default function CoursesPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 container px-4 py-8 pb-20">
        <header className="mb-6">
          <h1 className="text-2xl font-bold mb-4">Kurslar</h1>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Kurslarni qidirish..." className="pl-9" />
          </div>
        </header>

        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="all">Barchasi</TabsTrigger>
            <TabsTrigger value="beginner">Boshlang'ich</TabsTrigger>
            <TabsTrigger value="intermediate">O'rta</TabsTrigger>
            <TabsTrigger value="advanced">Yuqori</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="space-y-4">
            {allCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </TabsContent>
          <TabsContent value="beginner" className="space-y-4">
            {allCourses
              .filter((course) => course.level === "Boshlang'ich")
              .map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
          </TabsContent>
          <TabsContent value="intermediate" className="space-y-4">
            {allCourses
              .filter((course) => course.level === "O'rta")
              .map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
          </TabsContent>
          <TabsContent value="advanced" className="space-y-4">
            {allCourses
              .filter((course) => course.level === "Yuqori")
              .map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
          </TabsContent>
        </Tabs>
      </div>
      <MobileNavigation />
    </main>
  )
}

interface Course {
  id: string
  title: string
  description: string
  level: string
  lessonCount: number
  duration: string
  image: string
}

function CourseCard({ course }: { course: Course }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="w-20 h-20 rounded-md bg-muted flex-shrink-0 overflow-hidden">
            <img src={course.image || "/placeholder.svg"} alt={course.title} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{course.level}</span>
            </div>
            <h3 className="font-medium mb-1">{course.title}</h3>
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{course.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs text-muted-foreground">
                <BookOpen className="w-3 h-3 mr-1" />
                <span>
                  {course.lessonCount} darslar • {course.duration}
                </span>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/courses/${course.id}`}>Batafsil</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const allCourses: Course[] = [
  {
    id: "1",
    title: "Sun'iy intellekt asoslari",
    description: "AI texnologiyalari bilan tanishing va asosiy tushunchalarni o'rganing",
    level: "Boshlang'ich",
    lessonCount: 12,
    duration: "6 soat",
    image: "/placeholder.svg?height=80&width=80",
  },
  {
    id: "2",
    title: "Machine Learning amaliyotda",
    description: "Amaliy mashg'ulotlar orqali ML algoritmlarini o'rganing",
    level: "O'rta",
    lessonCount: 15,
    duration: "8 soat",
    image: "/placeholder.svg?height=80&width=80",
  },
  {
    id: "3",
    title: "ChatGPT va LLM modellar",
    description: "Zamonaviy til modellari bilan ishlashni o'rganing",
    level: "Yuqori",
    lessonCount: 8,
    duration: "4 soat",
    image: "/placeholder.svg?height=80&width=80",
  },
  {
    id: "4",
    title: "Computer Vision asoslari",
    description: "Kompyuter ko'rish texnologiyalari va ularning qo'llanilishi",
    level: "O'rta",
    lessonCount: 10,
    duration: "5 soat",
    image: "/placeholder.svg?height=80&width=80",
  },
  {
    id: "5",
    title: "Neural Networks va Deep Learning",
    description: "Neyron tarmoqlar va chuqur o'rganish asoslari",
    level: "Yuqori",
    lessonCount: 14,
    duration: "7 soat",
    image: "/placeholder.svg?height=80&width=80",
  },
  {
    id: "6",
    title: "AI loyihalarni boshqarish",
    description: "AI loyihalarni rejalashtirish va amalga oshirish",
    level: "Boshlang'ich",
    lessonCount: 6,
    duration: "3 soat",
    image: "/placeholder.svg?height=80&width=80",
  },
]
