"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const admin = __importStar(require("firebase-admin"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
// IMPORTANT: Replace with the actual path to your Firebase service account key JSON file
// Ensure this file is NOT committed to your repository.
const SERVICE_ACCOUNT_KEY_PATH = 'path/to/your/serviceAccountKey.json';
// Initialize Firebase Admin SDK
try {
    admin.initializeApp({
        credential: admin.credential.cert(SERVICE_ACCOUNT_KEY_PATH),
        // Add your databaseURL if it's not automatically picked up or if you have multiple databases
        // databaseURL: 'https://<YOUR_PROJECT_ID>.firebaseio.com'
    });
}
catch (error) {
    if (error.code === 'app/duplicate-app') {
        console.warn('Firebase app already initialized. Skipping initialization.');
    }
    else {
        console.error('Firebase Admin SDK initialization error:', error);
        process.exit(1);
    }
}
const db = admin.firestore();
async function migrateData() {
    try {
        console.log('Starting data migration...');
        // Read courses data from JSON file
        const jsonFilePath = path_1.default.join(process.cwd(), '..', 'data', 'courses.json'); // Adjusted path assuming script is in 'scripts' dir
        const fileContent = await fs_1.promises.readFile(jsonFilePath, 'utf-8');
        const jsonData = JSON.parse(fileContent);
        const coursesToMigrate = jsonData.courses || [];
        if (!coursesToMigrate.length) {
            console.log('No courses found in JSON file. Exiting.');
            return;
        }
        const coursesCollectionRef = db.collection('courses');
        let coursesMigrated = 0;
        let lessonsMigrated = 0;
        for (const course of coursesToMigrate) {
            const { lessons, ...courseData } = course;
            const courseDocRef = coursesCollectionRef.doc(course.id);
            const coursePayload = {
                ...courseData,
                totalLessons: lessons ? lessons.length : 0,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            await courseDocRef.set(coursePayload);
            console.log(`Migrated course: ${course.title} (ID: ${course.id})`);
            coursesMigrated++;
            if (lessons && lessons.length > 0) {
                const lessonsCollectionRef = courseDocRef.collection('lessons');
                for (const lesson of lessons) {
                    const lessonDocRef = lessonsCollectionRef.doc(lesson.id);
                    const lessonPayload = {
                        ...lesson,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    };
                    await lessonDocRef.set(lessonPayload);
                    lessonsMigrated++;
                }
                console.log(`  Migrated ${lessons.length} lessons for course ${course.title}`);
            }
        }
        console.log('\nMigration complete!');
        console.log(`Total courses migrated: ${coursesMigrated}`);
        console.log(`Total lessons migrated: ${lessonsMigrated}`);
    }
    catch (error) {
        console.error('Error during data migration:', error);
        process.exit(1);
    }
}
migrateData();
