"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MobileNavigation } from "@/components/mobile-navigation"
import { Bell, Edit, LogOut, Moon, Sun, User } from "lucide-react"
import { Switch } from "@/components/ui/switch"

export default function ProfilePage() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [language, setLanguage] = useState("uz")
  const [isEditing, setIsEditing] = useState(false)

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 container px-4 py-8 pb-20">
        <header className="mb-6 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
            <User className="w-12 h-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Alisher Isaev</h1>
          <p className="text-muted-foreground">alisher@example.com</p>
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
                  <CardTitle>Shaxsiy ma&apos;lumotlar</CardTitle>
                  <CardDescription>Hisobingiz ma&apos;lumotlarini o&apos;zgartiring</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">To&apos;liq ism</Label>
                  <Input id="name" defaultValue="Alisher Isaev" disabled={!isEditing} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="alisher@example.com" disabled={!isEditing} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input id="phone" type="tel" defaultValue="+998 90 123 45 67" disabled={!isEditing} />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" disabled={!isEditing}>
                  Saqlash
                </Button>
              </CardFooter>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Parolni o&apos;zgartirish</CardTitle>
                <CardDescription>
                  Hisobingiz xavfsizligini ta&apos;minlash uchun parolingizni o&apos;zgartiring
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Joriy parol</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Yangi parol</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Yangi parolni tasdiqlang</Label>
                  <Input id="confirm-password" type="password" />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Parolni o&apos;zgartirish</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Interfeys sozlamalari</CardTitle>
                <CardDescription>Ilovaning ko&apos;rinishini sozlang</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    <Label htmlFor="dark-mode">Qorong'i rejim</Label>
                  </div>
                  <Switch id="dark-mode" checked={isDarkMode} onCheckedChange={setIsDarkMode} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4" />
                    <Label htmlFor="notifications">Bildirishnomalar</Label>
                  </div>
                  <Switch id="notifications" defaultChecked />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Til</Label>
                  <select
                    id="language"
                    className="w-full p-2 rounded-md border"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
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
                <CardTitle className="text-red-600">Hisobni o&apos;chirish</CardTitle>
                <CardDescription>
                  Hisobingizni o&apos;chirsangiz, barcha ma&apos;lumotlaringiz o&apos;chiriladi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Bu harakatni qaytarib bo&apos;lmaydi. Hisobingizni o&apos;chirishdan oldin, barcha muhim
                  ma&apos;lumotlarni saqlab oling.
                </p>
                <Button variant="destructive" className="w-full">
                  Hisobni o&apos;chirish
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Button variant="outline" className="w-full flex items-center justify-center" size="lg">
          <LogOut className="mr-2 h-4 w-4" />
          Chiqish
        </Button>
      </div>
      <MobileNavigation />
    </main>
  )
}
