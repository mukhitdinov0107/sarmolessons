"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { MobileNavigation } from "@/components/mobile-navigation"
import { BookOpen, Calendar, Clock } from "lucide-react"
import { useEnrollments } from "@/hooks/useProgress"
import { useAuth } from "@/hooks/useAuth"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Timestamp } from "firebase/firestore"

// Helper function to check if an object is a raw Firestore timestamp
const isFirestoreTimestamp = (value: any): boolean => {
  return value && 
         typeof value === 'object' && 
         'seconds' in value && 
         'nanoseconds' in value &&
         typeof value.seconds === 'number' &&
         typeof value.nanoseconds === 'number';
};

// Helper function to convert raw Firestore timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (isFirestoreTimestamp(timestamp)) {
    return new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate();
  }
  throw new Error('Invalid timestamp format');
};

// Helper function to safely format dates
const formatDate = (date: Date | Timestamp | any | null | undefined): string => {
  if (!date) return 'Hali yo\'q';
  
  try {
    // Handle raw Firestore timestamp
    if (isFirestoreTimestamp(date)) {
      return format(convertTimestamp(date), 'dd.MM.yyyy');
    }
    
    // Handle Firestore Timestamp instance
    if (date instanceof Timestamp) {
      return format(date.toDate(), 'dd.MM.yyyy');
    }
    
    if (typeof date === 'string') {
      // Check if the string is a valid date
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        console.warn('Invalid date string:', date);
        return 'Noto\'g\'ri sana';
      }
      return format(parsedDate, 'dd.MM.yyyy');
    }
    
    if (date instanceof Date) {
      // Check if the Date object is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid Date object:', date);
        return 'Noto\'g\'ri sana';
      }
      return format(date, 'dd.MM.yyyy');
    }

    console.warn('Unsupported date format:', date);
    return 'Noto\'g\'ri sana';
  } catch (error) {
    console.error('Error formatting date:', error, 'Date value:', date);
    return 'Xato sana';
  }
};

export default function ProgressPage() {
  const { user } = useAuth()
  const { enrollments, loading } = useEnrollments()
  const [stats, setStats] = useState([
    { label: "Tugallangan darslar", value: 0, icon: BookOpen },
    { label: "O'qish vaqti", value: "0 daqiqa", icon: Clock },
    { label: "Kurslar", value: 0, icon: BookOpen },
    { label: "Oxirgi faollik", value: "-Kun-", icon: Calendar }
  ])

  // Calculate statistics from enrollments
  useEffect(() => {
    if (!enrollments || enrollments.length === 0) return;

    const totalLessons = enrollments.reduce(
      (sum, e) => sum + (e.progress?.completedLessons?.length || 0),
      0
    );
    
    const totalTime = enrollments.reduce(
      (sum, e) => sum + (e.progress?.totalTimeSpent || 0),
      0
    );

    const hours = Math.floor(totalTime / 3600);
    const minutes = Math.floor((totalTime % 3600) / 60);
    const timeString = hours > 0 
      ? `${hours} soat ${minutes} daqiqa`
      : `${minutes} daqiqa`;

    // Find the most recent lastAccessedAt date from all enrollments
    let mostRecentActivityDate: Date | null = null;
    enrollments.forEach(enrollment => {
      if (enrollment.lastAccessedAt) {
        try {
          let currentDate: Date;
          
          if (isFirestoreTimestamp(enrollment.lastAccessedAt)) {
            currentDate = convertTimestamp(enrollment.lastAccessedAt);
          } else if (enrollment.lastAccessedAt instanceof Timestamp) {
            currentDate = enrollment.lastAccessedAt.toDate();
          } else if (typeof enrollment.lastAccessedAt === 'string') {
            currentDate = new Date(enrollment.lastAccessedAt);
            if (isNaN(currentDate.getTime())) {
              console.warn('Invalid date string in enrollment:', enrollment.lastAccessedAt);
              return;
            }
          } else {
            console.warn('Unsupported date format in enrollment:', enrollment.lastAccessedAt);
            return;
          }
          
          if (!mostRecentActivityDate || currentDate > mostRecentActivityDate) {
            mostRecentActivityDate = currentDate;
          }
        } catch (error) {
          console.error('Error processing date:', error, 'Enrollment:', enrollment.id);
        }
      }
    });

    setStats([
      { label: "Tugallangan darslar", value: totalLessons, icon: BookOpen },
      { label: "O'qish vaqti", value: timeString, icon: Clock },
      { label: "Kurslar", value: enrollments.length, icon: BookOpen },
      { label: "Oxirgi faollik", value: formatDate(mostRecentActivityDate), icon: Calendar }
    ]);
  }, [enrollments]);

  const [courseProgress, setCourseProgress] = useState<Array<{
    id: string;
    title: string;
    totalLessons: number;
    completedLessons: number;
    progress: number;
    lastActivity: string;
  }>>([])

  useEffect(() => {
    if (!enrollments || enrollments.length === 0) {
      setCourseProgress([])
      return
    }

    const fetchCourseData = async () => {
      const coursesData = await Promise.all(
        enrollments.map(async (enrollment) => {
          try {
            const response = await fetch(`/api/courses/${enrollment.courseId}`)
            if (!response.ok) {
              console.error(`Failed to fetch course ${enrollment.courseId}: ${response.status}`);
              return null;
            }
            const result = await response.json();
            const course = result.data;

            const totalLessons = course?.lessons?.length || 1
            const completedLessonsCount = Array.isArray(enrollment.progress?.completedLessons) 
                                          ? enrollment.progress.completedLessons.length 
                                          : 0;
            const progress = Math.round((completedLessonsCount / totalLessons) * 100);
            
            // Validate lastAccessedAt before formatting
            let lastActivity: string;
            try {
              if (isFirestoreTimestamp(enrollment.lastAccessedAt)) {
                const date = convertTimestamp(enrollment.lastAccessedAt);
                lastActivity = format(date, 'dd.MM.yyyy');
              } else {
                lastActivity = formatDate(enrollment.lastAccessedAt);
              }
            } catch (error) {
              console.error('Error formatting lastAccessedAt:', error, 'Enrollment:', enrollment.id);
              lastActivity = 'Faol emas';
            }
            
            return {
              id: enrollment.courseId,
              title: course?.title || enrollment.courseId,
              totalLessons,
              completedLessons: completedLessonsCount,
              progress,
              lastActivity
            }
          } catch (error) {
            console.error('Error fetching or processing course data:', error, 'Enrollment:', enrollment.id)
            return null
          }
        })
      )
      
      setCourseProgress(coursesData.filter(Boolean) as any)
    }

    fetchCourseData()
  }, [enrollments])

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col">
        <div className="flex-1 container px-4 py-8 pb-20">
          <div className="animate-pulse space-y-8">
            <div className="h-8 w-64 bg-muted rounded"></div>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
            <div className="h-48 bg-muted rounded-lg"></div>
          </div>
        </div>
        <MobileNavigation /> 
      </main>
    )
  }
  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 container px-4 py-8 pb-20">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">O&apos;quv jarayoni</h1>
          <p className="text-muted-foreground">O&apos;rganish yutuqlaringizni kuzating</p>
        </header>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Umumiy statistika</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          {courseProgress.length > 0 ? (
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
                    <Progress value={course.progress} className="h-2 mb-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{course.progress}% tugallangan</span>
                      <span>Oxirgi faollik: {course.lastActivity}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Siz hali hech qanday kursga yozilmagansiz yoki kurslarda progress yo&apos;q.
              </CardContent>
            </Card>
          )}
        </section>
      </div>
      <MobileNavigation />
    </main>
  )
}
