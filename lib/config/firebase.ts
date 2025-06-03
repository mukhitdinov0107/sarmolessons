import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

// Development configuration - DO NOT USE IN PRODUCTION
const DEV_CONFIG = {
  apiKey: 'AIzaSyCOE2Fya_KInxjVa9EzphKvMmXSf7n_oX8',
  authDomain: 'sarmolessons.firebaseapp.com',
  projectId: 'sarmolessons',
  storageBucket: 'sarmolessons.firebasestorage.app',
  messagingSenderId: '906913633920',
  appId: '1:906913633920:web:198f70874ff15948b87865',
  measurementId: 'G-6ZGR2TDJ1Q'
};

// Required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
] as const;

// Optional environment variables
const optionalEnvVars = [
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
] as const;

// Debug function to safely log environment variables
const debugEnvVars = () => {
  console.log('Environment Variables Status:');
  requiredEnvVars.forEach(varName => {
    const exists = typeof process.env[varName] !== 'undefined';
    const isEmpty = exists && process.env[varName] === '';
    const value = exists ? (process.env[varName] || '').substring(0, 3) + '...' : undefined;
    console.log(`${varName}: ${exists ? (isEmpty ? 'Empty' : 'Set') : 'Missing'} ${value ? `(starts with: ${value})` : ''}`);
  });
  optionalEnvVars.forEach(varName => {
    const exists = typeof process.env[varName] !== 'undefined';
    console.log(`${varName} (optional): ${exists ? 'Set' : 'Not set'}`);
  });
};

// Get configuration based on environment
const getFirebaseConfig = () => {
  // Use environment variables if available
  if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    return {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };
  }

  // Fall back to development config if no environment variables
  console.log('Using development Firebase configuration');
  return DEV_CONFIG;
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let analytics: Analytics | undefined;

try {
  const firebaseConfig = getFirebaseConfig();
  
  // Check if Firebase is already initialized
  const existingApps = getApps();
  console.log('Existing Firebase apps:', existingApps.length);

  // Initialize Firebase
  app = existingApps.length === 0 ? initializeApp(firebaseConfig) : existingApps[0];
  console.log('Firebase app initialized:', !!app);
  
  // Initialize services
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  console.log('Firebase services initialized:', {
    auth: !!auth,
    db: !!db,
    storage: !!storage
  });

  // Initialize Analytics only in browser environment
  if (typeof window !== 'undefined') {
    isSupported().then(supported => {
      if (supported) {
        analytics = getAnalytics(app);
        console.log('Firebase Analytics initialized:', !!analytics);
      }
    }).catch((error) => {
      console.warn('Firebase Analytics initialization failed:', error);
    });
  }

  console.log('Firebase initialization completed successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Log additional details for debugging
  if (error instanceof Error) {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
  }
}

export { app, auth, db, storage, analytics }; 