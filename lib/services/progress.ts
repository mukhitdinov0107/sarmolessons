import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  increment,
  writeBatch,
  runTransaction,
  setDoc,
  onSnapshot,
  FieldValue
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Enrollment,
  CourseProgress,
  LessonProgress,
  Achievement,
  UserAchievement,
  LearningSession,
  WeeklyActivity,
  ApiResponse,
  User,
  Course,
  UserStats
} from "@/lib/types";
import { AuthService } from "./auth";
import { CourseService } from "./courses";
import { userPreferences } from '@/lib/utils/cookies';

export class ProgressService {
  // Enroll user in a course
  static async enrollInCourse(userId: string, courseId: string): Promise<ApiResponse<Enrollment>> {
    try {
      // Check if user is already enrolled
      const existingEnrollment = await this.getUserEnrollment(userId, courseId);
      if (existingEnrollment) {
        return {
          success: false,
          error: "Siz allaqachon bu kursga yozilgansiz"
        };
      }

      const enrollmentData: Omit<Enrollment, 'id'> = {
        userId,
        courseId,
        enrolledAt: serverTimestamp() as Timestamp,
        lastAccessedAt: serverTimestamp() as Timestamp,
        status: 'active',
        progress: {
          completedLessons: [],
          currentLessonId: null,
          progressPercentage: 0,
          totalTimeSpent: 0,
          lastAccessedAt: serverTimestamp() as Timestamp
        },
        updatedAt: serverTimestamp() as Timestamp
      };

      const docRef = doc(collection(db, 'enrollments'));
      await setDoc(docRef, enrollmentData);

      const enrollment: Enrollment = {
        id: docRef.id,
        ...enrollmentData
      };

      // Update user stats
      await AuthService.updateUserStats(userId, {
        lastActiveDate: serverTimestamp() as Timestamp
      });

      return {
        success: true,
        data: enrollment,
        message: "Kursga muvaffaqiyatli yozildingiz!"
      };
    } catch (error: any) {
      console.error('Error enrolling in course:', error);
      return {
        success: false,
        error: error.message || 'Kursga yozilishda xatolik yuz berdi'
      };
    }
  }

