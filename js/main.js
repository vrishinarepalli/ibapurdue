/**
 * ============================================================================
 * MAIN APPLICATION ENTRY POINT
 * ============================================================================
 *
 * Coordinates initialization of all modules
 */

import { initializeAuthListener } from './auth-handler.js';
import { initializeTournamentData } from './tournament-data.js';
import { initializeAdminFunctions } from './admin-functions.js';
import { initializeNavigation } from './navigation.js';

/**
 * Wait for Firebase to be initialized
 */
function waitForFirebase(callback) {
  if (window.db && window.firestoreImports && window.auth) {
    callback();
  } else {
    setTimeout(() => waitForFirebase(callback), 100);
  }
}

/**
 * Initialize the application
 */
function initializeApp() {
  console.log('🚀 Initializing IBA Website Application');

  waitForFirebase(() => {
    console.log('✅ Firebase ready');

    // Initialize all modules
    initializeNavigation();
    initializeTournamentData();
    initializeAuthListener();
    initializeAdminFunctions();

    console.log('✅ All modules initialized');
  });
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
