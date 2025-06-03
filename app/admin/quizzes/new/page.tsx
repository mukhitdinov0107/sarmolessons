"use client";

import { useSearchParams } from "next/navigation";
import { QuizForm } from "../components/quiz-form";

export default function NewQuizPage() {
  const searchParams = useSearchParams();
  const lessonId = searchParams.get("lessonId");

  if (!lessonId) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-destructive">Xatolik yuz berdi</h1>
        <p className="text-muted-foreground">
          Dars identifikatori ko'rsatilmagan
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Yangi test</h1>
        <p className="text-muted-foreground">
          Yangi test yaratish uchun quyidagi formani to'ldiring
        </p>
      </div>
      <QuizForm lessonId={lessonId} />
    </div>
  );
} 