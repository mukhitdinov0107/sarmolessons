import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { MobileNavigation } from "@/components/mobile-navigation"
import { BookOpen, Clock, Trophy } from "lucide-react"

export default function DashboardPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 container px-4 py-8 pb-20">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Salom, Alisher!</h1>
          <p className="text-muted-foreground">O&apos;rganishni davom ettiring</p>
        </header>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Davom ettirilayotgan kurslar</h2>
          <div className="space-y-4">
            {inProgressCourses.map((course) => (
              <Card key={course.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-md bg-muted flex-shrink-0 overflow-hidden">
                      <img
                        src={course.image || "/placeholder.svg"}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{course.title}</h3>
                      <div className="flex items-center text-xs text-muted-foreground mb-2">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>
                          {course.completedLessons} / {course.totalLessons} darslar
                        </span>
                      </div>
                      <Progress value={(course.completedLessons / course.totalLessons) * 100} className="h-2 mb-2" />
                      <div className="text-xs text-muted-foreground">
                        {Math.round((course.completedLessons / course.totalLessons) * 100)}% tugallangan
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button asChild className="w-full">
                    <Link href={`/courses/${course.id}/lessons/${course.currentLesson}`}>Davom ettirish</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Yutuqlaringiz</h2>
          <div className="grid grid-cols-2 gap-4">
            {achievements.map((achievement, index) => (
              <Card key={index} className="p-4 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-medium text-sm mb-1">{achievement.title}</h3>
                <p className="text-xs text-muted-foreground">{achievement.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Tavsiya etilgan kurslar</h2>
          <div className="space-y-4">
            {recommendedCourses.map((course) => (
              <Card key={course.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-md bg-muted flex-shrink-0 overflow-hidden">
                      <img
                        src={course.image || "/placeholder.svg"}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {course.category}
                        </span>
                      </div>
                      <h3 className="font-medium mb-1">{course.title}</h3>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <BookOpen className="w-3 h-3 mr-1" />
                        <span>{course.lessonCount} darslar</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/courses/${course.id}`}>Batafsil</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      </div>
      <MobileNavigation />
    </main>
  )
}

const inProgressCourses = [
  {
    id: "1",
    title: "Sun'iy intellekt asoslari",
    completedLessons: 5,
    totalLessons: 12,
    currentLesson: 6,
    image: "/placeholder.svg?height=64&width=64",
  },
  {
    id: "3",
    title: "ChatGPT va LLM modellar",
    completedLessons: 2,
    totalLessons: 8,
    currentLesson: 3,
    image: "/placeholder.svg?height=64&width=64",
  },
]

const achievements = [
  {
    title: "Birinchi dars",
    description: "Birinchi darsni muvaffaqiyatli tugatdingiz",
  },
  {
    title: "O'rganishda davom",
    description: "5 ta darsni tugatdingiz",
  },
  {
    title: "Faol o'quvchi",
    description: "7 kun davomida platformadan foydalandingiz",
  },
  {
    title: "Bilimdon",
    description: "Birinchi testdan 90% ball to'pladingiz",
  },
]

const recommendedCourses = [
  {
    id: "2",
    title: "Machine Learning amaliyotda",
    category: "O'rta",
    lessonCount: 15,
    image: "/placeholder.svg?height=64&width=64",
  },
  {
    id: "4",
    title: "Computer Vision asoslari",
    category: "Yuqori",
    lessonCount: 10,
    image: "/placeholder.svg?height=64&width=64",
  },
]
