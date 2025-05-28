import { CourseClient } from './course-client';
import { notFound } from 'next/navigation';

interface CoursePageProps {
  params: {
    id: string;
  };
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

async function getCourseData(courseId: string): Promise<ApiResponse> {
  try {
    // In Next.js, we can use relative URLs for API routes
    const apiUrl = `/api/courses/${courseId}`;
    
    console.log('Fetching course data from:', apiUrl);
    
    const response = await fetch(apiUrl, {
      next: { revalidate: 3600 }, // Revalidate every hour
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      
      return {
        success: false,
        error: errorData.error || 'Failed to fetch course data'
      };
    }
    
    const data = await response.json();
    console.log('API Response:', data);
    
    return {
      success: true,
      data: data.data
    };
  } catch (error) {
    console.error('Error in getCourseData:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export default async function CoursePage({ params }: CoursePageProps) {
  // Extract courseId from params
  const courseId = params?.id;
  
  if (!courseId || typeof courseId !== 'string') {
    console.error('Invalid course ID:', courseId);
    notFound();
  }
  
  try {
    // Fetch course data on the server
    const response = await getCourseData(courseId);
    
    // Check if the response indicates success and contains data
    if (!response?.success || !response.data) {
      console.error('Invalid API response:', response);
      notFound();
    }
    
    const course = response.data;
    
    // Ensure we have the required course data
    if (!course) {
      console.error('Course data is missing in response');
      notFound();
    }
    
    // Extract lessons from the course or default to an empty array
    const lessons = course.lessons || [];
    
    return <CourseClient course={course} lessons={lessons} courseId={courseId} />;
  } catch (error) {
    console.error('Error in CoursePage:', error);
    notFound();
  }
}

// This helps Next.js know which paths to pre-render
export async function generateStaticParams() {
  // You can pre-render some popular courses at build time
  // For now, return an empty array and let the rest be rendered on-demand
  return [];
}
