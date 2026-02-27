/**
 * File: firebase.config.js
 * Purpose: Firebase initialization and configuration
 * Scope: Initialize Firebase app, auth, firestore, functions. Expose globally for other modules.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, connectFirestoreEmulator, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, getDoc, setDoc, query, where, deleteField, arrayUnion } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword, signOut, onAuthStateChanged, signInWithCustomToken, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js';

const firebaseConfig = {
  apiKey: "AIzaSyBN0rfpzjredziJbPny-YfEgq4uE2l1hzE",
  authDomain: "iba-website-63cb3.firebaseapp.com",
  projectId: "iba-website-63cb3",
  storageBucket: "iba-website-63cb3.firebasestorage.app",
  messagingSenderId: "267064036667",
  appId: "1:267064036667:web:4f9d28aac0d5ae4ca97b1e",
  measurementId: "G-GGH99DCY07"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const functions = getFunctions(app);

// Admin UID - only this user can access admin functions
const ADMIN_UID = 'seZ01FolJbSajEKTIsljwGtYHGD3';

// Set auth persistence to LOCAL so users stay signed in
setPersistence(auth, browserLocalPersistence).then(() => {
  console.log('✅ Auth persistence set to LOCAL');
}).catch((error) => {
  console.error('❌ Failed to set persistence:', error);
});

// Connect to local emulators when running Playwright tests
// Playwright injects window.__FIREBASE_EMULATOR__ = true via addInitScript before page load
if (window.__FIREBASE_EMULATOR__) {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  console.log('🧪 Connected to Firebase Emulators');
}

// Export Firebase instances and imports for global access
export function initializeFirebase() {
  // Make Firebase available globally for legacy code compatibility
  window.db = db;
  window.auth = auth;
  window.functions = functions;
  window.ADMIN_UID = ADMIN_UID;
  window.firestoreImports = { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, getDoc, setDoc, query, where, deleteField, arrayUnion };
  window.authImports = { signInWithEmailAndPassword, signOut, onAuthStateChanged, signInWithCustomToken, setPersistence, browserLocalPersistence };
  window.functionsImports = { httpsCallable };

  console.log('🔥 Firebase initialized');
}

// Export for module usage
export { db, auth, functions, ADMIN_UID };
export { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, getDoc, setDoc, query, where, deleteField };
export { signInWithEmailAndPassword, signOut, onAuthStateChanged, signInWithCustomToken };
export { httpsCallable };
