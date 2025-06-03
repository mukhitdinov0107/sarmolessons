"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { LessonForm } from "../components/lesson-form";
import { CourseService } from "@/lib/services/courses";
import { Lesson } from "@/lib/types";

export default function EditLessonPage() {
  const { id } = useParams();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLesson = async () => {
      try {
        const lessonDoc = await CourseService.getLessonById(id as string);
        setLesson(lessonDoc);
      } catch (error) {
        console.error("Error loading lesson:", error);
      } finally {
        setLoading(false);
      }
    };

    loadLesson();
  }, [id]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-64 bg-muted rounded"></div>
        <div className="h-96 bg-muted rounded-lg"></div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-destructive">Dars topilmadi</h1>
        <p className="text-muted-foreground">
          Ushbu identifikatorga ega dars mavjud emas
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Darsni tahrirlash</h1>
        <p className="text-muted-foreground">
          {lesson.title} darsini tahrirlash
        </p>
      </div>
      <LessonForm initialData={lesson} />
    </div>
  );
} 