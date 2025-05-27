import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const { id: courseId, lessonId } = await params
    
    const coursesPath = path.join(process.cwd(), 'data', 'courses.json')
    const coursesData = JSON.parse(fs.readFileSync(coursesPath, 'utf8'))
    
    const course = coursesData.courses.find((c: any) => c.id === courseId)
    if (!course || !course.lessons) {
      return NextResponse.json({ error: 'Course or lessons not found' }, { status: 404 })
    }
    
    const lesson = course.lessons.find((l: any) => l.id === lessonId)
    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      lesson,
      allLessons: course.lessons
    })
  } catch (error) {
    console.error('Error fetching lesson:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 