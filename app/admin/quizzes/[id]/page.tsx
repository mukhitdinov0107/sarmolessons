"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { QuizForm } from "../components/quiz-form";
import { CourseService } from "@/lib/services/courses";
import { Quiz } from "@/lib/types";

export default function EditQuizPage() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const quizDoc = await CourseService.getQuizById(id as string);
        setQuiz(quizDoc);
      } catch (error) {
        console.error("Error loading quiz:", error);
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [id]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-64 bg-muted rounded"></div>
        <div className="h-96 bg-muted rounded-lg"></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-destructive">Test topilmadi</h1>
        <p className="text-muted-foreground">
          Ushbu identifikatorga ega test mavjud emas
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Testni tahrirlash</h1>
        <p className="text-muted-foreground">
          {quiz.title} testini tahrirlash
        </p>
      </div>
      <QuizForm initialData={quiz} />
    </div>
  );
} 