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
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  increment,
  Timestamp,
  serverTimestamp,
  writeBatch,
  DocumentReference,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Course,
  Lesson,
  CourseFilters,
  SortOptions,
  ApiResponse,
  PaginatedResponse,
  CourseLevel,
  CourseCategory,
  Quiz,
  Question
} from "@/lib/types";

interface CourseFilters {
  category?: string;
  level?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  tags?: string[];
}

interface CourseQueryOptions {
  limit?: number;
  offset?: number;
  filters?: CourseFilters;
  sortBy?: 'title' | 'createdAt' | 'enrollmentCount' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export class CourseService {
  private static coursesCache: Course[] | null = null;
  private static cacheExpiry: number | null = null;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Get courses data from API
  private static async getCoursesData(): Promise<Course[]> {
    try {
      const now = Date.now();
      
      // Return cached data if still valid
      if (this.coursesCache && this.cacheExpiry && now < this.cacheExpiry) {
        return this.coursesCache;
      }

      const response = await fetch('/api/courses?limit=1000', {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch courses');
      }
      
      // Update cache
      this.coursesCache = result.data || [];
      this.cacheExpiry = now + this.CACHE_DURATION;
      
      return this.coursesCache;
    } catch (error) {
      console.error('Error reading courses data:', error);
      
      // If API fails and we have cached data, return it
      if (this.coursesCache) {
        return this.coursesCache;
      }
      
      return [];
    }
  }

  // Get all published courses with filtering and pagination
  static async getPublishedCourses(options: CourseQueryOptions = {}): Promise<Course[]> {
    try {
      const {
        limit = 50,
        offset = 0,
        filters = {},
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      // Build query parameters
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      
      if (filters.category) {
        params.append('category', filters.category);
      }
      
      if (filters.level) {
        params.append('level', filters.level);
      }
      
      if (filters.isFeatured !== undefined) {
        params.append('featured', filters.isFeatured.toString());
      }

      const response = await fetch(`/api/courses?${params.toString()}`, {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch courses');
      }

      let courses = result.data || [];

      // Apply client-side filters that weren't handled by the API
      if (filters.tags && filters.tags.length > 0) {
        courses = courses.filter((course: Course) =>
          course.tags?.some(tag => 
            filters.tags!.some(filterTag => 
              tag.toLowerCase().includes(filterTag.toLowerCase())
            )
          )
        );
      }

      // Apply sorting
      courses.sort((a: Course, b: Course) => {
        let aValue: any, bValue: any;

        switch (sortBy) {
          case 'title':
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
            break;
          case 'enrollmentCount':
            aValue = a.enrollmentCount || 0;
            bValue = b.enrollmentCount || 0;
            break;
          case 'rating':
            aValue = a.rating || 0;
            bValue = b.rating || 0;
            break;
          case 'createdAt':
          default:
            aValue = new Date(a.createdAt || 0).getTime();
            bValue = new Date(b.createdAt || 0).getTime();
            break;
        }

        if (sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });

      return courses;
    } catch (error) {
      console.error('Error getting published courses:', error);
      
      // Fallback to cached data
      const cachedCourses = await this.getCoursesData();
      return cachedCourses.filter(course => course.isPublished !== false);
    }
  }

  // Get course by ID
  static async getCourseById(courseId: string): Promise<Course | null> {
    try {
      const courseDoc = await getDoc(doc(db, 'courses', courseId));
      if (!courseDoc.exists()) return null;
      
      return {
        id: courseDoc.id,
        ...courseDoc.data()
      } as Course;
    } catch (error) {
      console.error('Error getting course:', error);
      throw error;
    }
  }

  // Get course lessons
  static async getCourseLessons(courseId: string): Promise<Lesson[]> {
    try {
      const course = await this.getCourseById(courseId);
      return course?.lessons || [];
    } catch (error) {
      console.error('Error getting course lessons:', error);
      return [];
    }
  }

  // Get specific lesson
  static async getLessonById(courseId: string, lessonId: string): Promise<Lesson | null> {
    try {
      const lessons = await this.getCourseLessons(courseId);
      return lessons.find(lesson => lesson.id === lessonId) || null;
    } catch (error) {
      console.error('Error getting lesson by ID:', error);
      return null;
    }
  }

  // Search courses
  static async searchCourses(query: string, limit: number = 10): Promise<Course[]> {
    try {
      const params = new URLSearchParams();
      params.append('search', query);
      params.append('limit', limit.toString());

      const response = await fetch(`/api/courses?${params.toString()}`, {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to search courses');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error searching courses:', error);
      
      // Fallback to client-side search
      const courses = await this.getCoursesData();
      const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
      
      if (searchTerms.length === 0) {
        return [];
      }

      const results = courses.filter(course => {
        const searchableText = [
          course.title,
          course.description,
          course.instructor?.name || '',
          course.category,
          ...(course.tags || [])
        ].join(' ').toLowerCase();

        return searchTerms.every(term => searchableText.includes(term));
      });

      return results.slice(0, limit);
    }
  }

  // Get featured courses
  static async getFeaturedCourses(limit: number = 6): Promise<Course[]> {
    try {
      const params = new URLSearchParams();
      params.append('featured', 'true');
      params.append('limit', limit.toString());

      const response = await fetch(`/api/courses?${params.toString()}`, {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch featured courses');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error getting featured courses:', error);
      
      // Fallback to cached data
      const courses = await this.getCoursesData();
      return courses
        .filter(course => course.isFeatured && course.isPublished !== false)
        .slice(0, limit);
    }
  }

  // Get courses by category
  static async getCoursesByCategory(category: string, limit: number = 10): Promise<Course[]> {
    try {
      const params = new URLSearchParams();
      params.append('category', category);
      params.append('limit', limit.toString());

      const response = await fetch(`/api/courses?${params.toString()}`, {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch courses by category');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error getting courses by category:', error);
      
      // Fallback to cached data
      const courses = await this.getCoursesData();
      return courses
        .filter(course => 
          course.category.toLowerCase() === category.toLowerCase() && 
          course.isPublished !== false
        )
        .slice(0, limit);
    }
  }

  // Get all categories
  static async getCategories(): Promise<string[]> {
    try {
      const courses = await this.getCoursesData();
      const categories = new Set(courses.map(course => course.category));
      return Array.from(categories).sort();
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }

  // Get all tags
  static async getTags(): Promise<string[]> {
    try {
      const courses = await this.getCoursesData();
      const tags = new Set<string>();
      
      courses.forEach(course => {
        course.tags?.forEach(tag => tags.add(tag));
      });
      
      return Array.from(tags).sort();
    } catch (error) {
      console.error('Error getting tags:', error);
      return [];
    }
  }

  // Get course statistics
  static async getCourseStats(courseId: string): Promise<{
    totalLessons: number;
    totalDuration: number;
    enrollmentCount: number;
    rating: number;
    difficulty: string;
  }> {
    try {
      const course = await this.getCourseById(courseId);
      
      if (!course) {
        return {
          totalLessons: 0,
          totalDuration: 0,
          enrollmentCount: 0,
          rating: 0,
          difficulty: 'Unknown'
        };
      }

      const totalLessons = course.lessons?.length || 0;
      const totalDuration = course.lessons?.reduce((sum, lesson) => sum + (lesson.duration || 0), 0) || 0;

      return {
        totalLessons,
        totalDuration,
        enrollmentCount: course.enrollmentCount || 0,
        rating: course.rating || 0,
        difficulty: course.level || 'Unknown'
      };
    } catch (error) {
      console.error('Error getting course stats:', error);
      return {
        totalLessons: 0,
        totalDuration: 0,
        enrollmentCount: 0,
        rating: 0,
        difficulty: 'Unknown'
      };
    }
  }

  // Get similar courses (based on category and tags)
  static async getSimilarCourses(courseId: string, limit: number = 3): Promise<Course[]> {
    try {
      const targetCourse = await this.getCourseById(courseId);
      if (!targetCourse) return [];

      const allCourses = await this.getCoursesData();
      
      const similarCourses = allCourses
        .filter(course => 
          course.id !== courseId && 
          course.isPublished !== false
        )
        .map(course => ({
          course,
          similarity: this.calculateSimilarity(targetCourse, course)
        }))
        .filter(item => item.similarity > 0)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(item => item.course);

      return similarCourses;
    } catch (error) {
      console.error('Error getting similar courses:', error);
      return [];
    }
  }

  // Calculate similarity between courses
  private static calculateSimilarity(course1: Course, course2: Course): number {
    let similarity = 0;

    // Category match
    if (course1.category === course2.category) {
      similarity += 5;
    }

    // Level match
    if (course1.level === course2.level) {
      similarity += 3;
    }

    // Tag matches
    const tags1 = course1.tags || [];
    const tags2 = course2.tags || [];
    const commonTags = tags1.filter(tag => tags2.includes(tag));
    similarity += commonTags.length * 2;

    // Instructor match
    if (course1.instructor?.name === course2.instructor?.name) {
      similarity += 4;
    }

    return similarity;
  }

  // Clear cache (useful for development or when data is updated)
  static clearCache(): void {
    this.coursesCache = null;
    this.cacheExpiry = null;
  }

  // Validate course data structure
  static validateCourse(course: any): course is Course {
    return (
      typeof course === 'object' &&
      typeof course.id === 'string' &&
      typeof course.title === 'string' &&
      typeof course.description === 'string' &&
      typeof course.category === 'string' &&
      Array.isArray(course.lessons)
    );
  }

  // Get course prerequisites
  static async getCoursePrerequisites(courseId: string): Promise<Course[]> {
    try {
      const course = await this.getCourseById(courseId);
      if (!course || !course.prerequisites?.length) {
        return [];
      }

      const prerequisites: Course[] = [];
      for (const prereqId of course.prerequisites) {
        const prereqCourse = await this.getCourseById(prereqId);
        if (prereqCourse) {
          prerequisites.push(prereqCourse);
        }
      }

      return prerequisites;
    } catch (error) {
      console.error('Error getting course prerequisites:', error);
      return [];
    }
  }

  // Course Operations
  static async createCourse(courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Promise<Course> {
    try {
      const coursesRef = collection(db, 'courses');
      const courseDoc = await addDoc(coursesRef, {
        ...courseData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return {
        id: courseDoc.id,
        ...courseData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      } as Course;
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  }

  static async updateCourse(courseId: string, courseData: Partial<Course>): Promise<void> {
    try {
      const courseRef = doc(db, 'courses', courseId);
      await updateDoc(courseRef, {
        ...courseData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  }

  static async deleteCourse(courseId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Delete the course
      const courseRef = doc(db, 'courses', courseId);
      batch.delete(courseRef);
      
      // Delete associated lessons
      const lessonsSnapshot = await getDocs(
        query(collection(db, 'lessons'), where('courseId', '==', courseId))
      );
      
      lessonsSnapshot.docs.forEach(lessonDoc => {
        batch.delete(lessonDoc.ref);
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  }

  static async getCourses(filters?: {
    isPublished?: boolean;
    category?: string;
    level?: string;
    language?: string;
  }): Promise<Course[]> {
    try {
      let q = collection(db, 'courses');
      
      // Build query conditions
      const conditions = [];
      
      if (filters) {
        if (filters.isPublished !== undefined) {
          conditions.push(where('isPublished', '==', filters.isPublished));
        }
        if (filters.category) {
          conditions.push(where('category', '==', filters.category));
        }
        if (filters.level) {
          conditions.push(where('level', '==', filters.level));
        }
        if (filters.language) {
          conditions.push(where('language', '==', filters.language));
        }
      }
      
      // Add default sorting
      conditions.push(orderBy('createdAt', 'desc'));
      
      // Apply all conditions to query
      q = query(q, ...conditions);
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Course[];
    } catch (error) {
      console.error('Error getting courses:', error);
      throw error;
    }
  }

  // Lesson Operations
  static async createLesson(lessonData: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lesson> {
    try {
      const lessonsRef = collection(db, 'lessons');
      const lessonDoc = await addDoc(lessonsRef, {
        ...lessonData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return {
        id: lessonDoc.id,
        ...lessonData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      } as Lesson;
    } catch (error) {
      console.error('Error creating lesson:', error);
      throw error;
    }
  }

  static async updateLesson(lessonId: string, lessonData: Partial<Lesson>): Promise<void> {
    try {
      const lessonRef = doc(db, 'lessons', lessonId);
      await updateDoc(lessonRef, {
        ...lessonData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating lesson:', error);
      throw error;
    }
  }

  static async deleteLesson(lessonId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Delete the lesson
      const lessonRef = doc(db, 'lessons', lessonId);
      batch.delete(lessonRef);
      
      // Delete associated quiz if exists
      const quizSnapshot = await getDocs(
        query(collection(db, 'quizzes'), where('lessonId', '==', lessonId))
      );
      
      quizSnapshot.docs.forEach(quizDoc => {
        batch.delete(quizDoc.ref);
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      throw error;
    }
  }

  static async getLessonsByCourseId(courseId: string): Promise<Lesson[]> {
    try {
      const snapshot = await getDocs(
        query(
          collection(db, 'lessons'),
          where('courseId', '==', courseId),
          orderBy('order', 'asc')
        )
      );
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lesson[];
    } catch (error) {
      console.error('Error getting lessons:', error);
      throw error;
    }
  }

  // Quiz Operations
  static async createQuiz(quizData: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>): Promise<Quiz> {
    try {
      const quizzesRef = collection(db, 'quizzes');
      const quizDoc = await addDoc(quizzesRef, {
        ...quizData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return {
        id: quizDoc.id,
        ...quizData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      } as Quiz;
    } catch (error) {
      console.error('Error creating quiz:', error);
      throw error;
    }
  }

  static async updateQuiz(quizId: string, quizData: Partial<Quiz>): Promise<void> {
    try {
      const quizRef = doc(db, 'quizzes', quizId);
      await updateDoc(quizRef, {
        ...quizData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating quiz:', error);
      throw error;
    }
  }

  static async deleteQuiz(quizId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'quizzes', quizId));
    } catch (error) {
      console.error('Error deleting quiz:', error);
      throw error;
    }
  }

  static async getQuizByLessonId(lessonId: string): Promise<Quiz | null> {
    try {
      const snapshot = await getDocs(
        query(
          collection(db, 'quizzes'),
          where('lessonId', '==', lessonId),
          limit(1)
        )
      );
      
      if (snapshot.empty) return null;
      
      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      } as Quiz;
    } catch (error) {
      console.error('Error getting quiz:', error);
      throw error;
    }
  }
} 