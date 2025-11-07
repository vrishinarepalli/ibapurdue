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

// List of approved admin emails (core admins)
const APPROVED_ADMIN_EMAILS = [
  'ibapurdue@gmail.com',
  'vrishin123456789@gmail.com'
];

/**
 * Helper function to check if user is an approved admin
 */
async function isAdmin(uid) {
  try {
    // Get user's email from their UID
    const userRecord = await admin.auth().getUser(uid);
    const userEmail = userRecord.email;

    // Check if user's email is in the approved admin list
    if (APPROVED_ADMIN_EMAILS.includes(userEmail)) {
      return true;
    }

    // Also check if user has an approved admin request
    const requestDoc = await db.collection('admin_requests').doc(uid).get();
    if (requestDoc.exists && requestDoc.data().status === 'approved') {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Generate registration options for new admin credential setup
 * Callable by main admin or any approved admin
 */
exports.generateRegistrationOptions = functions.https.onCall(async (data, context) => {
  // Verify the caller is authenticated and is an admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const userIsAdmin = await isAdmin(context.auth.uid);
  if (!userIsAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can register biometric credentials'
    );
  }

  try {
    const currentUserUid = context.auth.uid;
    console.log('Registration request received:', {
      uid: currentUserUid,
      hasCredential: !!data.credential,
      credentialId: data.credential?.id?.substring(0, 20),
    });

    // Check if this admin already has credentials registered
    const adminDoc = await db.collection('admin').doc('biometric').get();
    const allCredentials = adminDoc.exists ? adminDoc.data().credentials || [] : [];

    // Filter to only this admin's credentials
    const userCredentials = allCredentials.filter(cred => cred.adminUid === currentUserUid);

    // Generate a random challenge
    const challenge = crypto.randomBytes(32).toString('base64url');

    // Store challenge temporarily for verification (expires in 5 minutes)
    // Store with user UID to prevent cross-admin attacks
    await db.collection('admin').doc(`pending_challenge_${currentUserUid}`).set({
      challenge,
      adminUid: currentUserUid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 5 * 60 * 1000),
    });

    const options = {
      rpName,
      rpID,
      userID: currentUserUid,
      userName: context.auth.token.email || 'admin@iba.purdue',
      challenge,
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Touch ID / Face ID
        requireResidentKey: false,
        userVerification: 'required',
      },
      excludeCredentials: userCredentials.map(cred => ({
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
  // Verify the caller is authenticated and is an admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const userIsAdmin = await isAdmin(context.auth.uid);
  if (!userIsAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can register biometric credentials'
    );
  }

  try {
    const currentUserUid = context.auth.uid;

    // Get the stored challenge for this user
    const challengeDoc = await db.collection('admin').doc(`pending_challenge_${currentUserUid}`).get();

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

    // Store the credential with admin UID
    const { registrationInfo } = verification;
    const newCredential = {
      credentialID: Buffer.from(registrationInfo.credentialID).toString('base64url'),
      credentialPublicKey: Buffer.from(registrationInfo.credentialPublicKey).toString('base64url'),
      counter: registrationInfo.counter,
      credentialDeviceType: registrationInfo.credentialDeviceType,
      credentialBackedUp: registrationInfo.credentialBackedUp,
      transports: data.credential.response.transports || ['internal'],
      adminUid: currentUserUid, // Store which admin owns this credential
      adminEmail: context.auth.token.email || 'unknown',
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
    await db.collection('admin').doc(`pending_challenge_${currentUserUid}`).delete();

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
    console.log('Credential belongs to admin UID:', matchedCredential.adminUid);

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

    // Get the admin UID from the matched credential
    const authenticatedAdminUid = matchedCredential.adminUid;

    // Verify this admin is still authorized (check if main admin or in approved_admins)
    const isAuthorized = await isAdmin(authenticatedAdminUid);
    if (!isAuthorized) {
      throw new functions.https.HttpsError('permission-denied', 'Admin access has been revoked');
    }

    // Create a session token for the authenticated admin
    const sessionToken = crypto.randomBytes(32).toString('base64url');

    // Store session token in Firestore
    await db.collection('admin_sessions').add({
      sessionToken,
      uid: authenticatedAdminUid,
      email: matchedCredential.adminEmail || 'unknown',
      authMethod: 'webauthn',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    return {
      verified: true,
      sessionToken,
      uid: authenticatedAdminUid,
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
  if (!context.auth) {
    return { isAdmin: false };
  }

  // Check if user's email is in the approved admin list
  const userIsAdmin = await isAdmin(context.auth.uid);

  return {
    isAdmin: userIsAdmin,
    uid: context.auth.uid,
    authMethod: context.auth.token?.authMethod || 'unknown',
  };
});

/**
 * Scheduled Firestore Export
 * Automatically exports Firestore data to Cloud Storage
 * Scheduled to run daily at 2 AM UTC via Cloud Scheduler
 */
exports.scheduledFirestoreExport = functions.https.onRequest(async (req, res) => {
  const projectId = process.env.GCLOUD_PROJECT;
  const databaseName = 'projects/' + projectId + '/databases/(default)';

  // Get current date for folder naming
  const date = new Date();
  const timestamp = date.toISOString().split('T')[0]; // YYYY-MM-DD format

  // Cloud Storage bucket and folder
  const bucket = 'gs://' + projectId + '.appspot.com/firestore-backups/' + timestamp;

  const client = new admin.firestore.v1.FirestoreAdminClient();

  try {
    console.log(`Starting Firestore export to ${bucket}...`);

    const [response] = await client.exportDocuments({
      name: databaseName,
      outputUriPrefix: bucket,
      // Export all collections
      collectionIds: []
    });

    console.log(`Export operation started: ${response.name}`);

    res.status(200).send({
      success: true,
      message: 'Firestore export initiated successfully',
      operation: response.name,
      exportLocation: bucket,
      timestamp: date.toISOString()
    });
  } catch (error) {
    console.error('Error exporting Firestore:', error);
    res.status(500).send({
      success: false,
      error: error.message
    });
  }
});
