const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

// Initialize Firebase Admin SDK with the service account
if (!admin.apps.length) {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!serviceAccountPath) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH environment variable is not set');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath)
  });
}

const db = admin.firestore();

async function addAdminUser(uid) {
  try {
    // Add to admins collection
    await db.collection('admins').doc(uid).set({
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update user document
    await db.collection('users').doc(uid).update({
      role: 'admin',
      isAdmin: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Successfully added admin privileges to user ${uid}`);
  } catch (error) {
    console.error('Error adding admin user:', error);
  }
}

// Get UID from command line argument
const uid = process.argv[2];
if (!uid) {
  console.error('Please provide a user UID as a command line argument');
  process.exit(1);
}

addAdminUser(uid); 