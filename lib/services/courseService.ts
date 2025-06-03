import { db } from '@/lib/firebase'; // Corrected Firebase client import
import { Course, Lesson } from '@/lib/types'; // Added Lesson type import
import { collection, query, where, getDocs, limit as firestoreLimit, startAfter as firestoreStartAfter, orderBy as firestoreOrderBy, getCountFromServer, doc, getDoc } from 'firebase/firestore'; // Added doc and getDoc

interface CourseQueryParams {
  category?: string;
  level?: string;
  featured?: string;
  limit?: string;
  offset?: string; // Firestore's offset is not ideal for large datasets, consider cursor-based
  search?: string;
  sortBy?: string; // e.g., 'createdAt', 'title'
  sortOrder?: 'asc' | 'desc';
  lastVisibleId?: string; // For cursor-based pagination
}

interface GetCoursesResponse {
  courses: Course[];
  total: number;
  // nextPageCursor?: string; // For cursor-based pagination
}

export class CourseService {
  static async getCourses(params: CourseQueryParams): Promise<GetCoursesResponse> {
    const coursesRef = collection(db, 'courses');
    let q = query(coursesRef);

    // Apply filters
    if (params.category) {
      q = query(q, where('category', '==', params.category));
    }
    if (params.level) {
      q = query(q, where('level', '==', params.level));
    }
    if (params.featured === 'true') {
      q = query(q, where('isFeatured', '==', true));
    }

    // Sorting - default to createdAt descending if not specified
    const sortBy = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';
    q = query(q, firestoreOrderBy(sortBy, sortOrder));

    // Build a separate query for total count, applying only filters
    let countQuery = query(coursesRef);
    if (params.category) {
      countQuery = query(countQuery, where('category', '==', params.category));
    }
    if (params.level) {
      countQuery = query(countQuery, where('level', '==', params.level));
    }
    if (params.featured === 'true') {
      countQuery = query(countQuery, where('isFeatured', '==', true));
    }
    // Note: If search needs to affect total count, and search is complex (e.g., full-text on client),
    // this count will be pre-search. For accurate post-search count with client-side search,
    // all matching documents would need to be fetched, searched, then counted.
    // Or, implement server-side search (e.g., Algolia) for accurate counts.

    const snapshot = await getCountFromServer(countQuery);
    const totalCourses = snapshot.data().count;

    // Pagination
    const pageLimit = params.limit ? parseInt(params.limit) : 10;
    if (params.offset) { // Using offset for simplicity, but be wary for large datasets
        // Firestore does not directly support offset in the same way as array slicing.
        // A common workaround is to fetch up to offset + limit and then slice, or use cursors.
        // For now, we'll fetch with limit and if offset is used, it implies client-side slicing or a different strategy.
        // This simple implementation will just use limit. True offset needs startAfter.
        q = query(q, firestoreLimit(pageLimit));
        // To implement offset correctly with Firestore, you'd typically use startAfter with a document from the previous page.
        // If params.offset is provided and not 0, this query as is won't respect it directly without a cursor.
    } else {
        q = query(q, firestoreLimit(pageLimit));
    }
    // If params.lastVisibleId is provided for cursor-based pagination:
    // if (params.lastVisibleId) {
    //   const lastVisibleDoc = await getDoc(doc(db, 'courses', params.lastVisibleId));
    //   if (lastVisibleDoc.exists()) {
    //     q = query(q, firestoreStartAfter(lastVisibleDoc));
    //   }
    // }

    const querySnapshot = await getDocs(q);
    const courses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));

    // In-memory search (if params.search is provided)
    // This should ideally be done via a dedicated search service or more advanced Firestore querying if possible
    let searchedCourses = courses;
    if (params.search) {
      const searchTerms = params.search.toLowerCase().split(' ').filter(term => term.length > 0);
      searchedCourses = courses.filter((course: Course) => {
        const searchableText = [
          course.title,
          course.description,
          course.instructor || '', // Assuming course.instructor (string) is the instructor's name or relevant searchable text
          course.category,
          ...(course.tags || [])
        ].join(' ').toLowerCase();
        return searchTerms.every(term => searchableText.includes(term));
      });
      // Note: If search is applied, totalCourses should reflect the count *after* search for accurate pagination
      // This current implementation's totalCourses is pre-search. For accurate post-search total, 
      // you'd need to apply search before counting or count after fetching all filter-matching docs.
    }

    return {
      courses: searchedCourses,
      total: totalCourses, // This is total pre-search, pre-pagination of the current limited fetch
    };
  }

  static async getCourseById(courseId: string): Promise<Course | null> {
    const courseRef = doc(db, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);
    if (courseSnap.exists()) {
      return { id: courseSnap.id, ...courseSnap.data() } as Course;
    }
    return null;
  }

   // Method to get lessons for a course (as per memory cf6b2b4c-12d4-4895-beb8-2a3b946db8b9)
  static async getLessonsForCourse(courseId: string): Promise<Lesson[]> {
    const lessonsRef = collection(db, 'courses', courseId, 'lessons');
    // Consider adding orderBy for lessons, e.g., by 'order' field
    const q = query(lessonsRef, firestoreOrderBy('order', 'asc')); 
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson));
  }

  static async getLessonById(courseId: string, lessonId: string): Promise<Lesson | null> {
    const lessonRef = doc(db, 'courses', courseId, 'lessons', lessonId);
    const lessonSnap = await getDoc(lessonRef);
    if (lessonSnap.exists()) {
      return { id: lessonSnap.id, ...lessonSnap.data() } as Lesson;
    }
    return null;
  }
}
