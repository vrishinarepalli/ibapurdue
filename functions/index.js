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
const rpID = 'ibapurdue.online'; // Custom domain
const origin = ['https://ibapurdue.online', 'https://iba-website-63cb3.web.app']; // Support both domains

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
    console.log('Registration request received:', {
      hasCredential: !!data.credential,
      credentialId: data.credential?.id?.substring(0, 20),
    });

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
      credentialID: Buffer.from(registrationInfo.credentialID).toString('base64url'),
      credentialPublicKey: Buffer.from(registrationInfo.credentialPublicKey).toString('base64url'),
      counter: registrationInfo.counter,
      credentialDeviceType: registrationInfo.credentialDeviceType,
      credentialBackedUp: registrationInfo.credentialBackedUp,
      transports: data.credential.response.transports || ['internal'],
      registeredAt: admin.firestore.Timestamp.now(),
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

    console.log('Received credential ID:', credential.id);
    console.log('Credential ID type:', typeof credential.id);
    console.log('Credential ID length:', credential.id?.length);

    // Parse the clientDataJSON to extract the challenge
    const clientDataJSON = JSON.parse(
      Buffer.from(credential.response.clientDataJSON, 'base64url').toString('utf-8')
    );
    const challengeFromClient = clientDataJSON.challenge;

    // Find and validate the challenge
    const challengesSnapshot = await db.collection('auth_challenges')
      .where('challenge', '==', challengeFromClient)
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

    console.log('Stored credential IDs:', credentials.map(c => c.credentialID));

    const matchedCredential = credentials.find(
      cred => cred.credentialID === credentialID
    );

    if (!matchedCredential) {
      console.error('Credential not found. Looking for:', credentialID);
      console.error('Available credentials:', credentials.map(c => ({ id: c.credentialID, idLength: c.credentialID.length })));
      throw new functions.https.HttpsError('permission-denied', 'Credential not found');
    }

    console.log('Matched credential ID:', matchedCredential.credentialID);

    // Verify the authentication response
    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: Buffer.from(matchedCredential.credentialID, 'base64url'),
        credentialPublicKey: Buffer.from(matchedCredential.credentialPublicKey, 'base64url'),
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

    // Create a session token for the admin
    const sessionToken = crypto.randomBytes(32).toString('base64url');
    const ADMIN_UID = 'seZ01FolJbSajEKTIsljwGtYHGD3';

    // Store session token in Firestore
    await db.collection('admin_sessions').add({
      sessionToken,
      uid: ADMIN_UID,
      authMethod: 'webauthn',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    return {
      verified: true,
      sessionToken,
      uid: ADMIN_UID,
      message: 'Authentication successful',
    };
  } catch (error) {
    console.error('Error verifying authentication:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to verify authentication');
  }
});

/**
 * Validate session token and allow signin
 */
exports.validateSessionToken = functions.https.onCall(async (data, context) => {
  try {
    const { sessionToken } = data;

    if (!sessionToken) {
      throw new functions.https.HttpsError('invalid-argument', 'Session token is required');
    }

    // Find the session token in Firestore
    const sessionsSnapshot = await db.collection('admin_sessions')
      .where('sessionToken', '==', sessionToken)
      .where('expiresAt', '>', admin.firestore.Timestamp.now())
      .limit(1)
      .get();

    if (sessionsSnapshot.empty) {
      throw new functions.https.HttpsError('permission-denied', 'Invalid or expired session token');
    }

    const sessionDoc = sessionsSnapshot.docs[0];
    const sessionData = sessionDoc.data();

    // Delete the used session token (one-time use)
    await sessionDoc.ref.delete();

    return {
      valid: true,
      uid: sessionData.uid,
      authMethod: sessionData.authMethod,
    };
  } catch (error) {
    console.error('Error validating session token:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to validate session token');
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
