/**
 * Google Authentication Module
 *
 * Handles Google Sign-In functionality for the IBA website.
 * Creates/updates user profiles in Firestore upon successful authentication.
 */

import { waitForFirebase } from '../utils/firebase-helpers.js';

/**
 * Initiate Google Sign-In process.
 *
 * Flow:
 * 1. Wait for Firebase to be ready
 * 2. Open Google OAuth popup
 * 3. On success, check if user exists in Firestore
 * 4. Create new user document OR update existing user's lastLogin
 * 5. Auth state listener handles UI updates automatically
 *
 * @returns {void}
 *
 * @example
 * // Called from button onclick
 * <button onclick="signInWithGoogle()">Sign In with Google</button>
 */
export function signInWithGoogle() {
  waitForFirebase(async () => {
    try {
      // Import GoogleAuthProvider and signInWithPopup from Firebase
      const { GoogleAuthProvider, signInWithPopup } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');

      // Create Google provider and trigger popup
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(window.auth, provider);
      const user = result.user;

      // Check if user document exists in Firestore
      const { doc, getDoc, setDoc, updateDoc } = window.firestoreImports;
      const userDocRef = doc(window.db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // New user - create user document with default player role
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL || '',
          roles: ['player'],
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        });
      } else {
        // Existing user - update last login timestamp
        await updateDoc(userDocRef, {
          lastLogin: new Date().toISOString()
        });
      }

      // onAuthStateChanged listener will handle UI updates automatically

    } catch (error) {
      console.error('Error signing in:', error);

      // Handle specific error cases silently
      if (error.code === 'auth/popup-closed-by-user') {
        // User closed popup - no action needed
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Duplicate popup request - no action needed
      } else {
        alert('Error signing in. Please try again.');
      }
    }
  });
}

// Expose globally for backward compatibility with inline HTML onclick handlers
window.signInWithGoogle = signInWithGoogle;
