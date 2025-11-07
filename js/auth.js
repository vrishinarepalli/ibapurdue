/**
 * ============================================================================
 * AUTHENTICATION MODULE
 * ============================================================================
 *
 * This module handles all authentication-related functionality for the IBA
 * admin system, including:
 * - WebAuthn (Touch ID/Face ID) biometric authentication
 * - Email/password authentication
 * - Session management
 * - Admin mode state
 *
 * Security Features:
 * - Server-side verification of all WebAuthn operations
 * - Challenge-response authentication to prevent replay attacks
 * - Session tokens with expiration (24 hours)
 * - Hardware-bound credentials (Secure Enclave/TPM)
 *
 * Dependencies:
 * - Firebase Auth (window.auth, window.authImports)
 * - Firebase Functions (window.functions, window.functionsImports)
 * - utils.js for base64 encoding/decoding
 * ============================================================================
 */

import {
  arrayBufferToBase64url,
  base64ToArrayBuffer,
  base64urlToBase64
} from './utils.js';

// Admin UID constant - matches the authorized admin in Firebase Functions
const ADMIN_UID = 'seZ01FolJbSajEKTIsljwGtYHGD3';

// Admin mode state
let isAdminMode = false;

/**
 * ============================================================================
 * SESSION MANAGEMENT
 * ============================================================================
 */

/**
 * Check if there's an existing admin session and restore it
 * This is called on page load to maintain admin state across page refreshes
 *
 * Session tokens are stored in sessionStorage and expire after 24 hours.
 */
export function checkAdminSession() {
  const sessionToken = sessionStorage.getItem('adminSessionToken');
  const sessionExpiry = sessionStorage.getItem('adminSessionExpiry');

  if (sessionToken && sessionExpiry && Date.now() < parseInt(sessionExpiry)) {
    // Valid session exists - restore admin mode
    enableAdminMode();
    console.log('✅ Admin session restored');
  } else {
    // Clear expired session
    clearAdminSession();
  }
}

/**
 * Clear admin session data from sessionStorage
 */
export function clearAdminSession() {
  sessionStorage.removeItem('adminSessionToken');
  sessionStorage.removeItem('adminAuthMethod');
  sessionStorage.removeItem('adminSessionExpiry');
}

/**
 * Enable admin mode - shows admin UI elements
 */
export function enableAdminMode() {
  isAdminMode = true;
  document.body.classList.add('admin-mode');

  const adminBtn = document.getElementById('adminBtn');
  if (adminBtn) {
    adminBtn.textContent = 'Logout';
    adminBtn.style.background = 'var(--success)';
  }

  // Show admin UI elements
  document.querySelectorAll('thead th:last-child').forEach(th => th.style.display = '');

  const quickAddSection = document.querySelector('.quick-add-section');
  if (quickAddSection) quickAddSection.style.display = 'block';

  const bulkImportBtn = document.getElementById('bulkImportBracketBtn');
  if (bulkImportBtn) bulkImportBtn.style.display = 'block';
}

/**
 * Disable admin mode - hides admin UI elements and clears session
 */
export function disableAdminMode() {
  isAdminMode = false;
  document.body.classList.remove('admin-mode');

  const adminBtn = document.getElementById('adminBtn');
  if (adminBtn) {
    adminBtn.textContent = 'Admin';
    adminBtn.style.background = 'var(--brand)';
  }

  // Hide admin UI elements
  document.querySelectorAll('thead th:last-child').forEach(th => th.style.display = 'none');

  const quickAddSection = document.querySelector('.quick-add-section');
  if (quickAddSection) quickAddSection.style.display = 'none';

  const bulkImportBtn = document.getElementById('bulkImportBracketBtn');
  if (bulkImportBtn) bulkImportBtn.style.display = 'none';

  clearAdminSession();
  console.log('Admin logged out');
}

/**
 * Get current admin mode state
 * @returns {boolean} True if admin mode is enabled
 */
export function getAdminMode() {
  return isAdminMode;
}

/**
 * ============================================================================
 * WEBAUTHN REGISTRATION (Touch ID/Face ID Setup)
 * ============================================================================
 */

/**
 * Register a new WebAuthn credential (Touch ID/Face ID)
 *
 * This function:
 * 1. Verifies admin identity with email/password (one-time)
 * 2. Requests registration options from server
 * 3. Creates a credential using device biometrics
 * 4. Sends credential to server for verification and storage
 *
 * The private key never leaves the device's Secure Enclave/TPM.
 *
 * @returns {Promise<boolean>} True if registration successful
 * @throws {Error} If registration fails or is not supported
 */
