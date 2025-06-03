"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CourseService } from "@/lib/services/courses"
import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"

export default function TestFirebasePage() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testFirebaseConnection = async () => {
    setLoading(true)
    setTestResults([])
    
    try {
      addResult("Starting Firebase connection test...")
      
      // Test 1: Basic Firebase connection
      addResult("Testing basic Firebase connection...")
      if (db) {
        addResult("✅ Firebase db instance exists")
      } else {
        addResult("❌ Firebase db instance is null")
        return
      }

      // Test 2: Direct Firestore query
      addResult("Testing direct Firestore query...")
      try {
        const coursesRef = collection(db, 'courses')
        const snapshot = await getDocs(coursesRef)
        addResult(`✅ Direct query successful: Found ${snapshot.size} courses`)
      } catch (error) {
        addResult(`❌ Direct query failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      // Test 3: CourseService.getCourses()
      addResult("Testing CourseService.getCourses()...")
      try {
        const coursesResult = await CourseService.getCourses()
        addResult(`✅ CourseService.getCourses() successful: Found ${coursesResult.data.length} courses`)
      } catch (error) {
        addResult(`❌ CourseService.getCourses() failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      // Test 4: CourseService.getCourseById() with a test ID
      addResult("Testing CourseService.getCourseById() with test ID...")
      try {
        const course = await CourseService.getCourseById('test-course-id')
        if (course) {
          addResult(`✅ CourseService.getCourseById() found course: ${course.title}`)
        } else {
          addResult("ℹ️ CourseService.getCourseById() returned null (expected for test ID)")
        }
      } catch (error) {
        addResult(`❌ CourseService.getCourseById() failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      // Test 5: Check if there are any courses in the database
      addResult("Checking for existing courses...")
      try {
        const featuredCourses = await CourseService.getFeaturedCourses(1)
        if (featuredCourses.length > 0) {
          addResult(`✅ Found featured courses: ${featuredCourses[0].title}`)
          
          // Test with real course ID
          const realCourse = await CourseService.getCourseById(featuredCourses[0].id)
          if (realCourse) {
            addResult(`✅ Successfully fetched real course: ${realCourse.title}`)
          } else {
            addResult(`❌ Failed to fetch real course with ID: ${featuredCourses[0].id}`)
          }
        } else {
          addResult("ℹ️ No featured courses found in database")
        }
      } catch (error) {
        addResult(`❌ Featured courses test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      addResult("Firebase connection test completed!")
      
    } catch (error) {
      addResult(`❌ Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Firebase Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testFirebaseConnection} 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Testing..." : "Run Firebase Test"}
          </Button>
          
          {testResults.length > 0 && (
            <div className="bg-gray-100 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Test Results:</h3>
              <div className="space-y-1 text-sm font-mono">
                {testResults.map((result, index) => (
                  <div key={index} className="whitespace-pre-wrap">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 