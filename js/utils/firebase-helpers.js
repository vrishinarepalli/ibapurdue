/**
 * Firebase Helper Utilities
 *
 * Provides utility functions for working with Firebase services.
 * These functions ensure Firebase is properly initialized before use.
 */

/**
 * Wait for Firebase to be fully initialized before executing callback.
 * Polls every 100ms until window.db and window.firestoreImports are available.
 *
 * @param {Function} callback - Function to execute once Firebase is ready
 *
 * @example
 * waitForFirebase(() => {
 *   // Firebase is now ready, safe to use db, auth, etc.
 *   const data = await getDocs(collection(db, 'users'));
 * });
 */
export function waitForFirebase(callback) {
  if (window.db && window.firestoreImports) {
    callback();
  } else {
    setTimeout(() => waitForFirebase(callback), 100);
  }
}

// Expose globally for backward compatibility with inline HTML onclick handlers
window.waitForFirebase = waitForFirebase;
