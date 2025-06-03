"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MobileNavigation } from "@/components/mobile-navigation"
import { Bell, Edit, LogOut, Moon, Sun, User, Loader2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function ProfilePage() {
  const { user, loading, signOut, updateProfile, updatePreferences, changePassword } = useAuth()
  const router = useRouter()
  
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  
  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    telegramUsername: ''
  })
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Settings states
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [language, setLanguage] = useState("uz")
  const [notifications, setNotifications] = useState(true)

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        telegramUsername: user.telegramUsername || ''
      })
      
      // Load user preferences
      if (user.preferences) {
        setIsDarkMode(user.preferences.theme === 'dark')
        setLanguage(user.preferences.language || 'uz')
        setNotifications(user.preferences.notifications !== false)
      }
    }
  }, [user])

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const handleUpdateProfile = async () => {
    if (!user) return

    setIsUpdating(true)
    try {
      const result = await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        telegramUsername: formData.telegramUsername
      })

      if (result.success) {
        toast.success("Profil muvaffaqiyatli yangilandi!")
        setIsEditing(false)
      } else {
        toast.error(result.error || "Profilni yangilashda xatolik yuz berdi")
      }
    } catch (error: any) {
      toast.error("Profilni yangilashda xatolik yuz berdi")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Yangi parollar mos kelmaydi")
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Parol kamida 6 ta belgidan iborat bo'lishi kerak")
      return
    }

    setIsChangingPassword(true)
    try {
      const result = await changePassword(passwordData.currentPassword, passwordData.newPassword)

      if (result.success) {
        toast.success("Parol muvaffaqiyatli o'zgartirildi!")
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        toast.error(result.error || "Parolni o'zgartirishda xatolik yuz berdi")
      }
    } catch (error: any) {
      toast.error("Parolni o'zgartirishda xatolik yuz berdi")
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleUpdatePreferences = async (updates: any) => {
    if (!user) return

    try {
      const result = await updatePreferences(updates)
      if (result.success) {
        toast.success("Sozlamalar saqlandi!")
      } else {
        toast.error("Sozlamalarni saqlashda xatolik yuz berdi")
      }
    } catch (error: any) {
      toast.error("Sozlamalarni saqlashda xatolik yuz berdi")
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
      toast.success("Muvaffaqiyatli chiqildi!")
    } catch (error: any) {
      toast.error("Chiqishda xatolik yuz berdi")
    }
  }

  const handleDarkModeChange = (checked: boolean) => {
    setIsDarkMode(checked)
    handleUpdatePreferences({ theme: checked ? 'dark' : 'light' })
  }

  const handleNotificationsChange = (checked: boolean) => {
    setNotifications(checked)
    handleUpdatePreferences({ notifications: checked })
  }

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage)
    handleUpdatePreferences({ language: newLanguage })
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </main>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  const fullName = `${user.firstName} ${user.lastName}`.trim() || 'Foydalanuvchi'

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 container px-4 py-8 pb-20">
        <header className="mb-6 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4 overflow-hidden">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-muted-foreground" />
            )}
          </div>
          <h1 className="text-2xl font-bold">{fullName}</h1>
          <p className="text-muted-foreground">{user.email}</p>
          {user.telegramUsername && (
            <p className="text-sm text-muted-foreground">@{user.telegramUsername}</p>
          )}
        </header>

        <Tabs defaultValue="account" className="mb-8">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="account">Hisob</TabsTrigger>
            <TabsTrigger value="settings">Sozlamalar</TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Shaxsiy ma'lumotlar</CardTitle>
                  <CardDescription>Hisobingiz ma'lumotlarini o'zgartiring</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Ism</Label>
                  <Input 
                    id="firstName" 
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    disabled={!isEditing} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Familiya</Label>
                  <Input 
                    id="lastName" 
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    disabled={!isEditing} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={user.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telegramUsername">Telegram username</Label>
                  <Input 
                    id="telegramUsername" 
                    value={formData.telegramUsername}
                    onChange={(e) => setFormData(prev => ({ ...prev, telegramUsername: e.target.value }))}
                    placeholder="@username"
                    disabled={!isEditing} 
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  disabled={!isEditing || isUpdating}
                  onClick={handleUpdateProfile}
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Saqlash
                </Button>
              </CardFooter>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Parolni o'zgartirish</CardTitle>
                <CardDescription>
                  Hisobingiz xavfsizligini ta'minlash uchun parolingizni o'zgartiring
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Joriy parol</Label>
                  <Input 
                    id="current-password" 
                    type="password" 
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Yangi parol</Label>
                  <Input 
                    id="new-password" 
                    type="password" 
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Yangi parolni tasdiqlang</Label>
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || !passwordData.currentPassword || !passwordData.newPassword}
                >
                  {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Parolni o'zgartirish
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Interfeys sozlamalari</CardTitle>
                <CardDescription>Ilovaning ko'rinishini sozlang</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    <Label htmlFor="dark-mode">Qorong'i rejim</Label>
                  </div>
                  <Switch 
                    id="dark-mode" 
                    checked={isDarkMode} 
                    onCheckedChange={handleDarkModeChange} 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4" />
                    <Label htmlFor="notifications">Bildirishnomalar</Label>
                  </div>
                  <Switch 
                    id="notifications" 
                    checked={notifications}
                    onCheckedChange={handleNotificationsChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Til</Label>
                  <select
                    id="language"
                    className="w-full p-2 rounded-md border"
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                  >
                    <option value="uz">O'zbek</option>
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Xavfli zona</CardTitle>
                <CardDescription>
                  Hisobingizni o'chirsangiz, barcha ma'lumotlaringiz o'chiriladi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Bu harakatni qaytarib bo'lmaydi. Hisobingizni o'chirishdan oldin, barcha muhim
                  ma'lumotlarni saqlab oling.
                </p>
                <Button variant="destructive" className="w-full">
                  Hisobni o'chirish
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center" 
          size="lg"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Chiqish
        </Button>
      </div>
      <MobileNavigation />
    </main>
  )
}
