"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseService } from '@/lib/services/courses';
import { ProgressService } from '@/lib/services/progress';
import { Course, User, Enrollment, LessonProgress } from '@/lib/types';

function StudentsContent() {
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>(searchParams.get('courseId') || '');
  const [activeStudents, setActiveStudents] = useState<User[]>([]);
  const [studentProgress, setStudentProgress] = useState<Record<string, Enrollment>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await CourseService.getAllCourses();
        if (response.success && response.data) {
          setCourses(response.data);
          if (!selectedCourse && response.data.length > 0) {
            setSelectedCourse(response.data[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Kurslarni yuklashda xatolik yuz berdi');
      }
    };

    fetchCourses();
  }, []);

  // Fetch active students when course is selected
  useEffect(() => {
    const fetchActiveStudents = async () => {
      if (!selectedCourse) return;

      setLoading(true);
      try {
        const response = await ProgressService.getActiveStudents(selectedCourse);
        if (response.success && response.data) {
          setActiveStudents(response.data);
          
          // Fetch progress for each student
          const progressData: Record<string, Enrollment> = {};
          await Promise.all(
            response.data.map(async (student) => {
              const enrollment = await ProgressService.getUserEnrollment(student.uid, selectedCourse);
              if (enrollment) {
                progressData[student.uid] = enrollment;
              }
            })
          );
          setStudentProgress(progressData);
        }
      } catch (err) {
        console.error('Error fetching active students:', err);
        setError('Faol o\'quvchilarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    fetchActiveStudents();
  }, [selectedCourse]);

  const calculateStudentStats = (userId: string) => {
    const enrollment = studentProgress[userId];
    if (!enrollment) return { totalAttempts: 0, averageScore: 0, passedQuizzes: 0 };

    const quizAttempts = enrollment.progress.completedLessons.flatMap(
      lesson => lesson.quizAttempts || []
    );

    const totalAttempts = quizAttempts.length;
    const averageScore = totalAttempts > 0
      ? quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalAttempts
      : 0;
    const passedQuizzes = quizAttempts.filter(attempt => attempt.passed).length;

    return {
      totalAttempts,
      averageScore: Math.round(averageScore),
      passedQuizzes
    };
  };

  if (error) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Faol o&apos;quvchilar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Select
              value={selectedCourse}
              onValueChange={setSelectedCourse}
              disabled={loading}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Kursni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : activeStudents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>O&apos;quvchi</TableHead>
                  <TableHead>Telegram</TableHead>
                  <TableHead className="text-right">Jami urinishlar</TableHead>
                  <TableHead className="text-right">O&apos;rtacha ball</TableHead>
                  <TableHead className="text-right">Topshirilgan testlar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeStudents.map((student) => {
                  const stats = calculateStudentStats(student.uid);
                  return (
                    <TableRow key={student.uid}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {student.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{student.telegramUsername || '-'}</TableCell>
                      <TableCell className="text-right">{stats.totalAttempts}</TableCell>
                      <TableCell className="text-right">{stats.averageScore}%</TableCell>
                      <TableCell className="text-right">{stats.passedQuizzes}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Bu kursda hali faol o&apos;quvchilar yo&apos;q
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function StudentsPage() {
  return (
    <Suspense fallback={
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <StudentsContent />
    </Suspense>
  );
} 