"use client";

import { useState, useEffect } from 'react';
import { Enrollment, CourseProgress, LessonProgress, UserAchievement, WeeklyActivity } from '@/lib/types';
import { ProgressService } from '@/lib/services/progress';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useEnrollments() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEnrollments = async () => {
    if (!user) {
      setEnrollments([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userEnrollments = await ProgressService.getUserEnrollments(user.uid);
      setEnrollments(userEnrollments);
    } catch (err) {
      console.error('Error loading enrollments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  const enrollInCourse = async (courseId: string) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const result = await ProgressService.enrollInCourse(user.uid, courseId);
      
      if (result.success) {
        // Refresh enrollments
        await loadEnrollments();
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to enroll in course';
      toast.error(error);
      return { success: false, error };
    }
  };

  const isEnrolled = (courseId: string) => {
    return enrollments.some(enrollment => enrollment.courseId === courseId);
  };

  const getEnrollment = (courseId: string) => {
    return enrollments.find(enrollment => enrollment.courseId === courseId);
  };

  useEffect(() => {
    loadEnrollments();
  }, [user]);

  return {
    enrollments,
    loading,
    error,
    enrollInCourse,
    isEnrolled,
    getEnrollment,
    refetch: loadEnrollments
  };
}

export function useInProgressCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInProgressCourses = async () => {
    if (!user) {
      setCourses([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const inProgressCourses = await ProgressService.getInProgressCourses(user.uid);
      setCourses(inProgressCourses);
    } catch (err) {
      console.error('Error loading in-progress courses:', err);
      setError(err instanceof Error ? err.message : 'Failed to load in-progress courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInProgressCourses();
  }, [user]);

  return {
    courses,
    loading,
    error,
    refetch: loadInProgressCourses
  };
}

export function useCompletedCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCompletedCourses = async () => {
    if (!user) {
      setCourses([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const completedCourses = await ProgressService.getCompletedCourses(user.uid);
      setCourses(completedCourses);
    } catch (err) {
      console.error('Error loading completed courses:', err);
      setError(err instanceof Error ? err.message : 'Failed to load completed courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompletedCourses();
  }, [user]);

  return {
    courses,
    loading,
    error,
    refetch: loadCompletedCourses
  };
}

export function useCourseProgress(courseId: string) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && courseId) {
      loadCourseProgress();
    } else {
      setProgress(null);
      setEnrollment(null);
      setLoading(false);
    }
  }, [user, courseId]);

  const loadCourseProgress = async () => {
    if (!user || !courseId) return;

    try {
      setLoading(true);
      setError(null);
      
      const [progressData, enrollmentData] = await Promise.all([
        ProgressService.getCourseProgress(user.uid, courseId),
        ProgressService.getUserEnrollment(user.uid, courseId)
      ]);

      setProgress(progressData);
      setEnrollment(enrollmentData);
    } catch (err: any) {
      setError(err.message || 'Kurs progressini yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const completeLesson = async (
    lessonId: string,
    timeSpent: number,
    watchPercentage: number = 100,
    quizScore?: number
  ) => {
    if (!user || !courseId) return { success: false, error: 'Tizimga kirishingiz kerak' };

    try {
      console.log('Attempting to complete lesson:', lessonId, 'for course:', courseId);
      console.log('User ID:', user ? user.uid : 'No user');
      console.log('Time spent:', timeSpent, 'Watch percentage:', watchPercentage);

      const result = await ProgressService.completeLessonAndUpdateProgress(
        user.uid,
        courseId,
        lessonId,
        timeSpent,
        watchPercentage,
        quizScore
      );

      if (result.success && result.data) {
        setProgress(result.data);
        // Also update the enrollment if needed
        await loadCourseProgress();
        console.log('Lesson completed successfully:', lessonId);
      } else {
        console.error('Error completing lesson:', result.error);
      }

      return result;
    } catch (err: any) {
      return { success: false, error: err.message || 'Darsni tugatishda xatolik yuz berdi' };
    }
  };

  return {
    progress,
    enrollment,
    loading,
    error,
    completeLesson,
    refresh: loadCourseProgress
  };
}

export function useLessonProgress(lessonId: string) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && lessonId) {
      loadLessonProgress();
    } else {
      setProgress(null);
      setLoading(false);
    }
  }, [user, lessonId]);

  const loadLessonProgress = async () => {
    if (!user || !lessonId) return;

    try {
      setLoading(true);
      setError(null);
      
      const data = await ProgressService.getLessonProgress(user.uid, lessonId);
      setProgress(data);
    } catch (err: any) {
      setError(err.message || 'Dars progressini yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return {
    progress,
    loading,
    error,
    refresh: loadLessonProgress
  };
}

export function useUserAchievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadAchievements();
    } else {
      setAchievements([]);
      setLoading(false);
    }
  }, [user]);

  const loadAchievements = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const data = await ProgressService.getUserAchievements(user.uid);
      setAchievements(data);
    } catch (err: any) {
      setError(err.message || 'Yutuqlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const checkNewAchievements = async () => {
    if (!user) return [];

    try {
      const newAchievements = await ProgressService.checkAndUnlockAchievements(user.uid);
      if (newAchievements.length > 0) {
        setAchievements(prev => [...newAchievements, ...prev]);
      }
      return newAchievements;
    } catch (err: any) {
      console.error('Error checking new achievements:', err);
      return [];
    }
  };

  const markAsRead = async () => {
    if (!user) return;

    try {
      await ProgressService.markAchievementsAsRead(user.uid);
      setAchievements(prev => 
        prev.map(achievement => ({ ...achievement, isNew: false }))
      );
    } catch (err: any) {
      console.error('Error marking achievements as read:', err);
    }
  };

  return {
    achievements,
    loading,
    error,
    checkNewAchievements,
    markAsRead,
    refresh: loadAchievements
  };
}

export function useWeeklyActivity() {
  const { user } = useAuth();
  const [activity, setActivity] = useState<WeeklyActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWeeklyActivity = async () => {
    if (!user) {
      setActivity([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const weeklyActivity = await ProgressService.getWeeklyActivity(user.uid);
      setActivity(weeklyActivity);
    } catch (err) {
      console.error('Error loading weekly activity:', err);
      setError(err instanceof Error ? err.message : 'Failed to load weekly activity');
    } finally {
      setLoading(false);
    }
  };

  const updateActivity = async (
    date: Date,
    minutesSpent: number,
    courseId: string
  ) => {
    if (!user) return;

    try {
      await ProgressService.updateWeeklyActivity(user.uid, date, minutesSpent, courseId);
      await loadWeeklyActivity(); // Reload activity
    } catch (err) {
      console.error('Error updating weekly activity:', err);
    }
  };

  useEffect(() => {
    loadWeeklyActivity();
  }, [user]);

  return {
    activity,
    loading,
    error,
    updateActivity,
    refetch: loadWeeklyActivity
  };
}

// Helper function
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
} 