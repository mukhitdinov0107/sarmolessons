import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

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

// Validate environment variables
const validateEnvVars = () => {
  debugEnvVars();

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars.join(', '));
    return false;
  }

  const emptyVars = requiredEnvVars.filter(varName => process.env[varName] === '');
  if (emptyVars.length > 0) {
    console.error('Required environment variables are empty:', emptyVars.join(', '));
    return false;
  }

  return true;
};

// Only initialize Firebase if we're in the browser or if all required env vars are present
const shouldInitializeFirebase = () => {
  console.log('Checking Firebase initialization conditions:');
  console.log('- Is browser environment:', typeof window !== 'undefined');
  
  const envVarsValid = validateEnvVars();
  console.log('- Environment variables valid:', envVarsValid);
  
  return envVarsValid;
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
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || undefined,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || undefined,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || undefined,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || undefined,
  };

  try {
    // Log config for debugging (without sensitive values)
    console.log('Firebase config structure:', {
      apiKey: firebaseConfig.apiKey ? 'Set' : 'Not set',
      authDomain: firebaseConfig.authDomain ? 'Set' : 'Not set',
      projectId: firebaseConfig.projectId ? 'Set' : 'Not set',
      storageBucket: firebaseConfig.storageBucket ? 'Set' : 'Not set',
      messagingSenderId: firebaseConfig.messagingSenderId ? 'Set' : 'Not set',
      appId: firebaseConfig.appId ? 'Set' : 'Not set',
      measurementId: firebaseConfig.measurementId ? 'Set' : 'Not set',
    });

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
} else {
  console.warn('Firebase initialization skipped due to invalid configuration');
}

export { app, auth, db, storage, analytics }; 