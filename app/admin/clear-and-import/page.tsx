"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Trash2, Upload, CheckCircle, AlertCircle } from "lucide-react"
import { collection, getDocs, writeBatch, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { importCoursesToFirebase } from "@/lib/utils/import-courses"

export default function ClearAndImportPage() {
  const [clearing, setClearing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const clearAllCourses = async () => {
    try {
      addLog("Starting to clear existing courses...")
      
      // Clear courses
      const coursesSnapshot = await getDocs(collection(db, 'courses'))
      const batch1 = writeBatch(db)
      let courseCount = 0
      
      coursesSnapshot.docs.forEach((courseDoc) => {
        batch1.delete(doc(db, 'courses', courseDoc.id))
        courseCount++
      })
      
      if (courseCount > 0) {
        await batch1.commit()
        addLog(`✅ Deleted ${courseCount} existing courses`)
      } else {
        addLog("ℹ️ No existing courses found")
      }
      
      // Clear lessons
      const lessonsSnapshot = await getDocs(collection(db, 'lessons'))
      const batch2 = writeBatch(db)
      let lessonCount = 0
      
      lessonsSnapshot.docs.forEach((lessonDoc) => {
        batch2.delete(doc(db, 'lessons', lessonDoc.id))
        lessonCount++
      })
      
      if (lessonCount > 0) {
        await batch2.commit()
        addLog(`✅ Deleted ${lessonCount} existing lessons`)
      } else {
        addLog("ℹ️ No existing lessons found")
      }
      
      addLog("✅ Database cleared successfully!")
      return true
    } catch (error) {
      addLog(`❌ Error clearing database: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return false
    }
  }

  const handleClearAndImport = async () => {
    setClearing(true)
    setImporting(false)
    setLogs([])
    setResult(null)
    
    try {
      // Step 1: Clear existing data
      const clearSuccess = await clearAllCourses()
      setClearing(false)
      
      if (!clearSuccess) {
        setResult({
          success: false,
          error: 'Failed to clear existing data'
        })
        return
      }
      
      // Step 2: Import new data
      setImporting(true)
      addLog("Starting import of new courses...")
      
      const importResult = await importCoursesToFirebase()
      
      if (importResult.success) {
        addLog("✅ Successfully imported new courses!")
        setResult({
          success: true,
          message: 'Successfully cleared old data and imported new courses!'
        })
      } else {
        addLog(`❌ Import failed: ${importResult.error}`)
        setResult({
          success: false,
          error: importResult.error || 'Failed to import courses'
        })
      }
    } catch (error) {
      addLog(`❌ Process failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setResult({
        success: false,
        error: 'Process failed with unexpected error'
      })
    } finally {
      setClearing(false)
      setImporting(false)
    }
  }

  const isProcessing = clearing || importing

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Clear and Import Courses</h1>
        <p className="text-muted-foreground mt-2">
          Clear all existing courses and import fresh data from JSON
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Clear and Import Process
            </CardTitle>
            <CardDescription>
              This will delete all existing courses and lessons, then import fresh data from courses.json
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-medium mb-2 text-yellow-800">⚠️ Warning</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• This will permanently delete ALL existing courses and lessons</li>
                <li>• Make sure you have a backup if needed</li>
                <li>• The process cannot be undone</li>
              </ul>
            </div>

            {result && (
              <Alert variant={result.success ? "default" : "destructive"}>
                {result.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {result.success ? result.message : result.error}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleClearAndImport} 
              disabled={isProcessing}
              variant="destructive"
              className="w-full"
            >
              {clearing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clearing existing data...
                </>
              ) : importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing new courses...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All & Import Fresh Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {logs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Process Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
                <div className="space-y-1 text-sm font-mono">
                  {logs.map((log, index) => (
                    <div key={index} className="whitespace-pre-wrap">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 