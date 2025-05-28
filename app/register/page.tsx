"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

export default function RegisterPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    telegramUsername: ""
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast.error("Iltimos, majburiy maydonlarni to'ldiring")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Parollar mos kelmaydi")
      return
    }

    if (formData.password.length < 6) {
      toast.error("Parol kamida 6 ta belgidan iborat bo'lishi kerak")
      return
    }

    setIsLoading(true)

    try {
      const result = await signUp(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.telegramUsername || undefined
      )
      
      if (result.success) {
        toast.success(result.message || "Muvaffaqiyatli ro'yxatdan o'tdingiz!")
        router.push("/dashboard")
      } else {
        toast.error(result.error || "Ro'yxatdan o'tish muvaffaqiyatsiz")
      }
    } catch (error) {
      toast.error("Noma'lum xatolik yuz berdi")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen px-4 py-8">
      <div className="w-full max-w-md">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Orqaga
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Ro&apos;yxatdan o&apos;tish</CardTitle>
            <CardDescription>SarmoTraining platformasiga qo&apos;shilish uchun ma&apos;lumotlaringizni kiriting</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Ism *</Label>
                  <Input 
                    id="firstName" 
                    name="firstName"
                    type="text" 
                    placeholder="Ismingiz" 
                    required 
                    value={formData.firstName}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Familiya *</Label>
                  <Input 
                    id="lastName" 
                    name="lastName"
                    type="text" 
                    placeholder="Familiyangiz" 
                    required 
                    value={formData.lastName}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input 
                  id="email" 
                  name="email"
                  type="email" 
                  placeholder="sizning@email.uz" 
                  required 
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telegramUsername">Telegram username</Label>
                <Input 
                  id="telegramUsername" 
                  name="telegramUsername"
                  type="text" 
                  placeholder="@username (ixtiyoriy)" 
                  value={formData.telegramUsername}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Parol *</Label>
                <Input 
                  id="password" 
                  name="password"
                  type="password" 
                  placeholder="Kamida 6 ta belgi"
                  required 
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Parolni tasdiqlang *</Label>
                <Input 
                  id="confirmPassword" 
                  name="confirmPassword"
                  type="password" 
                  placeholder="Parolni qayta kiriting"
                  required 
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ro&apos;yxatdan o&apos;tish...
                  </>
                ) : (
                  "Ro&apos;yxatdan o&apos;tish"
                )}
              </Button>
              <div className="text-center text-sm">
                Hisobingiz bormi?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Kirish
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
