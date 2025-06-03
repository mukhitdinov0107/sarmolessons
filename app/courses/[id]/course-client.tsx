'use client';

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { MobileNavigation } from '@/components/mobile-navigation';
import { ArrowLeft, BookOpen, Check, Clock, Loader2, User } from 'lucide-react';
import { Course, Lesson, LessonProgress } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { useEnrollments } from '@/hooks/useProgress';
import { Progress } from '@/components/ui/progress';

interface CourseClientProps {
  course: Course | null;
  lessons: Lesson[];
  courseId: string;
}

export function CourseClient({ course, lessons: initialLessons, courseId }: CourseClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { enrollments, loading: enrollmentsLoading, enrollInCourse, isEnrolled, refetch } = useEnrollments();
  
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons || []);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);

  // Add refresh mechanism to update progress when returning from lesson
  const refreshProgress = useCallback(async () => {
    if (!user || !courseId) return;
    
    try {
      // Force refresh enrollments to get latest progress
      await refetch();
    } catch (error) {
      console.error('Error refreshing progress:', error);
    }
  }, [user, courseId, refetch]);

  // Listen for focus events to refresh progress when user returns to course page
  useEffect(() => {
    const handleFocus = () => {
      refreshProgress();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshProgress]);

  // Also refresh when navigating back to this page
  useEffect(() => {
    refreshProgress();
  }, [refreshProgress]);

  useEffect(() => {
    if (!courseId || !user) return;
    
    const enrollmentStatus = isEnrolled(courseId);
    const enrollment = enrollments.find(e => e.courseId === courseId);
    
    // Only update state if something actually changed
    setEnrolled(prevEnrolled => {
      if (prevEnrolled !== enrollmentStatus) {
        return enrollmentStatus;
      }
      return prevEnrolled;
    });

    if (enrollmentStatus && enrollment?.progress?.completedLessons) {
      const completedLessonIds = enrollment.progress.completedLessons.map(lesson => 
        typeof lesson === 'string' ? lesson : lesson.lessonId
      );
      
      // Only update if the set of completed lessons has changed
      setCompletedLessons(prev => {
        const newSet = new Set(completedLessonIds);
        if (prev.size !== newSet.size || completedLessonIds.some(id => !prev.has(id))) {
          return newSet;
        }
        return prev;
      });
      
      // Only update progress if the value has changed
      const newProgress = Math.round((completedLessonIds.length / (lessons.length || 1)) * 100);
      setProgress(prev => prev !== newProgress ? newProgress : prev);
    } else if (enrollmentStatus) {
      // If enrolled but no completed lessons, set progress to 0
      setProgress(0);
    }
  }, [courseId, user, enrollments, isEnrolled, lessons.length]);

  const handleEnroll = async () => {
    console.log('Enroll button clicked');
    
    if (!user) {
      console.log('No user, redirecting to login');
      router.push(`/login?redirect=/courses/${courseId}`);
      return;
    }

    console.log('Starting enrollment process');
    setEnrolling(true);
    try {
      console.log('Calling enrollInCourse with courseId:', courseId);
      const result = await enrollInCourse(courseId);
      console.log('Enrollment result:', result);
      
      if (result.success) {
        setEnrolled(true);
        console.log('Enrollment successful, refreshing data');
        // Force refresh enrollments to update UI
        await refetch();
      } else {
        console.log('Enrollment failed:', result.error);
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast.error('Kursga yozilishda xatolik yuz berdi');
    } finally {
      setEnrolling(false);
      console.log('Enrollment process completed');
    }
  };

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Yuklanmoqda...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <div className="container px-4 py-8 mx-auto">
          <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2">
            <Link href="/courses" className="flex items-center text-foreground/80 hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Barcha kurslar
            </Link>
          </Button>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-card rounded-xl p-6 shadow-sm border">
                <h1 className="text-2xl md:text-3xl font-bold mb-3 text-foreground">{course.title}</h1>
                <p className="text-muted-foreground mb-6 leading-relaxed">{course.description}</p>
                
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <div className="flex items-center text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                    <BookOpen className="h-4 w-4 mr-1.5" />
                    {lessons.length} dars
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                    <Clock className="h-4 w-4 mr-1.5" />
                    {course.duration}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                    <User className="h-4 w-4 mr-1.5" />
                    {course.instructor || 'SarmoTraining'}
                  </div>
                </div>

                {enrolled ? (
                  <div className="space-y-2 max-w-md">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Progressingiz:</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-muted" />
                  </div>
                ) : (
                  <a 
                    href="#"
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 text-base cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      console.log('Anchor clicked');
                      if (!enrolling && !enrollmentsLoading) {
                        handleEnroll();
                      }
                    }}
                    style={{ pointerEvents: 'auto' }}
                  >
                    {enrolling ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Yozilmoqda...
                      </>
                    ) : 'Kursga yozilish'}
                  </a>
                )}
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl overflow-hidden shadow-sm border sticky top-6">
                <div className="aspect-video bg-muted/50 relative">
                  <img 
                    src={course.imageUrl || '/placeholder-course.jpg'} 
                    alt={course.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-course.jpg';
                    }}
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Kurs haqida</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Darajasi:</span>
                      <span className="font-medium">{course.level}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Davomiyligi:</span>
                      <span className="font-medium">{course.duration}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Darslar soni:</span>
                      <span className="font-medium">{lessons.length} ta</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">O'qituvchi:</span>
                      <span className="font-medium">{course.instructor || 'SarmoTraining'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lessons Section */}
      <div className="container px-4 py-12 mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-xl p-6 shadow-sm border">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Darslar ro'yxati</h2>
            <div className="space-y-3">
              {lessons.length > 0 ? (
                lessons.map((lesson, index) => (
                  <Card key={lesson.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      <Link 
                        href={`/courses/${courseId}/lessons/${lesson.id}`}
                        className="block p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-sm mr-4 flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-foreground truncate">{lesson.title}</h3>
                              {completedLessons.has(lesson.id) && (
                                <span className="inline-flex items-center text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                  <Check className="h-3 w-3 mr-1" />
                                  Tugatilgan
                                </span>
                              )}
                            </div>
                            <div className="flex items-center mt-1 text-sm text-muted-foreground">
                              <Clock className="h-3.5 w-3.5 mr-1.5" />
                              <span>{lesson.duration}</span>
                              <span className="mx-2">•</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${
                                lesson.isFree ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {lesson.isFree ? 'Bepul' : 'Premium'}
                              </span>
                            </div>
                          </div>
                          <div className="text-muted-foreground ml-4">
                            <ArrowLeft className="h-4 w-4 transform rotate-180" />
                          </div>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Hozircha darslar mavjud emas
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <MobileNavigation />
    </div>
  );
}
