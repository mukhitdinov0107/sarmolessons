import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Checks if a user has admin privileges
 * @param userId The user ID to check admin status for
 * @returns Promise that resolves to boolean indicating if user is admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  if (!userId) return false;
  
  try {
    // Get the user document from Firestore
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    // Check if user exists and has admin role
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.role === 'admin' || userData.isAdmin === true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}
