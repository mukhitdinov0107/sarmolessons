import { useState, useEffect } from 'react';
import { Quiz, UserAnswer, QuizAttempt, ApiResponse, QuizQuestion } from '@/lib/types';
import { ProgressService } from '@/lib/services/progress';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from './useAuth';

interface UseQuizProps {
  courseId: string;
  lessonId: string;
  quiz: Quiz;
  onQuizComplete?: (passed: boolean) => void;
}

interface UseQuizReturn {
  currentQuestion: number;
  selectedAnswers: Record<string, string | number | string[]>;
  timeRemaining: number | null;
  isSubmitting: boolean;
  attempts: QuizAttempt[];
  bestScore: number;
  loading: boolean;
  error: string | null;
  handleAnswerSelect: (questionId: string, answer: string | number | string[]) => void;
  handleNextQuestion: () => void;
  handlePreviousQuestion: () => void;
  handleSubmitQuiz: () => Promise<void>;
  resetQuiz: () => void;
}

export function useQuiz({ courseId, lessonId, quiz, onQuizComplete }: UseQuizProps): UseQuizReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | number | string[]>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    quiz.timeLimit ? quiz.timeLimit * 60 : null
  );
  const [startTime] = useState<number>(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [bestScore, setBestScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load previous attempts and best score
  useEffect(() => {
    const loadQuizData = async () => {
      try {
        if (!user) return;

        const [attemptsResponse, scoreResponse] = await Promise.all([
          ProgressService.getQuizAttempts(user.uid, courseId, lessonId),
          ProgressService.getBestQuizScore(user.uid, courseId, lessonId)
        ]);

        if (attemptsResponse.success && attemptsResponse.data) {
          setAttempts(attemptsResponse.data);
        }

        if (scoreResponse.success && scoreResponse.data !== undefined) {
          setBestScore(scoreResponse.data);
        }
      } catch (err) {
        console.error('Error loading quiz data:', err);
        setError('Test ma\'lumotlarini yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    loadQuizData();
  }, [user, courseId, lessonId]);

  // Timer countdown
  useEffect(() => {
    if (!timeRemaining) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (!prev || prev <= 0) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const handleAnswerSelect = (questionId: string, answer: string | number | string[]) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    try {
      if (!user) {
        toast({
          title: "Xatolik",
          description: "Test topshirish uchun tizimga kirishingiz kerak",
          variant: "destructive"
        });
        return;
      }

      setIsSubmitting(true);

      // Format answers for submission
      const answers: UserAnswer[] = quiz.questions.map(question => {
        // Convert number answers to strings to match UserAnswer type
        const answer = selectedAnswers[question.id] || '';
        return {
          questionId: question.id,
          answer: typeof answer === 'number' ? String(answer) : answer,
          isCorrect: false // Will be calculated server-side
        };
      });

      const timeTaken = Math.round((Date.now() - startTime) / 1000);

      const response = await ProgressService.submitQuizAttempt(
        user.uid,
        courseId,
        lessonId,
        answers,
        timeTaken
      );

      if (response.success && response.data) {
        setAttempts(prev => [...prev, response.data]);
        setBestScore(Math.max(bestScore, response.data.score));
        
        toast({
          title: response.data.passed ? "Tabriklaymiz!" : "Test natijasi",
          description: response.message,
          variant: response.data.passed ? "default" : "destructive"
        });

        // Call the onQuizComplete callback if provided
        if (onQuizComplete && response.data.passed) {
          onQuizComplete(response.data.passed);
        }

        resetQuiz();
      } else {
        throw new Error(response.error || 'Testni topshirishda xatolik yuz berdi');
      }
    } catch (err: any) {
      console.error('Error submitting quiz:', err);
      toast({
        title: "Xatolik",
        description: err.message || 'Testni topshirishda xatolik yuz berdi',
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setTimeRemaining(quiz.timeLimit ? quiz.timeLimit * 60 : null);
  };

  return {
    currentQuestion,
    selectedAnswers,
    timeRemaining,
    isSubmitting,
    attempts,
    bestScore,
    loading,
    error,
    handleAnswerSelect,
    handleNextQuestion,
    handlePreviousQuestion,
    handleSubmitQuiz,
    resetQuiz
  };
} 