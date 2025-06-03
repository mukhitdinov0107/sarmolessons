"use client";

import { useState, useEffect } from 'react';
import { Course, Lesson, CourseFilters, SortOptions, PaginatedResponse } from '@/lib/types';
import { CourseService } from '@/lib/services/courses';

interface UseCoursesOptions {
  category?: string;
  level?: string;
  featured?: boolean;
  limit?: number;
  search?: string;
}

interface UseCoursesReturn {
  courses: Course[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCourses(options: UseCoursesOptions = {}): UseCoursesReturn {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      let result: Course[] = [];

      if (options.search) {
        result = await CourseService.searchCourses(options.search, options.limit);
      } else if (options.featured) {
        result = await CourseService.getFeaturedCourses(options.limit);
      } else if (options.category) {
        result = await CourseService.getCoursesByCategory(options.category, options.limit);
      } else {
        result = await CourseService.getPublishedCourses({
          limit: options.limit,
          filters: {
            level: options.level,
            category: options.category,
            isFeatured: options.featured
          }
        });
      }

      setCourses(result);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [options.category, options.level, options.featured, options.limit, options.search]);

  return {
    courses,
    loading,
    error,
    refetch: fetchCourses
  };
}

export function useFeaturedCourses(limit: number = 5) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFeaturedCourses();
  }, [limit]);

  const loadFeaturedCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await CourseService.getFeaturedCourses(limit);
      setCourses(result);
    } catch (err: any) {
      setError(err.message || 'Mashhur kurslarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return {
    courses,
    loading,
    error,
    refresh: loadFeaturedCourses
  };
}

export function useCourse(courseId: string) {
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await CourseService.getCourseById(courseId);
        setCourse(result);

        if (!result) {
          setError('Course not found');
        }
      } catch (err) {
        console.error('Error fetching course:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch course');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  return { course, loading, error };
}

export function useLesson(lessonId: string) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lessonId) {
      loadLesson();
    }
  }, [lessonId]);

  const loadLesson = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const lessonData = await CourseService.getLessonById(lessonId);
      setLesson(lessonData);
    } catch (err: any) {
      setError(err.message || 'Dars ma\'lumotlarini yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return {
    lesson,
    loading,
    error,
    refresh: loadLesson
  };
}

export function useSearchCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchCourses = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setCourses([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const results = await CourseService.searchCourses(searchTerm);
      setCourses(results);
    } catch (err: any) {
      setError(err.message || 'Qidirishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setCourses([]);
    setError(null);
  };

  return {
    courses,
    loading,
    error,
    searchCourses,
    clearSearch
  };
} 