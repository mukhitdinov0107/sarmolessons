import { collection, doc, writeBatch, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import coursesData from "@/data/courses.json";

export async function importCoursesToFirebase() {
  try {
    const batch = writeBatch(db);
    
    for (const courseData of coursesData.courses) {
      // Create course document
      const courseRef = doc(collection(db, 'courses'), courseData.id);
      
      // Convert course data for Firebase
      const courseDoc = {
        ...courseData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Remove lessons from course doc - they'll be stored separately
        lessons: undefined
      };
      
      batch.set(courseRef, courseDoc);
      
      // Create lesson documents if they exist
      if (courseData.lessons && courseData.lessons.length > 0) {
        for (const lessonData of courseData.lessons) {
          const lessonRef = doc(collection(db, 'lessons'), lessonData.id);
          
          const lessonDoc = {
            ...lessonData,
            courseId: courseData.id,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          batch.set(lessonRef, lessonDoc);
        }
      }
    }
    
    // Commit the batch
    await batch.commit();
    console.log('Courses imported successfully!');
    return { success: true, message: 'Courses imported successfully!' };
    
  } catch (error) {
    console.error('Error importing courses:', error);
    return { success: false, error: 'Failed to import courses' };
  }
}

export async function importSingleCourse(courseData: any) {
  try {
    const batch = writeBatch(db);
    
    // Create course document
    const courseRef = doc(collection(db, 'courses'), courseData.id);
    
    const courseDoc = {
      ...courseData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lessons: undefined // Remove lessons from course doc
    };
    
    batch.set(courseRef, courseDoc);
    
    // Create lesson documents
    if (courseData.lessons && courseData.lessons.length > 0) {
      for (const lessonData of courseData.lessons) {
        const lessonRef = doc(collection(db, 'lessons'), lessonData.id);
        
        const lessonDoc = {
          ...lessonData,
          courseId: courseData.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        batch.set(lessonRef, lessonDoc);
      }
    }
    
    await batch.commit();
    console.log(`Course ${courseData.title} imported successfully!`);
    return { success: true, message: `Course ${courseData.title} imported successfully!` };
    
  } catch (error) {
    console.error(`Error importing course ${courseData.title}:`, error);
    return { success: false, error: `Failed to import course ${courseData.title}` };
  }
} 