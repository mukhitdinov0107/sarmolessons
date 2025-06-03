"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CourseForm } from "../components/course-form";
import { CourseService } from "@/lib/services/courses";
import { Course } from "@/lib/types";

export default function EditCoursePage() {
  const { id } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourse = async () => {
      try {
        const courseData = await CourseService.getCourseById(id as string);
        setCourse(courseData);
      } catch (error) {
        console.error("Error loading course:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [id]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-64 bg-muted rounded"></div>
        <div className="h-96 bg-muted rounded-lg"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-destructive">Kurs topilmadi</h1>
        <p className="text-muted-foreground">
          Ushbu identifikatorga ega kurs mavjud emas
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kursni tahrirlash</h1>
        <p className="text-muted-foreground">
          {course.title} kursini tahrirlash
        </p>
      </div>
      <CourseForm initialData={course} />
    </div>
  );
} 