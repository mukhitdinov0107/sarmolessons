"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Upload, CheckCircle, AlertCircle } from "lucide-react"
import { importCoursesToFirebase } from "@/lib/utils/import-courses"

export default function ImportCoursesPage() {
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)

  const handleImport = async () => {
    setImporting(true)
    setResult(null)
    
    try {
      const importResult = await importCoursesToFirebase()
      setResult(importResult)
    } catch (error) {
      setResult({
        success: false,
        error: 'Import jarayonida xatolik yuz berdi'
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Kurslarni Import qilish</h1>
        <p className="text-muted-foreground mt-2">
          JSON fayldan kurslarni Firebase Firestore ga import qilish
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            JSON dan Kurslarni Import qilish
          </CardTitle>
          <CardDescription>
            data/courses.json faylidan barcha kurslarni Firebase ga yuklash
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">Import qilinishi kerak bo'lgan ma'lumotlar:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Kurs ma'lumotlari (title, description, instructor, va hokazo)</li>
              <li>• Darslar (lessons) va ularning kontenti</li>
              <li>• Qo'shimcha materiallar (attachments)</li>
              <li>• Foydali havolalar (links)</li>
              <li>• Quiz savollari</li>
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

          <div className="flex gap-2">
            <Button 
              onClick={handleImport} 
              disabled={importing}
              className="flex-1"
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Import qilinmoqda...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Kurslarni Import qilish
                </>
              )}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p className="mb-2"><strong>Diqqat:</strong></p>
            <ul className="space-y-1">
              <li>• Bu jarayon mavjud kurslarni qayta yozadi</li>
              <li>• Internet aloqasi yaxshi bo'lishini ta'minlang</li>
              <li>• Import jarayoni bir necha daqiqa davom etishi mumkin</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 