export async function registerWebAuthn() {
  try {
    // Check if WebAuthn is supported
    if (!window.PublicKeyCredential) {
      throw new Error('WebAuthn is not supported on this device');
    }

    // Wait for Firebase to be ready
    if (!window.auth || !window.authImports || !window.functions) {
      throw new Error('Firebase not initialized. Please refresh and try again.');
    }

    const { signInWithEmailAndPassword } = window.authImports;

    // First authenticate with Firebase to prove identity
    // NOTE: For initial setup, you'll need to use the old email/password once
    const email = prompt('Enter your admin email for initial registration:');
    const password = prompt('Enter your admin password for initial registration:');

    if (!email || !password) {
      throw new Error('Email and password required for initial setup');
    }

    const userCredential = await signInWithEmailAndPassword(window.auth, email, password);
    const user = userCredential.user;

    // List of approved admin emails
    const APPROVED_ADMIN_EMAILS = [
      'ibapurdue@gmail.com',
      'vrishin123456789@gmail.com'
    ];

    if (!APPROVED_ADMIN_EMAILS.includes(user.email)) {
      await window.auth.signOut();
      throw new Error('You do not have admin privileges');
    }

    // Get registration options from server
    const { httpsCallable } = window.functionsImports;
    const generateRegOptions = httpsCallable(window.functions, 'generateRegistrationOptions');
    const optionsResponse = await generateRegOptions();
    const options = optionsResponse.data;

    // Convert challenge from base64url to Uint8Array
    const challengeArray = base64ToArrayBuffer(base64urlToBase64(options.challenge));

    // Convert excludeCredentials IDs from base64url to ArrayBuffer
    // This prevents registering the same credential multiple times
    const excludeCredentials = options.excludeCredentials?.map(cred => ({
      id: base64ToArrayBuffer(base64urlToBase64(cred.id)),
      type: cred.type,
      transports: cred.transports,
    })) || [];

    // Create credential options for browser
    const publicKeyCredentialCreationOptions = {
      challenge: challengeArray,
      rp: {
        name: options.rpName,
        id: options.rpID,
      },
      user: {
        id: Uint8Array.from(options.userID, c => c.charCodeAt(0)),
        name: options.userName,
        displayName: 'IBA Admin',
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },  // ES256 (Elliptic Curve)
        { alg: -257, type: 'public-key' } // RS256 (RSA)
      ],
      excludeCredentials: excludeCredentials,
      authenticatorSelection: options.authenticatorSelection,
      timeout: options.timeout,
      attestation: options.attestationType || 'none',
    };

    // Create credential with Touch ID/Face ID
    console.log('Creating WebAuthn credential...');
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions
    });

    // Prepare credential for server verification (use base64url format)
    const rawIdBase64url = arrayBufferToBase64url(credential.rawId);
    const credentialData = {
      id: rawIdBase64url, // Use the base64url encoding of rawId
      rawId: rawIdBase64url,
      type: credential.type,
      response: {
        clientDataJSON: arrayBufferToBase64url(credential.response.clientDataJSON),
        attestationObject: arrayBufferToBase64url(credential.response.attestationObject),
        transports: credential.response.getTransports ? credential.response.getTransports() : ['internal'],
      },
    };

    // Validate base64url format (should only contain: A-Z, a-z, 0-9, -, _)
    const isValidBase64url = /^[A-Za-z0-9\-_]+$/.test(credentialData.id);
    console.log('Sending credential data:', {
      id: credentialData.id.substring(0, 30) + '...',
      type: credentialData.type,
      isValidBase64url,
      length: credentialData.id.length
    });

    // Send to server for verification and storage
    const verifyReg = httpsCallable(window.functions, 'verifyRegistration');
    const verificationResponse = await verifyReg({ credential: credentialData });

    if (verificationResponse.data.verified) {
      console.log('✅ Biometric credential registered successfully on server');
      // Sign out from Firebase email/password auth
      await window.auth.signOut();
      return true;
    } else {
      throw new Error('Server verification failed');
    }
  } catch (error) {
    console.error('WebAuthn registration error:', error);
    throw error;
  }
}

/**
 * ============================================================================
 * WEBAUTHN AUTHENTICATION (Touch ID/Face ID Login)
 * ============================================================================
 */

/**
 * Authenticate using WebAuthn (Touch ID/Face ID)
 *
 * This function:
 * 1. Requests authentication challenge from server
 * 2. Prompts user for biometric authentication
 * 3. Device signs challenge with private key (never exposed)
 * 4. Sends signed challenge to server for verification
 * 5. Receives session token on success
 *
 * @returns {Promise<boolean>} True if authentication successful
 * @throws {Error} If authentication fails or is not supported
 */
