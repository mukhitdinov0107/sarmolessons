import * as admin from 'firebase-admin';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

const clientConfig = {
  apiKey: 'AIzaSyCOE2Fya_KInxjVa9EzphKvMmXSf7n_oX8',
  authDomain: 'sarmolessons.firebaseapp.com',
  projectId: 'sarmolessons',
  storageBucket: 'sarmolessons.firebasestorage.app',
  messagingSenderId: '906913633920',
  appId: '1:906913633920:web:198f70874ff15948b87865',
  measurementId: 'G-6ZGR2TDJ1Q'
};

// Initialize Firebase Admin
const serviceAccount = require('../service-account.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

async function setupAdmin(email: string, password: string) {
  try {
    // Initialize Firebase client for auth
    const clientApp = initializeApp(clientConfig);
    const auth = getAuth(clientApp);

    let user;
    try {
      // Try to create new user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      user = userCredential.user;
      console.log('Created new user:', user.uid);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        // If user exists, try to sign in
        console.log('User exists, signing in...');
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
      } else {
        throw error;
      }
    }

    // Get Firestore instance from Admin SDK
    const db = admin.firestore();

    // Check if user is already an admin
    const adminDoc = await db.collection('admins').doc(user.uid).get();
    if (adminDoc.exists) {
      console.log('User is already an admin');
      return user.uid;
    }

    // Set custom claims
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });

    // Add to admins collection using Admin SDK
    await db.collection('admins').doc(user.uid).set({
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      email: email
    });

    // Get existing user data or create new profile
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    // Update or create user profile using Admin SDK
    await db.collection('users').doc(user.uid).set({
      uid: user.uid,
      email: email,
      role: 'admin',
      displayName: userData?.displayName || 'Admin User',
      firstName: userData?.firstName || 'Admin',
      lastName: userData?.lastName || 'User',
      photoURL: userData?.photoURL || null,
      createdAt: userData?.createdAt || admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      preferences: userData?.preferences || {
        language: 'uz',
        theme: 'light',
        notifications: {
          email: true,
          push: true,
          telegram: false,
          achievements: true,
          courseUpdates: true
        }
      }
    }, { merge: true });

    console.log('Admin user setup completed successfully:', {
      uid: user.uid,
      email: email,
      isNewUser: !userData
    });

    return user.uid;
  } catch (error) {
    console.error('Error setting up admin user:', error);
    throw error;
  }
}

module.exports = {
  setupAdmin
};

// Example usage:
// setupAdmin('admin@example.com', 'your-secure-password'); 