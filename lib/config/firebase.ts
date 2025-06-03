import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

// Validate required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
] as const;

// Only initialize Firebase if we're in the browser or if all required env vars are present
const shouldInitializeFirebase = () => {
  if (typeof window === 'undefined') {
    // In SSR, only initialize if all required env vars are present
    return requiredEnvVars.every(varName => !!process.env[varName]);
  }
  // In browser, always try to initialize
  return true;
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let analytics: Analytics | undefined;

if (shouldInitializeFirebase()) {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  try {
    // Initialize Firebase
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    
    // Initialize services
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    // Initialize Analytics only in browser environment
    if (typeof window !== 'undefined') {
      isSupported().then(supported => {
        if (supported) {
          analytics = getAnalytics(app);
        }
      }).catch(() => {
        // Silently handle analytics initialization errors
        console.warn('Firebase Analytics initialization failed');
      });
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
    // Don't throw the error, just log it
  }
}

export { app, auth, db, storage, analytics }; 