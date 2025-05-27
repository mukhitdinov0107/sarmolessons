import { initializeApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics, Analytics } from "firebase/analytics";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCOE2Fya_KInxjVa9EzphKvMmXSf7n_oX8",
  authDomain: "sarmolessons.firebaseapp.com",
  projectId: "sarmolessons",
  storageBucket: "sarmolessons.firebasestorage.app",
  messagingSenderId: "906913633920",
  appId: "1:906913633920:web:198f70874ff15948b87865",
  measurementId: "G-6ZGR2TDJ1Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

// Initialize Analytics (client-side only)
let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };
export default app; 