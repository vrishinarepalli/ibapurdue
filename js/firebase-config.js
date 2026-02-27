/**
 * ============================================================================
 * FIREBASE CONFIGURATION MODULE
 * ============================================================================
 *
 * This module initializes Firebase services and exports them for use
 * throughout the application.
 *
 * Services Initialized:
 * - Firebase App: Core Firebase functionality
 * - Firestore: Database for storing tournament/player data
 * - Auth: Authentication service for admin access
 * - Functions: Cloud Functions for server-side operations
 *
 * Security:
 * - API keys in client code are normal for Firebase (they're not secrets)
 * - Security is enforced through Firestore Security Rules
 * - Admin operations require authentication verification
 * ============================================================================
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  getDoc,
  setDoc,
  query,
  where,
  arrayUnion
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import {
  getAuth,
  connectAuthEmulator,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithCustomToken,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
  getFunctions,
  httpsCallable
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js';

/**
 * Firebase project configuration
 * These values identify the Firebase project and enable client SDK access
 */
const firebaseConfig = {
  apiKey: "AIzaSyBN0rfpzjredziJbPny-YfEgq4uE2l1hzE",
  authDomain: "iba-website-63cb3.firebaseapp.com",
  projectId: "iba-website-63cb3",
  storageBucket: "iba-website-63cb3.firebasestorage.app",
  messagingSenderId: "267064036667",
  appId: "1:267064036667:web:4f9d28aac0d5ae4ca97b1e",
  measurementId: "G-GGH99DCY07"
};

/**
 * Initialize Firebase services
 */
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);

/**
 * Export Firebase SDK functions for use in other modules
 */
export const firestoreAPI = {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  getDoc,
  setDoc,
  query,
  where,
  arrayUnion
};

export const authAPI = {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithCustomToken,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence
};

export const functionsAPI = {
  httpsCallable
};

/**
 * Admin UID - only this user can access admin functions
 * This matches the UID checked in Firebase Functions
 */
export const ADMIN_UID = 'seZ01FolJbSajEKTIsljwGtYHGD3';

/**
 * Initialize Firebase and make it available globally for legacy code
 * This allows the existing inline scripts to access Firebase
 * TODO: Remove this once all code is migrated to modules
 */
window.auth = auth;
window.db = db;
window.functions = functions;
window.ADMIN_UID = ADMIN_UID;

window.authImports = authAPI;
window.functionsImports = functionsAPI;
window.firestoreImports = firestoreAPI;

// Connect to local emulators when running Playwright tests
// Playwright injects window.__FIREBASE_EMULATOR__ = true via addInitScript before page load
if (window.__FIREBASE_EMULATOR__) {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  console.log('🧪 Connected to Firebase Emulators');
} else {
  console.log('✅ Firebase initialized successfully');
}

// ─── Fast auth listener ────────────────────────────────────────────────────────
// Registered here — in the module script — so it fires as soon as Firebase Auth
// resolves the stored session, without waiting for the inline script's
// waitForFirebase() polling loop (which adds up to 100 ms + CDN load time).
//
// This listener ONLY handles immediate nav-bar UI updates (show/hide the
// sign-in link vs. the profile chip).  The full app-level onAuthStateChanged
// in index.html's inline script still runs for everything else (Firestore reads,
// team loading, etc.).
onAuthStateChanged(auth, (user) => {
  const loginLink       = document.getElementById('loginLink');
  const userProfileChip = document.getElementById('userProfileChip');
  const userDisplayName = document.getElementById('userDisplayName');
  const notifIcon       = document.getElementById('notificationsIcon');

  if (user) {
    if (loginLink)        loginLink.style.display        = 'none';
    if (userProfileChip)  userProfileChip.style.display  = 'block';
    if (userDisplayName)  userDisplayName.textContent    = user.displayName || user.email.split('@')[0];
    if (notifIcon)        notifIcon.style.display        = 'block';
  } else {
    if (loginLink)        loginLink.style.display        = 'block';
    if (userProfileChip)  userProfileChip.style.display  = 'none';
    if (notifIcon)        notifIcon.style.display        = 'none';
  }
});
