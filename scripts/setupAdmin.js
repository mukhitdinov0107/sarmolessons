"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("firebase/auth");
const firestore_1 = require("firebase/firestore");
const app_1 = require("firebase/app");
const firebaseConfig = {
    apiKey: 'AIzaSyCOE2Fya_KInxjVa9EzphKvMmXSf7n_oX8',
    authDomain: 'sarmolessons.firebaseapp.com',
    projectId: 'sarmolessons',
    storageBucket: 'sarmolessons.firebasestorage.app',
    messagingSenderId: '906913633920',
    appId: '1:906913633920:web:198f70874ff15948b87865',
    measurementId: 'G-6ZGR2TDJ1Q'
};
async function setupAdmin(email, password) {
    try {
        // Initialize Firebase
        const app = (0, app_1.initializeApp)(firebaseConfig);
        const auth = (0, auth_1.getAuth)(app);
        const db = (0, firestore_1.getFirestore)(app);
        // Create user
        const userCredential = await (0, auth_1.createUserWithEmailAndPassword)(auth, email, password);
        const user = userCredential.user;
        // Add to admins collection
        await (0, firestore_1.setDoc)((0, firestore_1.doc)(db, 'admins', user.uid), {
            role: 'admin',
            createdAt: new Date(),
            email: email
        });
        // Create user profile
        await (0, firestore_1.setDoc)((0, firestore_1.doc)(db, 'users', user.uid), {
            uid: user.uid,
            email: email,
            role: 'admin',
            displayName: 'Admin User',
            firstName: 'Admin',
            lastName: 'User',
            createdAt: new Date(),
            updatedAt: new Date(),
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
            }
        });
        console.log('Admin user created successfully:', {
            uid: user.uid,
            email: email
        });
        return user.uid;
    }
    catch (error) {
        console.error('Error creating admin user:', error);
        throw error;
    }
}
// Example usage:
// setupAdmin('admin@example.com', 'your-secure-password'); 
