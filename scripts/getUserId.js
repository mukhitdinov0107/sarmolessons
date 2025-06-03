const admin = require('firebase-admin');
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

async function getUserByEmail(email) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    console.log('User details:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    });
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
  }
}

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.error('Please provide a user email as a command line argument');
  process.exit(1);
}

getUserByEmail(email); 