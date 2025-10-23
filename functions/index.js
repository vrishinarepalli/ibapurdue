const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const { isoBase64URL } = require('@simplewebauthn/server/helpers');

admin.initializeApp();
const db = admin.firestore();

// Configuration
const rpName = 'IBA Admin';
const rpID = 'iba-website-63cb3.web.app'; // Firebase hosting domain
const origin = 'https://iba-website-63cb3.web.app'; // Firebase hosting URL

/**
 * Generate registration options for new admin credential setup
 * Only callable by the authorized admin UID
 */
exports.generateRegistrationOptions = functions.https.onCall(async (data, context) => {
  // Verify the caller is authenticated and is the admin
  const ADMIN_UID = 'seZ01FolJbSajEKTIsljwGtYHGD3';

  if (!context.auth || context.auth.uid !== ADMIN_UID) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only the admin can register biometric credentials'
    );
  }

  try {
    // Check if admin already has credentials registered
    const adminDoc = await db.collection('admin').doc('biometric').get();
    const existingCredentials = adminDoc.exists ? adminDoc.data().credentials || [] : [];

    // Generate a random challenge
    const challenge = crypto.randomBytes(32).toString('base64url');

    // Store challenge temporarily for verification (expires in 5 minutes)
    await db.collection('admin').doc('pending_challenge').set({
      challenge,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 5 * 60 * 1000),
    });

    const options = {
      rpName,
      rpID,
      userID: ADMIN_UID,
      userName: 'admin@iba.purdue',
      challenge,
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Touch ID / Face ID
        requireResidentKey: false,
        userVerification: 'required',
      },
      excludeCredentials: existingCredentials.map(cred => ({
        id: cred.credentialID,
        type: 'public-key',
        transports: cred.transports || ['internal'],
      })),
      attestationType: 'none',
      timeout: 60000,
    };

    return options;
  } catch (error) {
    console.error('Error generating registration options:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate registration options');
  }
});

/**
 * Verify registration response and store the admin's public key
 */
exports.verifyRegistration = functions.https.onCall(async (data, context) => {
  const ADMIN_UID = 'seZ01FolJbSajEKTIsljwGtYHGD3';

  if (!context.auth || context.auth.uid !== ADMIN_UID) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only the admin can register biometric credentials'
    );
  }

  try {
    // Get the stored challenge
    const challengeDoc = await db.collection('admin').doc('pending_challenge').get();

    if (!challengeDoc.exists) {
      throw new functions.https.HttpsError('failed-precondition', 'No pending challenge found');
    }

    const { challenge, expiresAt } = challengeDoc.data();

    // Check if challenge has expired
    if (expiresAt.toMillis() < Date.now()) {
      await db.collection('admin').doc('pending_challenge').delete();
      throw new functions.https.HttpsError('deadline-exceeded', 'Challenge has expired');
    }

    // Verify the registration response
    // The credential from client is already in the correct format for @simplewebauthn
    const verification = await verifyRegistrationResponse({
      response: data.credential,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });

    if (!verification.verified) {
      throw new functions.https.HttpsError('invalid-argument', 'Registration verification failed');
    }

    // Store the credential
    const { registrationInfo } = verification;
    const newCredential = {
      credentialID: Buffer.from(registrationInfo.credentialID).toString('base64'),
      credentialPublicKey: Buffer.from(registrationInfo.credentialPublicKey).toString('base64'),
      counter: registrationInfo.counter,
      credentialDeviceType: registrationInfo.credentialDeviceType,
      credentialBackedUp: registrationInfo.credentialBackedUp,
      transports: data.credential.response.transports || ['internal'],
      registeredAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Get existing credentials
    const adminDoc = await db.collection('admin').doc('biometric').get();
    const existingCredentials = adminDoc.exists ? adminDoc.data().credentials || [] : [];

    // Add new credential
    await db.collection('admin').doc('biometric').set({
      credentials: [...existingCredentials, newCredential],
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Clean up challenge
    await db.collection('admin').doc('pending_challenge').delete();

    return { verified: true, message: 'Biometric credential registered successfully' };
  } catch (error) {
    console.error('Error verifying registration:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to verify registration');
  }
});

/**
 * Generate authentication options for admin login
 * This is public but doesn't reveal sensitive information
 */
exports.generateAuthenticationOptions = functions.https.onCall(async (data, context) => {
  try {
    // Get stored credentials
    const adminDoc = await db.collection('admin').doc('biometric').get();

    if (!adminDoc.exists || !adminDoc.data().credentials?.length) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'No biometric credentials registered. Please register first.'
      );
    }

    const credentials = adminDoc.data().credentials;

    // Generate a random challenge
    const challenge = crypto.randomBytes(32).toString('base64url');

    // Store challenge temporarily (expires in 5 minutes)
    await db.collection('auth_challenges').add({
      challenge,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 5 * 60 * 1000),
    });

    const options = {
      challenge,
      timeout: 60000,
      rpID,
      allowCredentials: credentials.map(cred => ({
        id: cred.credentialID,
        type: 'public-key',
        transports: cred.transports || ['internal'],
      })),
      userVerification: 'required',
    };

    return options;
  } catch (error) {
    console.error('Error generating authentication options:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to generate authentication options');
  }
});