export async function authenticateWebAuthn() {
  try {
    // Check if WebAuthn is supported
    if (!window.PublicKeyCredential) {
      throw new Error('WebAuthn is not supported on this device');
    }

    // Wait for Firebase to be ready
    if (!window.functions) {
      throw new Error('Firebase not initialized. Please refresh and try again.');
    }

    // Get authentication options from server
    const { httpsCallable } = window.functionsImports;
    const generateAuthOptions = httpsCallable(window.functions, 'generateAuthenticationOptions');
    const optionsResponse = await generateAuthOptions();
    const options = optionsResponse.data;

    // Convert challenge from base64url to Uint8Array
    const challengeArray = base64ToArrayBuffer(base64urlToBase64(options.challenge));

    // Convert allowCredentials IDs from base64url to ArrayBuffer
    const allowCredentials = options.allowCredentials.map(cred => ({
      id: base64ToArrayBuffer(base64urlToBase64(cred.id)),
      type: cred.type,
      transports: cred.transports,
    }));

    // Create authentication options for browser
    const publicKeyCredentialRequestOptions = {
      challenge: challengeArray,
      allowCredentials: allowCredentials,
      timeout: options.timeout,
      userVerification: options.userVerification,
      rpId: options.rpID,
    };

    // Get credential with Touch ID/Face ID
    console.log('Authenticating with biometrics...');
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions
    });

    // Prepare assertion for server verification (use base64url format for SimpleWebAuthn)
    const assertionData = {
      id: assertion.id,
      rawId: arrayBufferToBase64url(assertion.rawId),
      type: assertion.type,
      response: {
        clientDataJSON: arrayBufferToBase64url(assertion.response.clientDataJSON),
        authenticatorData: arrayBufferToBase64url(assertion.response.authenticatorData),
        signature: arrayBufferToBase64url(assertion.response.signature),
        userHandle: assertion.response.userHandle ? arrayBufferToBase64url(assertion.response.userHandle) : null,
      },
    };

    // Send to server for verification
    const verifyAuth = httpsCallable(window.functions, 'verifyAuthentication');
    const verificationResponse = await verifyAuth({ credential: assertionData });

    if (verificationResponse.data.verified) {
      console.log('✅ Biometric authentication verified by server');

      // Store session token for this session
      sessionStorage.setItem('adminSessionToken', verificationResponse.data.sessionToken);
      sessionStorage.setItem('adminAuthMethod', 'webauthn');
      sessionStorage.setItem('adminSessionExpiry', Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Note: For write operations, user will need to also be signed in with Firebase Auth
      // Check if user is already signed in with Firebase
      const APPROVED_ADMIN_EMAILS = [
        'ibapurdue@gmail.com',
        'vrishin123456789@gmail.com'
      ];
      if (!window.auth.currentUser || !APPROVED_ADMIN_EMAILS.includes(window.auth.currentUser.email)) {
        console.log('ℹ️ Note: You will need to sign in with email/password for write operations');
      }

      return true;
    } else {
      throw new Error('Server verification failed');
    }
  } catch (error) {
    console.error('WebAuthn authentication error:', error);
    throw error;
  }
}

/**
 * ============================================================================
 * EMAIL/PASSWORD AUTHENTICATION
 * ============================================================================
 */

/**
 * Authenticate using email and password
 *
 * @param {string} email - Admin email address
 * @param {string} password - Admin password
 * @returns {Promise<boolean>} True if authentication successful
 * @throws {Error} If authentication fails
 */
export async function authenticateEmailPassword(email, password) {
  try {
    if (!window.auth || !window.authImports) {
      throw new Error('Firebase not initialized. Please refresh and try again.');
    }

    const { signInWithEmailAndPassword } = window.authImports;

    const userCredential = await signInWithEmailAndPassword(window.auth, email, password);
    const user = userCredential.user;

    // List of approved admin emails
    const APPROVED_ADMIN_EMAILS = [
      'ibapurdue@gmail.com',
      'vrishin123456789@gmail.com'
    ];

    if (!APPROVED_ADMIN_EMAILS.includes(user.email)) {
      await window.auth.signOut();
      throw new Error('You do not have admin privileges');
    }

    // Store session info
    sessionStorage.setItem('adminAuthMethod', 'email');
    sessionStorage.setItem('adminSessionExpiry', Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    console.log('✅ Email/password authentication successful');
    return true;
  } catch (error) {
    console.error('Email/password authentication error:', error);
    throw error;
  }
}
