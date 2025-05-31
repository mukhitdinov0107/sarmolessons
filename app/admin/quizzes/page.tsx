"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Check, AlertCircle, FileCheck, BookCheck } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { getAllCourses, addQuizzesToCourse, addQuizzesToAllCourses } from '@/utils/aiQuizGenerator';

export default function QuizzesAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [courseLoading, setCourseLoading] = useState<Record<string, boolean>>({});
  const [allCoursesLoading, setAllCoursesLoading] = useState<boolean>(false);
  const [results, setResults] = useState<Record<string, { success: boolean; message: string }>>({});

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const coursesList = await getAllCourses();
        setCourses(coursesList);
      } catch (error) {
        console.error("Error loading courses:", error);
        toast.error("Kurslarni yuklashda xatolik yuz berdi");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      loadCourses();
    }
  }, [user, authLoading]);

  const handleAddQuizzesToCourse = async (courseId: string, courseTitle: string) => {
    setCourseLoading(prev => ({ ...prev, [courseId]: true }));
    setResults(prev => ({ ...prev, [courseId]: { success: false, message: "Jarayon boshlandi..." } }));
    
    try {
      const success = await addQuizzesToCourse(courseId);
      
      if (success) {
        setResults(prev => ({ 
          ...prev, 
          [courseId]: { 
            success: true, 
            message: "Testlar muvaffaqiyatli qo'shildi" 
          } 
        }));
        toast.success(`"${courseTitle}" kursiga testlar muvaffaqiyatli qo'shildi`);
      } else {
        setResults(prev => ({ 
          ...prev, 
          [courseId]: { 
            success: false, 
            message: "Testlarni qo'shishda xatolik yuz berdi" 
          } 
        }));
        toast.error(`"${courseTitle}" kursiga testlarni qo'shishda xatolik yuz berdi`);
      }
    } catch (error) {
      console.error("Error adding quizzes:", error);
      setResults(prev => ({ 
        ...prev, 
        [courseId]: { 
          success: false, 
          message: "Xatolik: " + (error instanceof Error ? error.message : String(error))
        } 
      }));
      toast.error("Testlarni qo'shishda xatolik yuz berdi");
    } finally {
      setCourseLoading(prev => ({ ...prev, [courseId]: false }));
    }
  };

  const handleAddQuizzesToAllCourses = async () => {
    setAllCoursesLoading(true);
    
    try {
      const result = await addQuizzesToAllCourses();
      
      if (result.success) {
        toast.success(`${result.coursesUpdated} ta kursga testlar muvaffaqiyatli qo'shildi`);
      } else {
        toast.error("Barcha kurslarga testlarni qo'shishda xatolik yuz berdi");
      }
    } catch (error) {
      console.error("Error adding quizzes to all courses:", error);
      toast.error("Barcha kurslarga testlarni qo'shishda xatolik yuz berdi");
    } finally {
      setAllCoursesLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <h1 className="text-xl font-semibold">Ruxsat yo'q</h1>
        <p className="text-muted-foreground">Bu sahifani ko'rish uchun tizimga kirishingiz kerak</p>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Testlarni boshqarish</h1>
        <p className="text-muted-foreground mt-2">
          Kurslarga Sun'iy Intellekt mavzusidagi testlarni qo'shish va boshqarish
        </p>
      </div>

      <Tabs defaultValue="courses">
        <TabsList className="mb-6">
          <TabsTrigger value="courses">Kurslar bo'yicha</TabsTrigger>
          <TabsTrigger value="bulk">Ommaviy qo'shish</TabsTrigger>
        </TabsList>
        
        <TabsContent value="courses">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 w-3/4 bg-muted rounded"></div>
                    <div className="h-4 w-1/2 bg-muted rounded mt-2"></div>
                  </CardHeader>
                  <CardFooter>
                    <div className="h-10 w-full bg-muted rounded"></div>
                  </CardFooter>
                </Card>
              ))
            ) : courses.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-center">Kurslar topilmadi</p>
              </div>
            ) : (
              courses.map((course) => (
                <Card key={course.id}>
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                    <CardDescription>
                      {results[course.id]?.success ? (
                        <span className="flex items-center text-green-600">
                          <Check className="h-4 w-4 mr-1" /> 
                          {results[course.id].message}
                        </span>
                      ) : results[course.id]?.message ? (
                        <span className="text-amber-600">
                          {results[course.id].message}
                        </span>
                      ) : (
                        "Darslar uchun testlar qo'shish"
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => handleAddQuizzesToCourse(course.id, course.title)}
                      disabled={courseLoading[course.id]}
                    >
                      {courseLoading[course.id] ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Jarayon ketmoqda...
                        </>
                      ) : results[course.id]?.success ? (
                        <>
                          <FileCheck className="h-4 w-4 mr-2" />
                          Testlarni yangilash
                        </>
                      ) : (
                        <>
                          <BookCheck className="h-4 w-4 mr-2" />
                          Testlar qo'shish
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Barcha kurslarga testlar qo'shish</CardTitle>
              <CardDescription>
                Bu amal barcha kurslardagi darslar uchun avtomatik ravishda AI testlarini yaratadi va qo'shadi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-amber-600 mb-4">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                Diqqat: Bu jarayon bir necha daqiqa vaqt olishi mumkin va serverni katta yuklanishga olib kelishi mumkin.
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleAddQuizzesToAllCourses}
                disabled={allCoursesLoading}
                className="w-full"
              >
                {allCoursesLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Jarayon ketmoqda...
                  </>
                ) : (
                  <>
                    <BookCheck className="h-4 w-4 mr-2" />
                    Barcha kurslarga testlar qo'shish
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
