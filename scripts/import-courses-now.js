const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, writeBatch, serverTimestamp } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

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
const db = getFirestore(app);

function cleanDataForFirebase(data) {
  const cleaned = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        cleaned[key] = cleanDataForFirebase(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

async function importCourses() {
  try {
    console.log('🚀 Starting course import...');
    
    // Read the courses JSON file
    const coursesPath = path.join(__dirname, '..', 'data', 'courses.json');
    const coursesData = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));
    
    console.log(`📚 Found ${coursesData.courses.length} courses to import`);
    
    const batch = writeBatch(db);
    
    for (const courseData of coursesData.courses) {
      console.log(`📖 Processing course: ${courseData.title}`);
      
      // Create course document
      const courseRef = doc(collection(db, 'courses'), courseData.id);
      
      // Clean course data and remove lessons
      const { lessons, ...courseWithoutLessons } = courseData;
      
      const courseDoc = cleanDataForFirebase({
        ...courseWithoutLessons,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      batch.set(courseRef, courseDoc);
      console.log(`  ✅ Course document prepared: ${courseData.id}`);
      
      // Create lesson documents if they exist
      if (lessons && lessons.length > 0) {
        console.log(`  📝 Processing ${lessons.length} lessons...`);
        for (const lessonData of lessons) {
          const lessonRef = doc(collection(db, 'lessons'), lessonData.id);
          
          const lessonDoc = cleanDataForFirebase({
            ...lessonData,
            courseId: courseData.id,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          batch.set(lessonRef, lessonDoc);
          console.log(`    ✅ Lesson prepared: ${lessonData.title}`);
        }
      }
    }
    
    // Commit the batch
    console.log('💾 Committing to Firebase...');
    await batch.commit();
    console.log('✅ SUCCESS! All courses imported successfully!');
    
    // Exit the process
    process.exit(0);
    
  } catch (error) {
    console.error('❌ ERROR importing courses:', error);
    console.error('Full error:', JSON.stringify(error, null, 2));
    process.exit(1);
  }
}

// Run the import
importCourses(); 