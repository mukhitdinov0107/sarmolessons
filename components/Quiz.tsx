import type { Quiz as QuizType, QuizQuestion } from '@/lib/types';
import { useQuiz } from '@/hooks/useQuiz';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Clock, Trophy } from 'lucide-react';

interface QuizProps {
  courseId: string;
  lessonId: string;
  quiz: QuizType;
  className?: string;
  onQuizComplete?: (passed: boolean) => void;
}

export function Quiz({ courseId, lessonId, quiz, className, onQuizComplete }: QuizProps) {
  const {
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
    resetQuiz,
  } = useQuiz({
    courseId,
    lessonId,
    quiz,
    onQuizComplete: (passed) => {
      if (onQuizComplete) {
        onQuizComplete(passed);
      }
    }
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-32" />
        <div className="flex justify-between">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            <p>{error}</p>
            <Button onClick={resetQuiz} className="mt-4">
              Qayta urinish
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuestionData = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
  const hasNextQuestion = currentQuestion < quiz.questions.length - 1;
  const hasPreviousQuestion = currentQuestion > 0;
  const isLastQuestion = currentQuestion === quiz.questions.length - 1;
  const currentAnswer = selectedAnswers[currentQuestionData.id];
  const isAnswered = currentAnswer !== undefined && currentAnswer !== '';

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderQuestion = (question: QuizQuestion) => {
    switch (question.type) {
      case 'single-choice':
      case 'multiple-choice':
        return (
          <RadioGroup
            value={selectedAnswers[question.id]?.toString()}
            onValueChange={(value) => handleAnswerSelect(question.id, value)}
          >
            <div className="space-y-3">
              {question.options?.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`}>{option}</Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        );

      case 'true-false':
        return (
          <RadioGroup
            value={selectedAnswers[question.id]?.toString()}
            onValueChange={(value) => handleAnswerSelect(question.id, value)}
          >
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="true" />
                <Label htmlFor="true">To'g'ri</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="false" />
                <Label htmlFor="false">Noto'g'ri</Label>
              </div>
            </div>
          </RadioGroup>
        );

      case 'short-answer':
        return (
          <Input
            value={selectedAnswers[question.id]?.toString() || ''}
            onChange={(e) => handleAnswerSelect(question.id, e.target.value)}
            placeholder="Javobingizni kiriting..."
          />
        );

      default:
        return null;
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">{quiz.title}</CardTitle>
          {timeRemaining !== null && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Savol {currentQuestion + 1} / {quiz.questions.length}</span>
          <div className="flex items-center space-x-2">
            <Trophy className="h-4 w-4" />
            <span>Eng yaxshi natija: {bestScore}%</span>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-4">
          <p className="font-medium">{currentQuestionData.questionText}</p>
          {renderQuestion(currentQuestionData)}
        </div>

        {attempts.length > 0 && (
          <div className="mt-6 space-y-2">
            <h4 className="font-medium">Oldingi urinishlar:</h4>
            <div className="space-y-2">
              {attempts.slice(-3).map((attempt, index) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between text-sm text-muted-foreground"
                >
                  <span>Urinish #{attempt.attemptNumber}</span>
                  <span className={cn(
                    "font-medium",
                    attempt.passed ? "text-green-600" : "text-red-600"
                  )}>
                    {attempt.score}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePreviousQuestion}
          disabled={!hasPreviousQuestion || isSubmitting}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Oldingi
        </Button>

        {isLastQuestion ? (
          <Button
            onClick={handleSubmitQuiz}
            disabled={!isAnswered || isSubmitting}
          >
            {isSubmitting ? "Tekshirilmoqda..." : "Testni tugatish"}
          </Button>
        ) : (
          <Button
            onClick={handleNextQuestion}
            disabled={!isAnswered || !hasNextQuestion || isSubmitting}
          >
            Keyingi
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 