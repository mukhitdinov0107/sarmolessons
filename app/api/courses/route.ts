import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface CourseQueryParams {
  category?: string;
  level?: string;
  featured?: string;
  limit?: string;
  offset?: string;
  search?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params: CourseQueryParams = {
      category: searchParams.get('category') || undefined,
      level: searchParams.get('level') || undefined,
      featured: searchParams.get('featured') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
      search: searchParams.get('search') || undefined,
    };

    // Read courses data from JSON file
    const filePath = path.join(process.cwd(), 'data', 'courses.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    let courses = data.courses || [];
    
    // Apply filters
    if (params.category) {
      courses = courses.filter((course: any) => 
        course.category.toLowerCase().includes(params.category!.toLowerCase())
      );
    }

    if (params.level) {
      courses = courses.filter((course: any) => 
        course.level?.toLowerCase() === params.level!.toLowerCase()
      );
    }

    if (params.featured === 'true') {
      courses = courses.filter((course: any) => course.isFeatured === true);
    }

    // Apply search
    if (params.search) {
      const searchTerms = params.search.toLowerCase().split(' ').filter(term => term.length > 0);
      courses = courses.filter((course: any) => {
        const searchableText = [
          course.title,
          course.description,
          course.instructor?.name || '',
          course.category,
          ...(course.tags || [])
        ].join(' ').toLowerCase();

        return searchTerms.every(term => searchableText.includes(term));
      });
    }

    // Apply pagination
    const limit = params.limit ? parseInt(params.limit) : 50;
    const offset = params.offset ? parseInt(params.offset) : 0;
    
    const paginatedCourses = courses.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginatedCourses,
      total: courses.length,
      limit,
      offset
    });

  } catch (error) {
    console.error('Error in courses API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
} 