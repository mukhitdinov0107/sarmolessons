// Cookie management utilities with fallback to localStorage
export interface CookieOptions {
  maxAge?: number
  expires?: Date
  path?: string
  domain?: string
  secure?: boolean
  httpOnly?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
}

export const cookies = {
  set: (name: string, value: string, options: CookieOptions = {}) => {
    if (typeof window === 'undefined') return

    try {
      // Default options
      const defaultOptions: CookieOptions = {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax'
      }

      const mergedOptions = { ...defaultOptions, ...options }

      let cookieString = `${name}=${encodeURIComponent(value)}`

      if (mergedOptions.maxAge) {
        cookieString += `; Max-Age=${mergedOptions.maxAge}`
      }

      if (mergedOptions.expires) {
        cookieString += `; Expires=${mergedOptions.expires.toUTCString()}`
      }

      if (mergedOptions.path) {
        cookieString += `; Path=${mergedOptions.path}`
      }

      if (mergedOptions.domain) {
        cookieString += `; Domain=${mergedOptions.domain}`
      }

      if (mergedOptions.secure) {
        cookieString += `; Secure`
      }

      if (mergedOptions.sameSite) {
        cookieString += `; SameSite=${mergedOptions.sameSite}`
      }

      document.cookie = cookieString

      // Fallback to localStorage if cookies are blocked
      try {
        localStorage.setItem(`cookie_${name}`, value)
      } catch (e) {
        // Silent fallback failure
      }
    } catch (error) {
      // If cookies fail, try localStorage
      try {
        localStorage.setItem(`cookie_${name}`, value)
      } catch (e) {
        console.warn('Unable to set cookie or localStorage:', error)
      }
    }
  },

  get: (name: string): string | null => {
    if (typeof window === 'undefined') return null

    try {
      // Try to get from cookies first
      const cookies = document.cookie.split(';')
      
      for (const cookie of cookies) {
        const [cookieName, cookieValue] = cookie.trim().split('=')
        if (cookieName === name) {
          return decodeURIComponent(cookieValue)
        }
      }

      // Fallback to localStorage
      try {
        return localStorage.getItem(`cookie_${name}`)
      } catch (e) {
        return null
      }
    } catch (error) {
      // Fallback to localStorage
      try {
        return localStorage.getItem(`cookie_${name}`)
      } catch (e) {
        return null
      }
    }

    return null
  },

  remove: (name: string, options: Partial<CookieOptions> = {}) => {
    if (typeof window === 'undefined') return

    const defaultOptions: Partial<CookieOptions> = {
      path: '/',
      maxAge: -1
    }

    const mergedOptions = { ...defaultOptions, ...options }

    try {
      let cookieString = `${name}=`

      if (mergedOptions.path) {
        cookieString += `; Path=${mergedOptions.path}`
      }

      if (mergedOptions.domain) {
        cookieString += `; Domain=${mergedOptions.domain}`
      }

      cookieString += `; Max-Age=-1`

      document.cookie = cookieString

      // Also remove from localStorage
      try {
        localStorage.removeItem(`cookie_${name}`)
      } catch (e) {
        // Silent fallback failure
      }
    } catch (error) {
      // Try localStorage anyway
      try {
        localStorage.removeItem(`cookie_${name}`)
      } catch (e) {
        console.warn('Unable to remove cookie or localStorage:', error)
      }
    }
  }
}

// User preferences management
export const userPreferences = {
  setTheme: (theme: 'light' | 'dark') => {
    cookies.set('user_theme', theme, { maxAge: 60 * 60 * 24 * 365 }) // 1 year
  },

  getTheme: (): 'light' | 'dark' | null => {
    return cookies.get('user_theme') as 'light' | 'dark' | null
  },

  setLanguage: (language: string) => {
    cookies.set('user_language', language, { maxAge: 60 * 60 * 24 * 365 }) // 1 year
  },

  getLanguage: (): string | null => {
    return cookies.get('user_language')
  },

  setLastVisitedCourse: (courseId: string) => {
    cookies.set('last_visited_course', courseId, { maxAge: 60 * 60 * 24 * 30 }) // 30 days
  },

  getLastVisitedCourse: (): string | null => {
    return cookies.get('last_visited_course')
  },

  setDashboardLayout: (layout: string) => {
    cookies.set('dashboard_layout', layout, { maxAge: 60 * 60 * 24 * 90 }) // 90 days
  },

  getDashboardLayout: (): string | null => {
    return cookies.get('dashboard_layout')
  },

  setNotificationPreferences: (preferences: any) => {
    cookies.set('notification_preferences', JSON.stringify(preferences), { maxAge: 60 * 60 * 24 * 365 })
  },

  getNotificationPreferences: (): any | null => {
    const prefs = cookies.get('notification_preferences')
    if (prefs) {
      try {
        return JSON.parse(prefs)
      } catch (e) {
        return null
      }
    }
    return null
  }
}

// Session management
export const sessionManager = {
  setUserSession: (userId: string) => {
    cookies.set('user_session', userId, { maxAge: 60 * 60 * 24 * 7 }) // 7 days
  },

  getUserSession: (): string | null => {
    return cookies.get('user_session')
  },

  clearUserSession: () => {
    cookies.remove('user_session')
    cookies.remove('last_visited_course')
    cookies.remove('dashboard_layout')
  },

  setLastActivity: () => {
    cookies.set('last_activity', Date.now().toString(), { maxAge: 60 * 60 * 24 }) // 24 hours
  },

  getLastActivity: (): number | null => {
    const activity = cookies.get('last_activity')
    return activity ? parseInt(activity) : null
  }
} 