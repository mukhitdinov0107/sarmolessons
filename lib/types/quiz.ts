// Quiz related types
export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'text';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
}

export interface UserAnswer {
  questionId: string;
  answer: string | string[];
  isCorrect: boolean;
}

export interface QuizAttempt {
  id: string;
  attemptNumber: number;
  answers: UserAnswer[];
  score: number;
  passed: boolean;
  submittedAt: any; // Timestamp
  timeTaken?: number;
}

export interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit?: number;
}
