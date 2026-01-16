/**
 * =============================================================================
 * IBA BASKETBALL APPLICATION - MAIN ENTRY POINT
 * =============================================================================
 *
 * This file initializes all application modules and coordinates startup.
 *
 * Module Architecture:
 * - config/firebase.config.js  : Firebase initialization
 * - ui/navigation.logic.js     : Navigation animations & tab switching
 * - utils/firebase-helpers.js  : Firebase utility functions
 * - utils/time.js              : Time conversion utilities
 * - auth/google-auth.js        : Google Sign-In functionality
 * - teams/team-management.js   : Team CRUD operations
 * - teams/free-agency.js       : Free agent system
 * - tournament/games.js        : Game schedule management
 * - admin/admin-mode.js        : Admin mode functionality
 *
 * Note: Most functionality is still in inline scripts in index.html/mobile.html
 * for backward compatibility. These modules document the API and provide
 * extraction points for future refactoring.
 *
 * Initialization Flow:
 * 1. Firebase initializes (exposes window.db, window.auth, etc.)
 * 2. DOM ready event fires
 * 3. Navigation animations initialize
 * 4. Auth state listener starts watching for login changes
 * 5. Feature modules load data based on auth state
 */

// =============================================================================
// MODULE IMPORTS
// =============================================================================

// Core Firebase initialization - MUST run first
import { initializeFirebase } from './config/firebase.config.js?v=2';

// UI & Navigation
import { initNavigation } from './ui/navigation.logic.js';

// Utilities (import for global exposure)
import { waitForFirebase } from './utils/firebase-helpers.js';
import { convertTo24Hour } from './utils/time.js';

// Authentication
import { signInWithGoogle } from './auth/google-auth.js';

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize Firebase first.
 * This exposes Firebase services to window object for inline scripts:
 * - window.db        : Firestore database
 * - window.auth      : Firebase Auth
 * - window.functions : Cloud Functions
 * - window.firestoreImports : Firestore SDK functions
 */
initializeFirebase();

/**
 * Wait for DOM to be ready, then initialize application.
 * Uses document.readyState check for immediate execution if already loaded.
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

/**
 * Main application initialization function.
 * Called once DOM is ready and Firebase is initialized.
 */
function initializeApp() {
  // Initialize GSAP navigation animations
  initNavigation();

  // Note: Additional initialization (auth state listener, data loading)
  // is handled in inline scripts in index.html/mobile.html
  // for backward compatibility with onclick handlers
}
