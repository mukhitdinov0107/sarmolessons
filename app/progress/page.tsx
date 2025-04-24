import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { MobileNavigation } from "@/components/mobile-navigation"
import { BookOpen, Calendar, CheckCircle, Clock, Trophy } from "lucide-react"

export default function ProgressPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 container px-4 py-8 pb-20">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">O&apos;quv jarayoni</h1>
          <p className="text-muted-foreground">O&apos;rganish yutuqlaringizni kuzating</p>
        </header>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Umumiy statistika</h2>
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Kurslar bo&apos;yicha progress</h2>
          <div className="space-y-4">
            {courseProgress.map((course, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{course.title}</h3>
                    <span className="text-sm text-muted-foreground">
                      {course.completedLessons} / {course.totalLessons} darslar
                    </span>
                  </div>
                  <Progress value={(course.completedLessons / course.totalLessons) * 100} className="h-2 mb-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{Math.round((course.completedLessons / course.totalLessons) * 100)}% tugallangan</span>
                    <span>Oxirgi faollik: {course.lastActivity}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Haftalik faollik</h2>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">O&apos;rganish vaqti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-end justify-between gap-2">
                {weeklyActivity.map((day, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div className="w-full bg-primary/20 rounded-t-sm" style={{ height: `${(day.hours / 3) * 100}%` }}>
                      <div
                        className="w-full bg-primary rounded-t-sm"
                        style={{ height: `${(day.completedHours / day.hours) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs mt-2">{day.day}</span>
                    <span className="text-xs text-muted-foreground">{day.completedHours}s</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Yutuqlar</h2>
          <div className="grid grid-cols-2 gap-4">
            {achievements.map((achievement, index) => (
              <Card key={index} className={achievement.unlocked ? "" : "opacity-50"}>
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                      achievement.unlocked ? "bg-primary/10" : "bg-muted"
                    }`}
                  >
                    <Trophy className={`w-6 h-6 ${achievement.unlocked ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <h3 className="font-medium text-sm mb-1">{achievement.title}</h3>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                  {achievement.unlocked && (
                    <div className="mt-2 text-xs flex items-center text-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Qo&apos;lga kiritilgan
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
      <MobileNavigation />
    </main>
  )
}

const stats = [
  {
    label: "Tugallangan darslar",
    value: 18,
    icon: CheckCircle,
  },
  {
    label: "O'rganish vaqti",
    value: "12 soat",
    icon: Clock,
  },
  {
    label: "Ro'yxatdan o'tilgan kurslar",
    value: 3,
    icon: BookOpen,
  },
  {
    label: "Faol kunlar",
    value: 14,
    icon: Calendar,
  },
]

const courseProgress = [
  {
    title: "Sun'iy intellekt asoslari",
    completedLessons: 5,
    totalLessons: 12,
    lastActivity: "Bugun",
  },
  {
    title: "ChatGPT va LLM modellar",
    completedLessons: 2,
    totalLessons: 8,
    lastActivity: "Kecha",
  },
  {
    title: "Machine Learning amaliyotda",
    completedLessons: 11,
    totalLessons: 15,
    lastActivity: "3 kun oldin",
  },
]

const weeklyActivity = [
  { day: "Du", hours: 2, completedHours: 1.5 },
  { day: "Se", hours: 1, completedHours: 1 },
  { day: "Ch", hours: 2.5, completedHours: 2 },
  { day: "Pa", hours: 1, completedHours: 0.5 },
  { day: "Ju", hours: 3, completedHours: 2.5 },
  { day: "Sh", hours: 2, completedHours: 1.5 },
  { day: "Ya", hours: 1.5, completedHours: 1 },
]

const achievements = [
  {
    title: "Birinchi dars",
    description: "Birinchi darsni muvaffaqiyatli tugatdingiz",
    unlocked: true,
  },
  {
    title: "O'rganishda davom",
    description: "5 ta darsni tugatdingiz",
    unlocked: true,
  },
  {
    title: "Faol o'quvchi",
    description: "7 kun davomida platformadan foydalandingiz",
    unlocked: true,
  },
  {
    title: "Bilimdon",
    description: "Birinchi testdan 90% ball to'pladingiz",
    unlocked: true,
  },
  {
    title: "Kurs tugallandi",
    description: "Birinchi kursni to'liq tugatdingiz",
    unlocked: false,
  },
  {
    title: "AI mutaxassisi",
    description: "3 ta kursni to'liq tugatdingiz",
    unlocked: false,
  },
]
