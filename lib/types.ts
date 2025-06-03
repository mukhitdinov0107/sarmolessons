import { Timestamp } from "firebase/firestore";

export interface UserStats {
  totalLearningTime: number;
  completedLessons: number;
  lastUpdated?: Timestamp;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  telegramUsername?: string;
  stats?: UserStats;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  instructor?: string;
  instructorBio?: string;
  instructorImageUrl?: string;
  level: string;
  category: string;
  duration: string;
  price: number;
  currency: string;
  language: string;
  imageUrl?: string;
  videoPreviewUrl?: string;
  tags?: string[];
  isPublished: boolean;
  isFeatured: boolean;
  enrollmentCount: number;
  rating?: number;
  reviewCount?: number;
  certificateAvailable?: boolean;
  estimatedHours?: number;
  prerequisites?: string[];
  learningOutcomes?: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  order: number;
  isPublished: boolean;
  isFree: boolean;
  videoUrl?: string;
  content?: string;
  attachments?: Attachment[];
  links?: Link[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  quiz?: Quiz;
}

export interface LessonProgress {
  lessonId: string;
  completedAt?: Timestamp;
  timeSpent: number;
  watchPercentage: number;
  attempts: number;
  quizScore?: number;
  quizAttempts?: QuizAttempt[];
}

export interface CourseProgress {
  completedLessons: LessonProgress[];
  currentLessonId: string | null;
  progressPercentage: number;
  totalTimeSpent: number;
  lastAccessedAt: Timestamp;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Timestamp;
  lastAccessedAt: Timestamp;
  status: 'active' | 'completed' | 'cancelled';
  progress: CourseProgress;
  updatedAt: Timestamp;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  title: string;
  description: string;
  iconUrl?: string;
  points?: number;
  unlockedAt?: Timestamp;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: string;
  description?: string;
}

export interface Link {
  id: string;
  title: string;
  url: string;
  description?: string;
  type: 'external' | 'internal';
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  points?: number;
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  passingScore: number;
  timeLimit?: number;
}

export interface UserAnswer {
  questionId: string;
  answer: number | number[];
  isCorrect?: boolean;
}

export interface QuizAttempt {
  id: string;
  answers: UserAnswer[];
  score: number;
  passed: boolean;
  submittedAt: Timestamp;
  timeTaken: number;
} 