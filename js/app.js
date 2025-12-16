/**
 * File: app.js
 * Purpose: Main application entry point - initializes all modules
 * Scope: Coordinate initialization of Firebase, auth, and all feature modules
 */

import { initializeFirebase } from './config/firebase.config.js';
import { initNavigation } from './ui/navigation.logic.js';

// Initialize Firebase first (exposes to window.db, window.auth, etc.)
initializeFirebase();

// Wait for DOM to be ready, then initialize all modules
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

function initializeApp() {
  // Initialize UI modules
  initNavigation();

  console.log('✅ IBA Basketball App Initialized');
}
