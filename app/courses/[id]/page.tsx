import { CourseClient } from './course-client';
import { notFound } from 'next/navigation';
import { promises as fs } from 'fs';
import path from 'path';

interface CoursePageProps {
  params: {
    id: string;
  };
}

async function getCourseData(courseId: string) {
  try {
    // Read courses data directly from JSON file
    const filePath = path.join(process.cwd(), 'data', 'courses.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    const courses = data.courses || [];
    const course = courses.find((c: any) => c.id === courseId);

    if (!course) {
      return {
        success: false,
        error: 'Course not found'
      };
    }

    return {
      success: true,
      data: course
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
    // Fetch course data directly from JSON
    const response = await getCourseData(courseId);
    
    // Check if the response indicates success and contains data
    if (!response?.success || !response.data) {
      console.error('Course not found:', courseId);
      notFound();
    }
    
    const course = response.data;
    
    // Ensure we have the required course data
    if (!course) {
      console.error('Course data is missing');
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
  try {
    // Read courses data from JSON file
    const filePath = path.join(process.cwd(), 'data', 'courses.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    return (data.courses || []).map((course: any) => ({
      id: course.id,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}
