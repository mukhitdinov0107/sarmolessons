import * as admin from 'firebase-admin';
import { promises as fs } from 'fs';
import path from 'path';

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
} catch (error: any) {
  if (error.code === 'app/duplicate-app') {
    console.warn('Firebase app already initialized. Skipping initialization.');
  } else {
    console.error('Firebase Admin SDK initialization error:', error);
    process.exit(1);
  }
}

const db = admin.firestore();

type FirestoreTimestampOrFieldValue = admin.firestore.Timestamp | admin.firestore.FieldValue;

interface QuizQuestion {
  id: string;
  questionText: string;
  type: 'single-choice' | 'multiple-choice' | 'true-false' | 'short-answer';
  options?: { id: string; text: string }[];
  correctAnswer: string | string[];
  explanation?: string;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  timeLimit?: number; // in minutes
  passingScore?: number; // percentage
}

interface Attachment {
  id: string;
  type: 'file' | 'link' | 'video';
  url: string;
  title?: string;
  fileType?: string;
  size?: string;
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  order: number;
  duration?: string; // e.g., "10 min"
  videoUrl?: string;
  content?: string; // HTML content
  attachments?: Attachment[];
  links?: { id: string; url: string; title?: string; description?: string }[];
  quiz?: Quiz;
  // Firestore specific fields (optional, can be added later by services)
  createdAt?: FirestoreTimestampOrFieldValue;
  updatedAt?: FirestoreTimestampOrFieldValue;
}

interface Course {
  id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'all';
  category: string;
  tags?: string[];
  duration?: string; // e.g., "2 hours"
  instructor?: {
    name: string;
    bio?: string;
    avatarUrl?: string;
  };
  imageUrl?: string;
  coverVideoUrl?: string;
  price?: {
    amount: number;
    currency: string;
    isFree: boolean;
  };
  learningOutcomes?: string[];
  prerequisites?: string[];
  isFeatured?: boolean;
  lessons?: Lesson[]; // This will be migrated to a subcollection
  // Firestore specific fields
  createdAt?: FirestoreTimestampOrFieldValue;
  updatedAt?: FirestoreTimestampOrFieldValue;
  totalLessons?: number;
}

async function migrateData() {
  try {
    console.log('Starting data migration...');

    // Read courses data from JSON file
    const jsonFilePath = path.join(process.cwd(), '..', 'data', 'courses.json'); // Adjusted path assuming script is in 'scripts' dir
    const fileContent = await fs.readFile(jsonFilePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);
    const coursesToMigrate: Course[] = jsonData.courses || [];

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

      const coursePayload: Partial<Course> = {
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
          const lessonPayload: Partial<Lesson> = {
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

  } catch (error) {
    console.error('Error during data migration:', error);
    process.exit(1);
  }
}

migrateData();
