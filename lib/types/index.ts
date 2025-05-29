import { Timestamp } from "firebase/firestore";

// User related types
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  telegramUsername?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  preferences: UserPreferences;
  stats: UserStats;
}

export interface UserPreferences {
  language: 'uz' | 'ru' | 'en';
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  telegram: boolean;
  achievements: boolean;
  courseUpdates: boolean;
}

export interface UserStats {
  totalLearningTime: number; // in minutes
  completedCourses: number;
  completedLessons: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Timestamp;
}

// Course related types
export interface Course {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  instructor: string;
  instructorBio?: string;
  instructorImageUrl?: string;
  level: CourseLevel;
  category: CourseCategory;
  duration: string; // e.g., "6 soat"
  price: number; // 0 for free courses
  currency?: string;
  language?: string;
  imageUrl: string;
  videoPreviewUrl?: string;
  tags: string[];
  isPublished: boolean;
  isFeatured: boolean;
  enrollmentCount: number;
  rating: number;
  reviewCount?: number;
  certificateAvailable?: boolean;
  estimatedHours?: number;
  prerequisites: string[];
  learningOutcomes: string[];
  lessons?: Lesson[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CourseLevel = 'Boshlang\'ich' | 'O\'rta' | 'Yuqori';
export type CourseCategory = 'AI Asoslari' | 'Machine Learning' | 'Deep Learning' | 'NLP' | 'Computer Vision' | 'Boshqa';

export interface Instructor {
  id: string;
  name: string;
  title: string;
  bio: string;
  photoURL?: string;
  expertise: string[];
  yearsOfExperience: number;
}

// Lesson related types
export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  content: string;
  videoUrl?: string;
  duration: string; // e.g., "30 daqiqa"
  order: number;
  isPublished: boolean;
  isFree: boolean;
  attachments: Attachment[];
  links: LessonLink[];
  quiz?: Quiz;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'excel' | 'code' | 'video' | 'document';
  url: string;
  size: string;
  description: string;
}

export interface LessonLink {
  id: string;
  title: string;
  url: string;
  description: string;
  type: 'external' | 'internal';
}

export interface LessonResource {
  id: string;
  title: string;
  type: 'pdf' | 'link' | 'code' | 'image';
  url: string;
  description?: string;
}

// Quiz related types
export interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  questions: Question[];
  passingScore: number; // percentage
  timeLimit?: number; // in minutes
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'text';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation?: string;
  points: number;
}

// Progress and Enrollment types
export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Timestamp;
  completedAt?: Timestamp;
  lastAccessedAt: Timestamp;
  status: 'active' | 'completed' | 'paused';
  progress: CourseProgress;
  updatedAt?: Timestamp;
}

export interface CourseProgress {
  completedLessons: LessonProgress[];
  currentLessonId: string | null;
  progressPercentage: number;
  totalTimeSpent: number; // in minutes
  lastAccessedAt: Timestamp;
}

export interface LessonProgress {
  lessonId: string;
  completedAt: Timestamp;
  timeSpent: number; // in minutes
  watchPercentage: number;
  quizScore?: number; // Highest score achieved
  attempts: number; // Total number of attempts
  quizAttempts?: QuizAttempt[]; // Detailed list of all attempts
}

// Achievement types
export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconUrl: string;
  type: AchievementType;
  criteria: AchievementCriteria;
  points: number;
  isActive: boolean;
  createdAt: Timestamp;
}

export type AchievementType = 'course_completion' | 'lesson_completion' | 'streak' | 'time_spent' | 'quiz_score' | 'special';

export interface AchievementCriteria {
  type: AchievementType;
  target: number;
  courseId?: string;
  lessonId?: string;
  quizId?: string; // For quiz-specific achievements
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  title?: string;
  description?: string;
  unlockedAt: Timestamp;
  isNew: boolean;
  isRead?: boolean;
}

export interface UserAnswer {
  questionId: string;
  answer: string | number | string[]; // User's answer
  isCorrect: boolean;
}

export interface QuizAttempt {
  id: string;
  attemptNumber: number;
  answers: UserAnswer[];
  score: number; // Score for this attempt (percentage or points)
  passed: boolean; // Whether this attempt passed the quiz
  submittedAt: Timestamp;
  timeTaken?: number; // in seconds
}

// Analytics types
export interface LearningSession {
  id: string;
  userId: string;
  courseId: string;
  lessonId?: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  duration: number; // in minutes
  device: string;
  ipAddress: string;
}

export interface WeeklyActivity {
  id?: string;
  userId: string;
  weekStart: Timestamp;
  dailyMinutes: number[]; // Array of 7 numbers for each day
  totalMinutes: number;
  lessonsCompleted: number;
  courses: string[];
  date?: Timestamp; // For sorting purposes
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Search and Filter types
export interface CourseFilters {
  level?: CourseLevel[];
  category?: CourseCategory[];
  duration?: [number, number]; // min, max in minutes
  rating?: number; // minimum rating
  price?: 'free' | 'paid' | 'all';
  search?: string;
}

export interface SortOptions {
  field: 'title' | 'rating' | 'enrollmentCount' | 'createdAt' | 'duration';
  direction: 'asc' | 'desc';
} 