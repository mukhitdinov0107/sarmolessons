import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as updateFirebaseProfile,
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
  // Helper method to check if we're in a browser environment
  private static isBrowser() {
    return typeof window !== 'undefined';
  }

  // Helper method to safely access Firebase auth
  private static getAuth() {
    if (!this.isBrowser()) {
      return null;
    }
    return auth;
  }

  // Helper method to safely access Firestore
  private static getDb() {
    if (!this.isBrowser()) {
      return null;
    }
    return db;
  }

  // Helper method to convert Firebase user to our User type
  private static async getUserData(firebaseUser: FirebaseUser): Promise<User> {
    try {
      const db = this.getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid));
      const userData = userDoc.data();
      const isAdmin = adminDoc.exists();

      // If user is admin but doesn't have the custom claim, set it
      if (isAdmin && !firebaseUser.customClaims?.admin) {
        try {
          await fetch('/api/auth/set-admin-claim', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ uid: firebaseUser.uid }),
          });
        } catch (error) {
          console.error('Error setting admin claim:', error);
        }
      }

      if (!userData) {
        // If no Firestore data exists, create a basic user profile
        const basicUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          firstName: '',
          lastName: '',
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || null,
          telegramUsername: '',
          role: isAdmin ? 'admin' : 'user',
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Store the basic profile
        await setDoc(doc(db, 'users', firebaseUser.uid), basicUser);
        return basicUser;
      }

      // Return existing user data
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        displayName: userData.displayName || firebaseUser.displayName || '',
        photoURL: userData.photoURL || firebaseUser.photoURL || null,
        telegramUsername: userData.telegramUsername || '',
        role: isAdmin ? 'admin' : (userData.role || 'user'),
        preferences: userData.preferences || {
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
        createdAt: userData.createdAt || new Date().toISOString(),
        updatedAt: userData.updatedAt || new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  }

  // Register new user
  static async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    telegramUsername?: string
  ): Promise<ApiResponse<User>> {
    try {
      const auth = this.getAuth();
      const db = this.getDb();
      if (!auth || !db) {
        throw new Error('Authentication not available');
      }

      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);

      // Create the full user profile
      const user: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        photoURL: firebaseUser.photoURL || null,
        telegramUsername: telegramUsername || '',
        role: 'user',
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Update Firebase profile
      await updateFirebaseProfile(firebaseUser, {
        displayName: user.displayName
      });

      // Store user data in Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), user);

      // Set session cookies
      sessionManager.setUserSession(firebaseUser.uid);
      sessionManager.setLastActivity();
      
      // Set initial preferences
      userPreferences.setLanguage(user.preferences.language || 'uz');
      userPreferences.setTheme(user.preferences.theme || 'light');

      return {
        success: true,
        data: user,
        message: "Muvaffaqiyatli ro'yxatdan o'tdingiz!"
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Sign in existing user
  static async signIn(email: string, password: string): Promise<ApiResponse<User>> {
    try {
      const auth = this.getAuth();
      if (!auth) {
        throw new Error('Authentication not available');
      }

      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
      const user = await this.getUserData(firebaseUser);

      // Update last activity
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        updatedAt: new Date().toISOString()
      });

      // Set session cookies
      sessionManager.setUserSession(firebaseUser.uid);
      sessionManager.setLastActivity();
      
      // Set preferences
      userPreferences.setLanguage(user.preferences.language || 'uz');
      userPreferences.setTheme(user.preferences.theme || 'light');
      if (user.preferences.notifications) {
        userPreferences.setNotificationPreferences(user.preferences.notifications);
      }

      return {
        success: true,
        data: user,
        message: "Muvaffaqiyatli kirdingiz!"
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Sign out user
  static async signOut(): Promise<ApiResponse<null>> {
    try {
      const auth = this.getAuth();
      if (!auth) {
        throw new Error('Authentication not available');
      }

      await firebaseSignOut(auth);
      sessionManager.clearUserSession();
      return {
        success: true,
        message: "Muvaffaqiyatli chiqish!"
      };
    } catch (error: any) {
      return {
        success: false,
        error: this.getErrorMessage(error.code) || error.message
      };
    }
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (user: User | null) => void) {
    const auth = this.getAuth();
    if (!auth) {
      callback(null);
      return () => {};
    }

    return onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const user = await this.getUserData(firebaseUser);
          callback(user);
        } else {
          callback(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        callback(null);
      }
    });
  }

  // Update user profile
  static async updateProfile(updates: Partial<Pick<User, 'firstName' | 'lastName' | 'telegramUsername' | 'photoURL'>>): Promise<ApiResponse<User>> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      // Update Firebase profile if name changed
      if (updates.firstName || updates.lastName) {
        const user = await this.getUserData(currentUser);
        const newFirstName = updates.firstName || user.firstName;
        const newLastName = updates.lastName || user.lastName;
        const newDisplayName = `${newFirstName} ${newLastName}`;

        await updateFirebaseProfile(currentUser, {
          displayName: newDisplayName,
          photoURL: updates.photoURL || user.photoURL
        });
      }

      // Update Firestore data
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });

      // Get updated user data
      const updatedUser = await this.getUserData(currentUser);

      return {
        success: true,
        data: updatedUser,
        message: "Profil muvaffaqiyatli yangilandi!"
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update user preferences
  static async updatePreferences(preferences: Partial<UserPreferences>): Promise<ApiResponse<User>> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        'preferences': preferences,
        updatedAt: new Date().toISOString()
      });

      const userDoc = await getDoc(userRef);
      const userData = userDoc.data() as User;

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

      return {
        success: true,
        data: userData,
        message: "Sozlamalar saqlandi!"
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
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
        error: error.message
      };
    }
  }

  // Change password
  static async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<null>> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        throw new Error('No authenticated user');
      }

      // Re-authenticate user
      await signInWithEmailAndPassword(auth, currentUser.email, currentPassword);
      
      // Change password
      await updatePassword(currentUser, newPassword);

      return {
        success: true,
        data: null,
        message: "Parol muvaffaqiyatli o'zgartirildi!"
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
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