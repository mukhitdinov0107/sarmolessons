"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useInProgressCourses, useCompletedCourses, useEnrollments } from '@/hooks/useProgress';
import { ProgressService } from '@/lib/services/progress';
import { CourseService } from '@/lib/services/courses';
import { userPreferences, sessionManager } from '@/lib/utils/cookies';
import { 
  Enrollment, 
  Course, 
  UserAchievement, 
  WeeklyActivity,
  UserStats
} from '@/lib/types';
import { AuthService } from '@/lib/services/auth';

export interface DashboardStats {
  totalLearningTime: number;
  completedCourses: number;
  completedLessons: number;
  currentStreak: number;
  inProgressCourses: number;
  totalEnrollments: number;
}

export interface DashboardData {
  user: any;
  stats: DashboardStats;
  inProgressCourses: Enrollment[];
  recommendedCourses: Course[];
  recentAchievements: UserAchievement[];
  weeklyActivity: WeeklyActivity[];
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
    currentStreak: 0,
    inProgressCourses: 0,
    totalEnrollments: 0
  });

  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
  const [recentAchievements, setRecentAchievements] = useState<UserAchievement[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivity[]>([]);
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
      // Update last activity
      sessionManager.setLastActivity();
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
        achievementsData,
        weeklyData,
        recommendedData
      ] = await Promise.allSettled([
        ProgressService.getUserAchievements(user.uid),
        ProgressService.getWeeklyActivity(user.uid),
        CourseService.getFeaturedCourses(3)
      ]);

      // Handle achievements
      if (achievementsData.status === 'fulfilled') {
        setRecentAchievements(achievementsData.value.slice(0, 5));
      }

      // Handle weekly activity
      if (weeklyData.status === 'fulfilled') {
        setWeeklyActivity(weeklyData.value);
      }

      // Handle recommended courses
      if (recommendedData.status === 'fulfilled') {
        setRecommendedCourses(recommendedData.value);
      }

      // Calculate stats based on available data
      const newStats: DashboardStats = {
        totalLearningTime: calculateTotalLearningTime(weeklyData.status === 'fulfilled' ? weeklyData.value : []),
        completedCourses: completedCourses.length,
        completedLessons: calculateCompletedLessons(enrollments),
        currentStreak: calculateCurrentStreak(weeklyData.status === 'fulfilled' ? weeklyData.value : []),
        inProgressCourses: inProgressCourses.length,
        totalEnrollments: enrollments.length
      };

      setStats(newStats);

      // Update user stats in Firebase if needed
      if (user.stats) {
        const updates: Partial<UserStats> = {
          completedCourses: newStats.completedCourses,
          completedLessons: newStats.completedLessons,
          currentStreak: newStats.currentStreak,
          totalLearningTime: newStats.totalLearningTime
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

  // Helper functions with better error handling
  const calculateTotalLearningTime = (activities: WeeklyActivity[]): number => {
    if (!activities || activities.length === 0) return 0;
    
    return activities.reduce((total, activity) => {
      const minutes = activity.minutesSpent || 0;
      return total + (isNaN(minutes) ? 0 : minutes);
    }, 0);
  };

  const calculateCompletedLessons = (enrollments: Enrollment[]): number => {
    if (!enrollments || enrollments.length === 0) return 0;
    
    return enrollments.reduce((total, enrollment) => {
      const completed = enrollment.progress?.completedLessons || 0;
      return total + (isNaN(completed) ? 0 : completed);
    }, 0);
  };

  const calculateCurrentStreak = (activities: WeeklyActivity[]): number => {
    if (!activities || activities.length === 0) return 0;

    // Sort activities by date
    const sortedActivities = [...activities].sort((a, b) => {
      const aDate = a.date?.toMillis() || 0;
      const bDate = b.date?.toMillis() || 0;
      return bDate - aDate; // Most recent first
    });

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedActivities.length; i++) {
      const activityDate = sortedActivities[i].date?.toDate();
      if (!activityDate) continue;

      activityDate.setHours(0, 0, 0, 0);
      const dayDiff = Math.floor((today.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff === i) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const updateLastVisitedCourse = (courseId: string) => {
    userPreferences.setLastVisitedCourse(courseId);
  };

  const refreshDashboard = async () => {
    await Promise.all([
      refetchEnrollments(),
      refetchInProgress(),
      refetchCompleted()
    ]);
    await loadDashboardData();
  };

  return {
    user,
    stats,
    inProgressCourses,
    recommendedCourses,
    recentAchievements,
    weeklyActivity,
    loading,
    error,
    preferences,
    updateLastVisitedCourse,
    refreshDashboard
  };
} 