/**
 * Verify authentication response and issue admin session token
 */
exports.verifyAuthentication = functions.https.onCall(async (data, context) => {
  try {
    const { credential } = data;

    // Find and validate the challenge
    const challengesSnapshot = await db.collection('auth_challenges')
      .where('challenge', '==', credential.response.clientDataJSON.challenge)
      .where('expiresAt', '>', admin.firestore.Timestamp.now())
      .limit(1)
      .get();

    if (challengesSnapshot.empty) {
      throw new functions.https.HttpsError('failed-precondition', 'Invalid or expired challenge');
    }

    const challengeDoc = challengesSnapshot.docs[0];
    const { challenge } = challengeDoc.data();

    // Get the stored credential
    const adminDoc = await db.collection('admin').doc('biometric').get();
    if (!adminDoc.exists) {
      throw new functions.https.HttpsError('failed-precondition', 'No credentials found');
    }

    const credentials = adminDoc.data().credentials;
    const credentialID = credential.id;

    const matchedCredential = credentials.find(
      cred => cred.credentialID === credentialID
    );

    if (!matchedCredential) {
      throw new functions.https.HttpsError('permission-denied', 'Credential not found');
    }

    // Verify the authentication response
    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: Buffer.from(matchedCredential.credentialID, 'base64'),
        credentialPublicKey: Buffer.from(matchedCredential.credentialPublicKey, 'base64'),
        counter: matchedCredential.counter,
        transports: matchedCredential.transports,
      },
      requireUserVerification: true,
    });

    if (!verification.verified) {
      throw new functions.https.HttpsError('permission-denied', 'Authentication verification failed');
    }

    // Update counter
    const credentialIndex = credentials.findIndex(cred => cred.credentialID === credentialID);
    credentials[credentialIndex].counter = verification.authenticationInfo.newCounter;
    await db.collection('admin').doc('biometric').update({ credentials });

    // Clean up challenge
    await challengeDoc.ref.delete();

    // Create a custom token for the admin
    const ADMIN_UID = 'seZ01FolJbSajEKTIsljwGtYHGD3';
    const customToken = await admin.auth().createCustomToken(ADMIN_UID, {
      adminAuthenticated: true,
      authMethod: 'webauthn',
      authenticatedAt: Date.now(),
    });

    return {
      verified: true,
      customToken,
      message: 'Authentication successful',
    };
  } catch (error) {
    console.error('Error verifying authentication:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to verify authentication');
  }
});

/**
 * Check if user has admin privileges (helper function)
 */
exports.checkAdminStatus = functions.https.onCall(async (data, context) => {
  const ADMIN_UID = 'seZ01FolJbSajEKTIsljwGtYHGD3';

  if (!context.auth) {
    return { isAdmin: false };
  }

  // Check if user is authenticated via WebAuthn custom token
  const isAdmin = context.auth.uid === ADMIN_UID &&
                  context.auth.token?.adminAuthenticated === true;

  return {
    isAdmin,
    uid: context.auth.uid,
    authMethod: context.auth.token?.authMethod || 'unknown',
  };
});
