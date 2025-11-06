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
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  getDoc,
  setDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import {
  getAuth,
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
  setDoc
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

console.log('✅ Firebase initialized successfully');
