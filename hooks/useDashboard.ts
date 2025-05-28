"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useInProgressCourses, useCompletedCourses, useEnrollments } from '@/hooks/useProgress';
import { ProgressService } from '@/lib/services/progress';
import { CourseService } from '@/lib/services/courses';
import { userPreferences } from '@/lib/utils/cookies';
import { 
  Enrollment, 
  Course, 
  UserAchievement,
  UserStats
} from '@/lib/types';
import { AuthService } from '@/lib/services/auth';

export interface DashboardStats {
  totalLearningTime: number;
  completedCourses: number;
  completedLessons: number;
}

export interface DashboardData {
  user: any;
  stats: DashboardStats;
  inProgressCourses: Enrollment[];
  recommendedCourses: Course[];
  loading: boolean;
  error: string | null;
  preferences: any;
}

export function useDashboard() {
  const { user } = useAuth();
  const { enrollments, refetch: refetchEnrollments } = useEnrollments();
  const { courses: inProgressCourses, refetch: refetchInProgress } = useInProgressCourses();
  const { courses: completedCourses, refetch: refetchCompleted } = useCompletedCourses();

  const [stats, setStats] = useState<DashboardStats>({
    totalLearningTime: 0,
    completedCourses: 0,
    completedLessons: 0,
  });

  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user preferences from cookies
  const preferences = {
    language: userPreferences.getLanguage(),
    theme: userPreferences.getTheme(),
    notifications: userPreferences.getNotificationPreferences(),
    lastVisitedCourse: userPreferences.getLastVisitedCourse()
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [user, enrollments.length]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel with error handling for each
      const [
        recommendedData,
        userStatsData
      ] = await Promise.allSettled([
        CourseService.getFeaturedCourses(3),
        ProgressService.getUserStats(user.uid)
      ]);

      // Handle recommended courses
      if (recommendedData.status === 'fulfilled') {
        setRecommendedCourses(recommendedData.value);
      }

      // Calculate stats based on available data and Firebase stats
      let newStats: DashboardStats = {
        totalLearningTime: 0,
        completedCourses: completedCourses.length,
        completedLessons: 0,
      };

      if (userStatsData.status === 'fulfilled') {
        const firebaseStats = userStatsData.value;
        newStats = {
          totalLearningTime: firebaseStats.totalLearningTime || 0,
          completedCourses: completedCourses.length,
          completedLessons: firebaseStats.completedLessons || 0,
        };
      }

      setStats(newStats);

      // Update user stats in Firebase if needed
      if (user.stats) {
        const updates: Partial<UserStats> = {
          completedCourses: newStats.completedCourses,
          completedLessons: newStats.completedLessons,
          totalLearningTime: newStats.totalLearningTime,
        };
        
        // Fire and forget - don't wait for this
        AuthService.updateUserStats(user.uid, updates).catch(console.error);
      }

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Dashboard ma\'lumotlarini yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const updateLastVisitedCourse = (courseId: string) => {
    userPreferences.setLastVisitedCourse(courseId);
  };

  const refreshDashboard = async () => {
    await Promise.all([
      refetchEnrollments(),
      refetchInProgress(),
      refetchCompleted(),
      loadDashboardData()
    ]);
  };

  return {
    stats,
    inProgressCourses,
    recommendedCourses,
    loading,
    error,
    preferences,
    updateLastVisitedCourse,
    refreshDashboard
  };
} 