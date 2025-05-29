import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; lessonId: string } }
) {
  try {
    const { id: courseId, lessonId } = params
    
    // Read courses data from JSON file
    const coursesPath = path.join(process.cwd(), 'data', 'courses.json')
    const fileContent = await fs.readFile(coursesPath, 'utf-8')
    const coursesData = JSON.parse(fileContent)
    
    const course = coursesData.courses.find((c: any) => c.id === courseId)
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Kurs topilmadi' },
        { status: 404 }
      )
    }

    if (!course.lessons) {
      return NextResponse.json(
        { success: false, error: 'Bu kursda darslar mavjud emas' },
        { status: 404 }
      )
    }
    
    const lesson = course.lessons.find((l: any) => l.id === lessonId)
    if (!lesson) {
      return NextResponse.json(
        { success: false, error: 'Dars topilmadi' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: {
        lesson,
        allLessons: course.lessons
      }
    })
  } catch (error) {
    console.error('Error fetching lesson:', error)
    return NextResponse.json(
      { success: false, error: 'Darsni yuklashda xatolik yuz berdi' },
      { status: 500 }
    )
  }
} 