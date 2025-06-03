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

interface QuizResult {
  quizScore: number;
  passed: boolean;
}

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
      return snapshot.docs.map(doc => {
        const data = doc.data();
        // Ensure all timestamp fields are properly handled
        return {
          id: doc.id,
          ...data,
          enrolledAt: data.enrolledAt,
          lastAccessedAt: data.lastAccessedAt,
          updatedAt: data.updatedAt,
          progress: {
            ...data.progress,
            lastAccessedAt: data.progress?.lastAccessedAt,
            completedLessons: data.progress?.completedLessons?.map((lesson: any) => ({
              ...lesson,
              completedAt: lesson.completedAt
            })) || []
          }
        } as Enrollment;
      });
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
    timeSpent: number = 0,
    progressPercentage: number = 100,
    quizResult?: QuizResult
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current progress from localStorage
      const storageKey = `progress_${userId}_${courseId}_${lessonId}`;
      const currentProgress = JSON.parse(localStorage.getItem(storageKey) || '{}');
      
      // Update progress
      const updatedProgress = {
        ...currentProgress,
        userId,
        courseId,
        lessonId,
        timeSpent: (currentProgress.timeSpent || 0) + timeSpent,
        progressPercentage,
        completedAt: quizResult?.passed || progressPercentage >= 100 ? new Date().toISOString() : null,
        quizScore: quizResult?.quizScore,
        quizPassed: quizResult?.passed,
        lastUpdated: new Date().toISOString()
      };
      
      // Save to localStorage
      localStorage.setItem(storageKey, JSON.stringify(updatedProgress));
      
      // Update course progress
      const courseStorageKey = `course_progress_${userId}_${courseId}`;
      const courseProgress = JSON.parse(localStorage.getItem(courseStorageKey) || '{}');
      
      // Add lesson to completed lessons if not already there
      if (updatedProgress.completedAt && !courseProgress.completedLessons?.includes(lessonId)) {
        courseProgress.completedLessons = [...(courseProgress.completedLessons || []), lessonId];
        localStorage.setItem(courseStorageKey, JSON.stringify(courseProgress));
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating progress:', error);
      return { success: false, error: 'Failed to update progress' };
    }
  }

  // Get lesson progress
  static async getLessonProgress(userId: string, courseId: string, lessonId: string) {
    try {
      const storageKey = `progress_${userId}_${courseId}_${lessonId}`;
      const progress = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return progress;
    } catch (error) {
      console.error('Error getting lesson progress:', error);
      return null;
    }
  }

  // Get course progress
  static async getCourseProgress(userId: string, courseId: string) {
    try {
      const storageKey = `course_progress_${userId}_${courseId}`;
      const progress = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return progress;
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

  // Update lesson progress
  static async updateLessonProgress(
    userId: string,
    courseId: string,
    lessonId: string,
    timeSpent: number = 0, // in seconds for this session
    isCompleted: boolean = false,
    watchPercentage?: number // Optional: current watch percentage
  ): Promise<void> {
    try {
      const enrollmentRef = collection(db, 'enrollments');
      const q = query(
        enrollmentRef,
        where('userId', '==', userId),
        where('courseId', '==', courseId),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        throw new Error('Enrollment not found');
      }
      
      const enrollmentDocRef = snapshot.docs[0].ref;
      const enrollment = snapshot.docs[0].data() as Enrollment;

      // Ensure progress and completedLessons are initialized
      const progress = enrollment.progress || {
        completedLessons: [],
        currentLessonId: lessonId || '',
        progressPercentage: 0,
        totalTimeSpent: 0,
        lastAccessedAt: Timestamp.fromDate(new Date()), // Use concrete timestamp instead of serverTimestamp
      };
      
      progress.completedLessons = progress.completedLessons || [];

      // Update completed lessons
      let lessonProgress = progress.completedLessons.find(lp => lp.lessonId === lessonId);
      let updatedCompletedLessons = [...progress.completedLessons];

      if (lessonProgress) {
        // Update existing lesson progress
        lessonProgress = {
          ...lessonProgress,
          timeSpent: (lessonProgress.timeSpent || 0) + (timeSpent || 0),
          watchPercentage: Math.max(lessonProgress.watchPercentage || 0, watchPercentage || 0),
          completedAt: isCompleted ? Timestamp.fromDate(new Date()) : lessonProgress.completedAt
        };
        updatedCompletedLessons = progress.completedLessons.map(lp =>
          lp.lessonId === lessonId ? lessonProgress : lp
        );
      } else {
        // Add new lesson progress
        lessonProgress = {
          lessonId,
          timeSpent: timeSpent || 0,
          watchPercentage: watchPercentage || 0,
          completedAt: isCompleted ? Timestamp.fromDate(new Date()) : null
        };
        updatedCompletedLessons.push(lessonProgress);
      }

      // Calculate overall progress percentage
      const course = await CourseService.getCourseById(courseId);
      const totalLessons = course?.lessons?.length || 1;
      const completedCount = updatedCompletedLessons.filter(lp => lp.completedAt).length;
      const progressPercentage = Math.round((completedCount / totalLessons) * 100);

      const updateData: Partial<Enrollment> & { progress: Partial<CourseProgress> } = {
        progress: {
          ...progress,
          completedLessons: updatedCompletedLessons,
          totalTimeSpent: increment(timeSpent || 0) as unknown as number,
          lastAccessedAt: Timestamp.fromDate(new Date()),
          currentLessonId: lessonId || '',
          progressPercentage: progressPercentage
        },
        lastAccessedAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      };
      
      if (progressPercentage === 100 && enrollment.status !== 'completed') {
        updateData.status = 'completed';
        // Optionally, update user stats for completed courses
         await AuthService.updateUserStats(userId, {
            completedCourses: increment(1) as unknown as number,
         });
      }

      // Sanitize the data to remove any undefined values
      const sanitizedData = JSON.parse(JSON.stringify(updateData));
      console.log('[ProgressService] Sanitized update data:', sanitizedData);
      
      // Update the document
      await updateDoc(enrollmentDocRef, sanitizedData);
      
      // Update user's general stats with safe values
      await AuthService.updateUserStats(userId, {
        totalLearningTime: increment(timeSpent || 0) as unknown as number,
        lastActiveDate: Timestamp.fromDate(new Date()), // Use concrete timestamp
        ...(isCompleted && !progress.completedLessons.find(lp => lp.lessonId === lessonId)?.completedAt 
            ? { completedLessons: increment(1) as unknown as number } 
            : {})
      });

    } catch (error) {
      console.error('Error updating lesson progress:', error);
      // Consider how to handle this error - maybe rethrow or log to a monitoring service
      throw error;
    }
  }

  // Submit a quiz attempt and update progress
  static async submitQuizAttempt(
    userId: string,
    courseId: string,
    lessonId: string,
    answers: UserAnswer[],
    timeTaken: number
  ): Promise<ApiResponse<QuizAttempt>> {
    try {
      // Get the enrollment and lesson data
      const enrollment = await this.getUserEnrollment(userId, courseId);
      if (!enrollment) {
        return {
          success: false,
          error: 'Kursga yozilmagansiz'
        };
      }

      // Get the course and lesson data to access quiz information
      const course = await CourseService.getCourseById(courseId);
      const lesson = course?.lessons?.find(l => l.id === lessonId);
      
      if (!lesson?.quiz) {
        return {
          success: false,
          error: 'Test topilmadi'
        };
      }

      // Calculate the score
      let correctAnswers = 0;
      let totalPoints = 0;
      const gradedAnswers: UserAnswer[] = answers.map(answer => {
        const question = lesson.quiz!.questions.find(q => q.id === answer.questionId);
        if (!question) return answer;

        const isCorrect = Array.isArray(answer.answer) 
          ? JSON.stringify(answer.answer.sort()) === JSON.stringify(question.correctAnswer)
          : answer.answer === question.correctAnswer;

        if (isCorrect) {
          correctAnswers++;
          totalPoints += question.points;
        }

        return {
          ...answer,
          isCorrect
        };
      });

      const totalPossiblePoints = lesson.quiz.questions.reduce((sum, q) => sum + q.points, 0);
      const scorePercentage = (totalPoints / totalPossiblePoints) * 100;
      const passed = scorePercentage >= lesson.quiz.passingScore;

      // Create the quiz attempt object
      const quizAttempt: Omit<QuizAttempt, 'id'> = {
        attemptNumber: (enrollment.progress.completedLessons.find(l => l.lessonId === lessonId)?.quizAttempts?.length || 0) + 1,
        answers: gradedAnswers,
        score: scorePercentage,
        passed,
        submittedAt: Timestamp.now(),
        timeTaken
      };

      // Update the enrollment document
      const enrollmentRef = doc(db, 'enrollments', enrollment.id);
      await runTransaction(db, async (transaction) => {
        const enrollmentDoc = await transaction.get(enrollmentRef);
        if (!enrollmentDoc.exists()) {
          throw new Error('Enrollment not found');
        }

        const currentData = enrollmentDoc.data() as Omit<Enrollment, 'id'>;
        const lessonProgressIndex = currentData.progress.completedLessons.findIndex(
          l => l.lessonId === lessonId
        );

        let updatedCompletedLessons = [...currentData.progress.completedLessons];
        const existingProgress = updatedCompletedLessons[lessonProgressIndex];

        if (lessonProgressIndex >= 0) {
          // Update existing lesson progress
          updatedCompletedLessons[lessonProgressIndex] = {
            ...existingProgress,
            quizScore: Math.max(existingProgress.quizScore || 0, scorePercentage),
            attempts: (existingProgress.attempts || 0) + 1,
            quizAttempts: [...(existingProgress.quizAttempts || []), { id: doc(collection(db, 'dummy')).id, ...quizAttempt }]
          };
        } else {
          // Create new lesson progress
          updatedCompletedLessons.push({
            lessonId,
            completedAt: Timestamp.now(),
            timeSpent: 0,
            watchPercentage: 0,
            quizScore: scorePercentage,
            attempts: 1,
            quizAttempts: [{ id: doc(collection(db, 'dummy')).id, ...quizAttempt }]
          });
        }

        // Update the enrollment
        transaction.update(enrollmentRef, {
          'progress.completedLessons': updatedCompletedLessons,
          lastAccessedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // If this is the first time passing the quiz, check for achievements
        if (passed && (!existingProgress?.quizAttempts || !existingProgress.quizAttempts.some(a => a.passed))) {
          await this.checkAndUnlockAchievements(userId);
        }
      });

      return {
        success: true,
        data: { id: doc(collection(db, 'dummy')).id, ...quizAttempt },
        message: passed ? 'Test muvaffaqiyatli topshirildi!' : 'Test natijasi yetarli emas'
      };
    } catch (error: any) {
      console.error('Error submitting quiz:', error);
      return {
        success: false,
        error: error.message || 'Testni topshirishda xatolik yuz berdi'
      };
    }
  }

  // Get quiz attempts for a specific lesson
  static async getQuizAttempts(
    userId: string,
    courseId: string,
    lessonId: string
  ): Promise<ApiResponse<QuizAttempt[]>> {
    try {
      const enrollment = await this.getUserEnrollment(userId, courseId);
      if (!enrollment) {
        return {
          success: false,
          error: 'Kursga yozilmagansiz'
        };
      }

      const lessonProgress = enrollment.progress.completedLessons.find(
        l => l.lessonId === lessonId
      );

      return {
        success: true,
        data: lessonProgress?.quizAttempts || []
      };
    } catch (error: any) {
      console.error('Error getting quiz attempts:', error);
      return {
        success: false,
        error: error.message || 'Test natijalarini olishda xatolik yuz berdi'
      };
    }
  }

  // Get the best quiz score for a lesson
  static async getBestQuizScore(
    userId: string,
    courseId: string,
    lessonId: string
  ): Promise<ApiResponse<number>> {
    try {
      const enrollment = await this.getUserEnrollment(userId, courseId);
      if (!enrollment) {
        return {
          success: false,
          error: 'Kursga yozilmagansiz'
        };
      }

      const lessonProgress = enrollment.progress.completedLessons.find(
        l => l.lessonId === lessonId
      );

      return {
        success: true,
        data: lessonProgress?.quizScore || 0
      };
    } catch (error: any) {
      console.error('Error getting best quiz score:', error);
      return {
        success: false,
        error: error.message || 'Test natijasini olishda xatolik yuz berdi'
      };
    }
  }

  // Get active students (students who have attempted quizzes) for a course
  static async getActiveStudents(courseId: string): Promise<ApiResponse<User[]>> {
    try {
      const enrollmentsRef = collection(db, 'enrollments');
      const q = query(
        enrollmentsRef,
        where('courseId', '==', courseId),
        where('status', '==', 'active')
      );
      
      const snapshot = await getDocs(q);
      const activeUserIds = new Set<string>();

      snapshot.docs.forEach(doc => {
        const enrollment = doc.data() as Enrollment;
        const hasQuizAttempts = enrollment.progress.completedLessons.some(
          lesson => lesson.quizAttempts && lesson.quizAttempts.length > 0
        );
        if (hasQuizAttempts) {
          activeUserIds.add(enrollment.userId);
        }
      });

      if (activeUserIds.size === 0) {
        return {
          success: true,
          data: []
        };
      }

      // Get user details for active students
      const usersRef = collection(db, 'users');
      const userDocs = await Promise.all(
        Array.from(activeUserIds).map(uid => getDoc(doc(usersRef, uid)))
      );

      const activeUsers = userDocs
        .filter(doc => doc.exists())
        .map(doc => ({ ...doc.data(), uid: doc.id }) as User);

      return {
        success: true,
        data: activeUsers
      };
    } catch (error: any) {
      console.error('Error getting active students:', error);
      return {
        success: false,
        error: error.message || 'Faol o\'quvchilarni olishda xatolik yuz berdi'
      };
    }
  }
}
