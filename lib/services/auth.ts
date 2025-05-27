import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
  User as FirebaseUser,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User, UserPreferences, UserStats, ApiResponse } from "@/lib/types";
import { sessionManager, userPreferences } from "@/lib/utils/cookies";

export class AuthService {
  // Register new user
  static async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    telegramUsername?: string
  ): Promise<ApiResponse<User>> {
    try {
      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update display name
      await updateProfile(firebaseUser, {
        displayName: `${firstName} ${lastName}`
      });

      // Create user document in Firestore
      const userData: Omit<User, 'uid'> = {
        email: firebaseUser.email!,
        displayName: `${firstName} ${lastName}`,
        firstName,
        lastName,
        telegramUsername,
        photoURL: null,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        preferences: {
          language: 'uz',
          theme: 'light',
          notifications: {
            email: true,
            push: true,
            telegram: false,
            achievements: true,
            courseUpdates: true
          }
        },
        stats: {
          totalLearningTime: 0,
          completedCourses: 0,
          completedLessons: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: serverTimestamp() as Timestamp
        }
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);

      const user: User = {
        uid: firebaseUser.uid,
        ...userData
      };

      // Set session cookies for the new user
      sessionManager.setUserSession(firebaseUser.uid);
      sessionManager.setLastActivity();
      
      // Set initial user preferences in cookies
      userPreferences.setLanguage(userData.preferences.language);
      userPreferences.setTheme(userData.preferences.theme);

      return {
        success: true,
        data: user,
        message: "Muvaffaqiyatli ro'yxatdan o'tdingiz!"
      };
    } catch (error: any) {
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Sign in existing user
  static async signIn(email: string, password: string): Promise<ApiResponse<User>> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        return {
          success: false,
          error: "Foydalanuvchi ma'lumotlari topilmadi"
        };
      }

      const userData = userDoc.data() as Omit<User, 'uid'>;
      const user: User = {
        uid: firebaseUser.uid,
        ...userData
      };

      // Update last activity and session
      await this.updateUserStats(firebaseUser.uid, {
        lastActiveDate: serverTimestamp() as Timestamp
      });

      // Set session cookies
      sessionManager.setUserSession(firebaseUser.uid);
      sessionManager.setLastActivity();
      
      // Load user preferences to cookies
      if (userData.preferences) {
        userPreferences.setLanguage(userData.preferences.language || 'uz');
        userPreferences.setTheme(userData.preferences.theme || 'light');
        
        if (userData.preferences.notifications) {
          userPreferences.setNotificationPreferences(userData.preferences.notifications);
        }
      }

      return {
        success: true,
        data: user,
        message: "Muvaffaqiyatli kirdingiz!"
      };
    } catch (error: any) {
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Sign out user
  static async signOut(): Promise<ApiResponse<null>> {
    try {
      await firebaseSignOut(auth);
      
      // Clear session cookies
      sessionManager.clearUserSession();
      
      return {
        success: true,
        data: null,
        message: "Muvaffaqiyatli chiqildi!"
      };
    } catch (error: any) {
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<User | null> {
    try {
      const firebaseUser = auth.currentUser;
      
      if (!firebaseUser) {
        return null;
      }

      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        return null;
      }

      const userData = userDoc.data() as Omit<User, 'uid'>;
      
      return {
        uid: firebaseUser.uid,
        ...userData
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = await this.getCurrentUser();
        if (user) {
          // Update session tracking
          sessionManager.setUserSession(firebaseUser.uid);
          sessionManager.setLastActivity();
        }
        callback(user);
      } else {
        sessionManager.clearUserSession();
        callback(null);
      }
    });
  }

  // Update user profile
  static async updateProfile(updates: Partial<Pick<User, 'firstName' | 'lastName' | 'telegramUsername' | 'photoURL'>>): Promise<ApiResponse<User>> {
    try {
      const firebaseUser = auth.currentUser;
      
      if (!firebaseUser) {
        return {
          success: false,
          error: "Tizimga kirishingiz kerak"
        };
      }

      // Update display name in Firebase Auth if firstName or lastName changed
      if (updates.firstName || updates.lastName) {
        const currentUser = await this.getCurrentUser();
        const newFirstName = updates.firstName || currentUser?.firstName || '';
        const newLastName = updates.lastName || currentUser?.lastName || '';
        
        await updateProfile(firebaseUser, {
          displayName: `${newFirstName} ${newLastName}`.trim()
        });
      }

      // Update Firestore document
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      if (updates.firstName || updates.lastName) {
        const currentUser = await this.getCurrentUser();
        const newFirstName = updates.firstName || currentUser?.firstName || '';
        const newLastName = updates.lastName || currentUser?.lastName || '';
        updateData.displayName = `${newFirstName} ${newLastName}`.trim();
      }

      await updateDoc(doc(db, 'users', firebaseUser.uid), updateData);

      // Get updated user data
      const updatedUser = await this.getCurrentUser();

      return {
        success: true,
        data: updatedUser!,
        message: "Profil muvaffaqiyatli yangilandi!"
      };
    } catch (error: any) {
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Update user preferences
  static async updatePreferences(preferences: Partial<UserPreferences>): Promise<ApiResponse<User>> {
    try {
      const firebaseUser = auth.currentUser;
      
      if (!firebaseUser) {
        return {
          success: false,
          error: "Tizimga kirishingiz kerak"
        };
      }

      // Update preferences in Firestore
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        preferences: preferences,
        updatedAt: serverTimestamp()
      });

      // Update cookies
      if (preferences.language) {
        userPreferences.setLanguage(preferences.language);
      }
      
      if (preferences.theme) {
        userPreferences.setTheme(preferences.theme);
      }
      
      if (preferences.notifications) {
        userPreferences.setNotificationPreferences(preferences.notifications);
      }

      // Get updated user data
      const updatedUser = await this.getCurrentUser();

      return {
        success: true,
        data: updatedUser!,
        message: "Sozlamalar saqlandi!"
      };
    } catch (error: any) {
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Reset password
  static async resetPassword(email: string): Promise<ApiResponse<null>> {
    try {
      await sendPasswordResetEmail(auth, email);
      
      return {
        success: true,
        data: null,
        message: "Parolni tiklash uchun emailingizni tekshiring"
      };
    } catch (error: any) {
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Change password
  static async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<null>> {
    try {
      const firebaseUser = auth.currentUser;
      
      if (!firebaseUser) {
        return {
          success: false,
          error: "Tizimga kirishingiz kerak"
        };
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(firebaseUser.email!, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);

      // Update password
      await updatePassword(firebaseUser, newPassword);

      return {
        success: true,
        data: null,
        message: "Parol muvaffaqiyatli o'zgartirildi!"
      };
    } catch (error: any) {
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Update user statistics
  static async updateUserStats(userId: string, stats: Partial<UserStats>): Promise<void> {
    try {
      const updateData: any = {
        updatedAt: serverTimestamp()
      };

      // Build the update object with proper field paths
      Object.keys(stats).forEach(key => {
        updateData[`stats.${key}`] = stats[key as keyof UserStats];
      });

      await updateDoc(doc(db, 'users', userId), updateData);
      
      // Update activity tracking
      sessionManager.setLastActivity();
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }

  // Get user by ID
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        return null;
      }

      const userData = userDoc.data() as Omit<User, 'uid'>;
      
      return {
        uid: userId,
        ...userData
      };
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  // Helper method to get user-friendly error messages
  private static getErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      'auth/user-not-found': "Email topilmadi",
      'auth/wrong-password': "Noto'g'ri parol",
      'auth/email-already-in-use': "Bu email allaqachon ishlatilmoqda",
      'auth/weak-password': "Parol juda zaif (kamida 6 ta belgi bo'lishi kerak)",
      'auth/invalid-email': "Noto'g'ri email format",
      'auth/user-disabled': "Hisobingiz bloklangan",
      'auth/too-many-requests': "Juda ko'p urinish. Keyinroq qayta urinib ko'ring",
      'auth/network-request-failed': "Internet ulanishi bilan muammo",
      'auth/requires-recent-login': "Ushbu amal uchun qaytadan kirishingiz kerak"
    };

    return errorMessages[errorCode] || "Noma'lum xatolik yuz berdi";
  }
} 