  // Get user enrollment for a specific course
  static async getUserEnrollment(userId: string, courseId: string): Promise<Enrollment | null> {
    try {
      const enrollmentsRef = collection(db, 'enrollments');
      const q = query(
        enrollmentsRef,
        where('userId', '==', userId),
        where('courseId', '==', courseId),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as Enrollment;
    } catch (error) {
      console.error('Error getting user enrollment:', error);
      return null;
    }
  }

  // Get all user enrollments
  static async getUserEnrollments(userId: string): Promise<Enrollment[]> {
    try {
      const enrollmentsRef = collection(db, 'enrollments');
      const q = query(
        enrollmentsRef,
        where('userId', '==', userId),
        orderBy('enrolledAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Enrollment[];
    } catch (error) {
      console.error('Error getting user enrollments:', error);
      return [];
    }
  }

  // Get in-progress courses for user
  static async getInProgressCourses(userId: string): Promise<Enrollment[]> {
    try {
      const enrollments = await this.getUserEnrollments(userId);
      
      // Filter courses that are in progress (not completed)
      return enrollments.filter(enrollment => 
        enrollment.status === 'active' && 
        enrollment.progress.progressPercentage < 100
      );
    } catch (error) {
      console.error('Error getting in-progress courses:', error);
      return [];
    }
  }

  // Get completed courses for user
  static async getCompletedCourses(userId: string): Promise<Enrollment[]> {
    try {
      const enrollments = await this.getUserEnrollments(userId);
      
      return enrollments.filter(enrollment => 
        enrollment.status === 'completed' || 
        enrollment.progress.progressPercentage >= 100
      );
    } catch (error) {
      console.error('Error getting completed courses:', error);
      return [];
    }
  }

  // Mark lesson as completed
  static async completeLessonAndUpdateProgress(
    userId: string,
    courseId: string,
    lessonId: string,
    timeSpent: number,
    watchPercentage: number = 100,
    quizScore?: number
  ): Promise<ApiResponse<CourseProgress>> {
    try {
      console.log('[ProgressService] Starting lesson completion process for:', userId, courseId, lessonId);
      
      const enrollment = await this.getUserEnrollment(userId, courseId);
      if (!enrollment) {
        console.log('[ProgressService] No enrollment found');
        return {
          success: false,
          error: 'Kursga yozilmagansiz'
        };
      }
      
      console.log('[ProgressService] Enrollment found:', enrollment.id);

      // Get course data to find total lessons
      const course = await CourseService.getCourseById(courseId);
      if (!course || !course.lessons) {
        console.log('[ProgressService] Course data not found');
        return {
          success: false,
          error: 'Kurs ma\'lumotlari topilmadi'
        };
      }
      const totalLessonsInCourse = course.lessons.length;
      console.log('[ProgressService] Total lessons in course:', totalLessonsInCourse);

      // Create the lesson progress object with proper types
      const newLessonProgress: LessonProgress = {
        lessonId, // This must be a string
        completedAt: Timestamp.fromDate(new Date()), // Use current date instead of serverTimestamp()
        timeSpent: timeSpent || 0,
        watchPercentage: watchPercentage || 0,
        attempts: 1 // This could be incremented if re-attempts are allowed
      };
      
      // Add quizScore only if it exists
      if (quizScore !== undefined) {
        newLessonProgress.quizScore = quizScore;
      }
      
      console.log('[ProgressService] New lesson progress:', newLessonProgress);

      try {
        // Get the current document to ensure we have the latest data
        const enrollmentRef = doc(db, 'enrollments', enrollment.id);
        const docSnap = await getDoc(enrollmentRef);
        if (!docSnap.exists()) {
          throw new Error('Enrollment document not found');
        }
        
        // Get the current data
        const currentData = docSnap.data() as Omit<Enrollment, 'id'>;
        
        // Create a copy of the completed lessons array
        let completedLessons = [...(currentData.progress.completedLessons || [])];
        
        // Check if this lesson is already in the array
        const existingIndex = completedLessons.findIndex(
          lesson => lesson.lessonId === lessonId
        );
        
        if (existingIndex >= 0) {
          // Update the existing lesson
          console.log('[ProgressService] Updating existing lesson at index:', existingIndex);
          completedLessons[existingIndex] = newLessonProgress;
        } else {
          // Add the new lesson
          console.log('[ProgressService] Adding new lesson to array');
          completedLessons.push(newLessonProgress);
        }
        
        // Calculate progress percentage
        const progressPercentage = totalLessonsInCourse > 0 
          ? Math.min(100, (completedLessons.length / totalLessonsInCourse) * 100)
          : 0;
        
        console.log('[ProgressService] New progress percentage:', progressPercentage);
        console.log('[ProgressService] Completed lessons count:', completedLessons.length);
        
        // Update the status based on progress
        const status = progressPercentage >= 100 ? 'completed' : 'active';
        console.log('[ProgressService] New enrollment status:', status);
        
        // Create the updated progress object
        const updatedProgress: CourseProgress = {
          completedLessons,
          progressPercentage,
          totalTimeSpent: (currentData.progress.totalTimeSpent || 0) + timeSpent,
          lastAccessedAt: Timestamp.fromDate(new Date()),
          currentLessonId: lessonId
        };
        
        // Create the updated document data
        const updatedData = {
          status,
          updatedAt: serverTimestamp(),
          progress: updatedProgress
        };
        
        console.log('[ProgressService] Setting updated document');
        
        // Update the document with merge option
        await setDoc(enrollmentRef, updatedData, { merge: true });
        
        console.log('[ProgressService] Document updated successfully');
        
        // Update user stats
        await AuthService.updateUserStats(userId, {
          totalLearningTime: increment(timeSpent) as unknown as number,
          completedLessons: increment(1) as unknown as number,
          lastActiveDate: serverTimestamp() as Timestamp
        });
        
        if (status === 'completed' && enrollment.status !== 'completed') {
          await AuthService.updateUserStats(userId, {
            completedCourses: increment(1) as unknown as number
          });
        }
        
        // Check for achievements after lesson completion
        try {
          console.log('[ProgressService] Checking for achievements');
          await this.checkAndUnlockAchievements(userId);
        } catch (error) {
          console.error('[ProgressService] Error checking achievements:', error);
          // Don't rethrow, just log the error
        }

        console.log('[ProgressService] Lesson completion process finished successfully');

        return {
          success: true,
          data: updatedProgress,
          message: 'Dars muvaffaqiyatli tugallandi!'
        };
      } catch (error) {
        console.error('[ProgressService] Error updating enrollment:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Dars progressini saqlashda xatolik yuz berdi'
        };
      }
    } catch (error: any) {
      console.error('[ProgressService] Error completing lesson:', error);
      return {
        success: false,
        error: error.message || 'Dars progressini saqlashda xatolik yuz berdi'
      };
    }
  }

  // Get lesson progress for user
  static async getLessonProgress(userId: string, courseId: string, lessonId: string): Promise<LessonProgress | null> {
    try {
      console.log('[ProgressService] Getting lesson progress for:', userId, courseId, lessonId);
      
      // Get the enrollment first
      const enrollment = await this.getUserEnrollment(userId, courseId);
      
      if (!enrollment) {
        console.log('[ProgressService] No enrollment found for this course');
        return null;
      }
      
      console.log('[ProgressService] Enrollment found:', enrollment.id);
      console.log('[ProgressService] Completed lessons:', enrollment.progress.completedLessons);
      
      // Find the lesson progress within the enrollment
      const lessonProgress = enrollment.progress.completedLessons.find(
        (lesson: LessonProgress) => lesson.lessonId === lessonId
      );
      
      if (lessonProgress) {
        console.log('[ProgressService] Lesson progress found:', lessonProgress);
      } else {
        console.log('[ProgressService] No lesson progress found for this lesson');
      }
      
      return lessonProgress || null;
    } catch (error) {
      console.error('[ProgressService] Error getting lesson progress:', error);
      return null;
    }
  }

  // Get course progress for user
  static async getCourseProgress(userId: string, courseId: string): Promise<CourseProgress | null> {
    try {
      const enrollment = await this.getUserEnrollment(userId, courseId);
      return enrollment ? enrollment.progress : null;
    } catch (error) {
      console.error('Error getting course progress:', error);
      return null;
    }
  }

  // Record learning session
  static async recordLearningSession(
    userId: string,
    courseId: string,
    lessonId?: string,
    duration: number = 0
  ): Promise<void> {
    try {
      const sessionData = {
        userId,
        courseId,
        lessonId,
        startTime: serverTimestamp(),
        duration,
        device: this.getDeviceInfo(),
        ipAddress: 'unknown' // In a real app, you'd get this from server
      };

      await addDoc(collection(db, 'learningSessions'), sessionData);
    } catch (error) {
      console.error('Error recording learning session:', error);
    }
  }

  // Get user's achievements
  static async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      const achievementsRef = collection(db, 'userAchievements');
      const q = query(
        achievementsRef,
        where('userId', '==', userId),
        orderBy('unlockedAt', 'desc'),
        limit(10)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserAchievement[];
    } catch (error) {
      console.error('Error getting user achievements:', error);
      return [];
    }
  }

  // Check and unlock achievements
  static async checkAndUnlockAchievements(userId: string): Promise<void> {
    try {
      const enrollments = await this.getUserEnrollments(userId);
      const completedCourses = enrollments.filter((e: Enrollment) => e.status === 'completed').length;
      const totalLessons = enrollments.reduce((sum: number, e: Enrollment) => sum + e.progress.completedLessons.length, 0);
      
      const achievements = [
        {
          id: 'first_lesson',
          title: 'Birinchi qadam',
          description: 'Birinchi darsni tugallading',
          criteria: totalLessons >= 1
        },
        {
          id: 'five_lessons',
          title: 'O\'quvchi',
          description: '5 ta dars tugallang',
          criteria: totalLessons >= 5
        },
        {
          id: 'first_course',
          title: 'Kurs mazmuni',
          description: 'Birinchi kursni tugallading',
          criteria: completedCourses >= 1
        }
      ];

      for (const achievement of achievements) {
        if (achievement.criteria) {
          const existingAchievement = await this.getAchievement(userId, achievement.id);
          if (!existingAchievement) {
            await this.unlockAchievement(userId, achievement.id, achievement);
          }
        }
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  }

  // Get specific achievement
  static async getAchievement(userId: string, achievementId: string): Promise<UserAchievement | null> {
    try {
      const achievementsRef = collection(db, 'userAchievements');
      const q = query(
        achievementsRef,
        where('userId', '==', userId),
        where('achievementId', '==', achievementId),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as UserAchievement;
    } catch (error) {
      console.error('Error getting achievement:', error);
      return null;
    }
  }

  // Unlock achievement
  static async unlockAchievement(userId: string, achievementId: string, achievementData: any): Promise<void> {
    try {
      // Check if already unlocked
      const userAchievementsRef = collection(db, 'userAchievements');
      const q = query(
        userAchievementsRef,
        where('userId', '==', userId),
        where('achievementId', '==', achievementId),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // Create new user achievement
        const userAchievement: Omit<UserAchievement, 'id'> = {
          userId,
          achievementId,
          title: achievementData.title,
          description: achievementData.description,
          unlockedAt: serverTimestamp() as Timestamp,
          isNew: true,
          isRead: false
        };

        await addDoc(collection(db, 'userAchievements'), userAchievement);
      }
    } catch (error) {
      console.error('Error unlocking achievement:', error);
    }
  }

  // Get device info helper
  static getDeviceInfo(): string {
    if (typeof window !== 'undefined') {
      return `${window.navigator.platform} - ${window.navigator.userAgent}`;
    }
    return 'unknown';
  }

  // Mark achievement notifications as read
  static async markAchievementsAsRead(userId: string): Promise<void> {
    try {
      const achievementsQuery = query(
        collection(db, 'userAchievements'),
        where('userId', '==', userId),
        where('isNew', '==', true)
      );

      const snapshot = await getDocs(achievementsQuery);
      const batch = writeBatch(db);

      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isNew: false });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking achievements as read:', error);
    }
  }

  // Get user's stats
  static async getUserStats(userId: string): Promise<UserStats> {
    try {
      const statsRef = doc(db, 'users', userId);
      const statsDoc = await getDoc(statsRef);
      
      if (!statsDoc.exists()) {
        // Initialize stats if they don't exist
        const initialStats: UserStats = {
          totalLearningTime: 0,
          completedLessons: 0,
          lastUpdated: serverTimestamp()
        };
        await setDoc(statsRef, { stats: initialStats }, { merge: true });
        return initialStats;
      }
      
      return statsDoc.data()?.stats || {};
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {};
    }
  }

  // Update lesson progress and stats
  static async updateLessonProgress(
    userId: string,
    courseId: string,
    lessonId: string,
    timeSpentMinutes: number,
    completed: boolean = false
  ): Promise<void> {
    try {
      const batch = db.batch();
      
      // Update lesson progress
      const progressRef = doc(db, 'lessonProgress', `${userId}_${courseId}_${lessonId}`);
      batch.set(progressRef, {
        userId,
        courseId,
        lessonId,
        timeSpentMinutes,
        completed,
        lastUpdated: serverTimestamp()
      }, { merge: true });

      // Update user stats
      const userRef = doc(db, 'users', userId);
      if (completed) {
        batch.update(userRef, {
          'stats.completedLessons': increment(1),
          'stats.totalLearningTime': increment(timeSpentMinutes),
          'stats.lastUpdated': serverTimestamp()
        });
      } else {
        batch.update(userRef, {
          'stats.totalLearningTime': increment(timeSpentMinutes),
          'stats.lastUpdated': serverTimestamp()
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error updating lesson progress:', error);
      throw error;
    }
  }
}
