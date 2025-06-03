"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await sendPasswordResetEmail(auth, email)
      toast.success('Parolni tiklash uchun xat yuborildi')
      router.push('/login')
    } catch (error: any) {
      toast.error(error.message || 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-md py-16">
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Parolni tiklash</h1>
          <p className="text-muted-foreground">
            Email manzilingizni kiriting va parolni tiklash uchun xat yuboramiz
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Email manzilingiz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Yuborilmoqda...' : 'Xat yuborish'}
          </Button>
        </form>
        <div className="text-center">
          <Button variant="link" onClick={() => router.push('/login')}>
            Loginga qaytish
          </Button>
        </div>
      </div>
    </div>
  )
} 