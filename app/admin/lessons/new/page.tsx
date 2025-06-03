"use client";

import { useSearchParams } from "next/navigation";
import { LessonForm } from "../components/lesson-form";

export default function NewLessonPage() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");

  if (!courseId) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-destructive">Xatolik yuz berdi</h1>
        <p className="text-muted-foreground">
          Kurs identifikatori ko'rsatilmagan
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Yangi dars</h1>
        <p className="text-muted-foreground">
          Yangi dars yaratish uchun quyidagi formani to'ldiring
        </p>
      </div>
      <LessonForm courseId={courseId} />
    </div>
  );
} 