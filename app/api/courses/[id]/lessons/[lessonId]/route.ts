import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; lessonId: string } }
) {
  try {
    const courseId = await Promise.resolve(params.id)
    const lessonId = await Promise.resolve(params.lessonId)
    
    // Read courses data from JSON file
    const coursesPath = path.join(process.cwd(), 'data', 'courses.json')
    const fileContent = await fs.readFile(coursesPath, 'utf-8')
    const data = JSON.parse(fileContent)
    
    const course = data.courses?.find((c: any) => c.id === courseId)
    
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      )
    }

    const lesson = course.lessons?.find((l: any) => l.id === lessonId)
    
    if (!lesson) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        course,
        lesson,
        allLessons: course.lessons
      }
    })
  } catch (error) {
    console.error('Error in lesson API:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lesson' },
      { status: 500 }
    )
  }
} 