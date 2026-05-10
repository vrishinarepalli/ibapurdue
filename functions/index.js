const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Anthropic = require('@anthropic-ai/sdk');
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
 * Helper function to check if user is an approved admin
 * Checks Firestore approved_admins collection - NO HARDCODED EMAILS
 */
async function isAdmin(uid) {
  try {
    // Server-side env fallback — prevents lockout if approved_admins is empty
    if (process.env.MAIN_ADMIN_UID && uid === process.env.MAIN_ADMIN_UID) {
      return true;
    }

    // Check approved_admins by UID (doc ID)
    const adminDocByUid = await db.collection('approved_admins').doc(uid).get();
    if (adminDocByUid.exists) {
      return true;
    }

    // Also check by email field (legacy entries)
    const userRecord = await admin.auth().getUser(uid);
    const userEmail = userRecord.email;
    const approvedAdminsSnapshot = await db.collection('approved_admins')
      .where('email', '==', userEmail)
      .get();

    if (!approvedAdminsSnapshot.empty) {
      return true;
    }

    // Also check admin_requests collection for approved requests
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
 * One-time bootstrap: seeds the main admin's approved_admins doc from env var.
 * Safe to run repeatedly — idempotent. Callable only by the env-configured admin.
 */
exports.ensureMainAdmin = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in required');
  }
  const envUid = process.env.MAIN_ADMIN_UID;
  if (!envUid || context.auth.uid !== envUid) {
    throw new functions.https.HttpsError('permission-denied', 'Not authorized');
  }
  const userRecord = await admin.auth().getUser(context.auth.uid);
  await db.collection('approved_admins').doc(context.auth.uid).set({
    email: userRecord.email,
    addedAt: admin.firestore.FieldValue.serverTimestamp(),
    bootstrapped: true,
  }, { merge: true });
  return { success: true };
});

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
 * Claude AI Assistant
 * Secure proxy that calls the Anthropic Claude API server-side so the API key
 * is never exposed to the browser.
 *
 * Rate limits (per authenticated user):
 *   - Max 5 requests per hour
 *   - Max 20 requests per day
 *
 * Setup: firebase functions:config:set anthropic.api_key="sk-ant-..."
 */
exports.claudeAssistant = functions.https.onCall(async (data, context) => {
  // Require authentication — prevents anonymous abuse
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be signed in to use the AI assistant.'
    );
  }

  const { message } = data;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Message is required');
  }

  // ── Rate limiting ──────────────────────────────────────────────────────────
  const HOURLY_LIMIT = 5;
  const DAILY_LIMIT  = 20;
  const uid          = context.auth.uid;
  const now          = Date.now();
  const oneHourAgo   = now - 60 * 60 * 1000;
  const oneDayAgo    = now - 24 * 60 * 60 * 1000;
  const rateLimitRef = db.collection('rate_limits').doc(uid);

  try {
    const rateLimitDoc = await rateLimitRef.get();
    const requests = rateLimitDoc.exists ? (rateLimitDoc.data().requests || []) : [];

    // Keep only requests within the last 24 hours
    const recent = requests.filter(ts => ts > oneDayAgo);

    const hourlyCount = recent.filter(ts => ts > oneHourAgo).length;
    const dailyCount  = recent.length;

    if (hourlyCount >= HOURLY_LIMIT) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        `Hourly limit reached (${HOURLY_LIMIT} requests/hour). Please try again later.`
      );
    }
    if (dailyCount >= DAILY_LIMIT) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        `Daily limit reached (${DAILY_LIMIT} requests/day). Please try again tomorrow.`
      );
    }

    // Record this request
    await rateLimitRef.set({ requests: [...recent, now] });
  } catch (error) {
    // Re-throw rate limit errors, log anything else
    if (error.code === 'functions/resource-exhausted') throw error;
    console.error('Rate limit check error:', error);
  }
  // ──────────────────────────────────────────────────────────────────────────

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Claude API key not configured.'
    );
  }

  try {
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: `You are the IBA Assistant — a helpful AI for the Indian Basketball Association at Purdue University, a student-run intramural basketball league. Help users with:
- Tournament schedules, game times, and court locations
- Team info, rosters, standings, and the bracket (Gold Division and other brackets)
- How to register a team as captain or join an existing team as a player
- Fair play policies and rules (note: deliberately losing to manipulate bracket seeding leads to disqualification)
- Payment info ($150 prize for each division champion)
- General basketball and tournament FAQs
Be concise, friendly, and encouraging. For live/real-time data (today's scores, current standings), tell users to check the Schedule or Bracket tabs on the site.`,
      messages: [{ role: 'user', content: message.trim() }]
    });

    return { reply: response.content[0].text };
  } catch (error) {
    console.error('Claude API error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get AI response');
  }
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

// ─── Send Game Day Emails ────────────────────────────────────────────────────
// Callable function: admin picks a date, writes subject/body, sends to all
// captain emails for teams playing that day.
// Requires Gmail app password set via:
//   firebase functions:secrets:set GMAIL_APP_PASSWORD
exports.sendGameDayEmails = functions.https.onCall(async (data, context) => {
  // Admin check
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be signed in.');
  const adminCheck = await isAdmin(context.auth.uid);
  if (!adminCheck) throw new functions.https.HttpsError('permission-denied', 'Admins only.');

  const { date, subject, body, recipients } = data;
  if (!date || !subject || !body || !Array.isArray(recipients) || recipients.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing date, subject, body, or recipients.');
  }

  const gmailPassword = functions.config().gmail && functions.config().gmail.app_password;
  if (!gmailPassword) {
    throw new functions.https.HttpsError('failed-precondition', 'Gmail app password not configured. Run: firebase functions:config:set gmail.app_password="YOUR_APP_PASSWORD"');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'ibapurdue@gmail.com',
      pass: gmailPassword,
    },
  });

  const results = { sent: [], failed: [] };

  for (const email of recipients) {
    try {
      await transporter.sendMail({
        from: '"IBA Purdue" <ibapurdue@gmail.com>',
        to: email,
        subject,
        text: body,
        html: body.replace(/\n/g, '<br>'),
      });
      results.sent.push(email);
    } catch (err) {
      console.error(`Failed to send to ${email}:`, err.message);
      results.failed.push(email);
    }
  }

  // Log to Firestore for record keeping
  await db.collection('email_logs').add({
    date,
    subject,
    sentTo: results.sent,
    failedTo: results.failed,
    sentAt: admin.firestore.FieldValue.serverTimestamp(),
    sentBy: context.auth.uid,
  });

  return results;
});

// ─── GroupMe Reschedule Automation ───────────────────────────────────────────

const GROUPME_API = "https://api.groupme.com/v3";

async function gmPost(path, body) {
  const token = process.env.GROUPME_ACCESS_TOKEN;
  if (!token) throw new Error("GROUPME_ACCESS_TOKEN not set");
  const res = await fetch(`${GROUPME_API}${path}?token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (res.status < 200 || res.status >= 300) throw new Error(`GroupMe ${path} error: ${JSON.stringify(json)}`);
  return json.response;
}

async function gmGet(path) {
  const token = process.env.GROUPME_ACCESS_TOKEN;
  if (!token) throw new Error("GROUPME_ACCESS_TOKEN not set");
  const res = await fetch(`${GROUPME_API}${path}?token=${token}`);
  const json = await res.json();
  if (res.status < 200 || res.status >= 300) throw new Error(`GroupMe GET ${path} error: ${JSON.stringify(json)}`);
  return json.response;
}

async function sendFallbackEmail(to, subject, body) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (!gmailUser || !gmailPass) {
    console.warn("Email fallback skipped — GMAIL_USER/GMAIL_APP_PASSWORD not set");
    return;
  }
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });
  await transporter.sendMail({ from: gmailUser, to, subject, text: body, html: body.replace(/\n/g, "<br>") });
}

/**
 * Firestore trigger: when a rescheduleRequest is created, build the GroupMe group.
 * Runs automatically — no need to call this from the frontend.
 */
exports.onRescheduleRequestCreated = functions.firestore
  .document("rescheduleRequests/{requestId}")
  .onCreate(async (snap, context) => {
    const requestId = context.params.requestId;
    const req = snap.data();

    // Bail if already processed (shouldn't happen on onCreate, but safety check)
    if (req.status !== "pending") return;

    try {
      // 1. Get the game
      const gameDoc = await db.collection("games").doc(req.gameId).get();
      if (!gameDoc.exists) throw new Error(`Game ${req.gameId} not found`);
      const game = gameDoc.data();

      // 2. Parse team names from matchup (e.g. "Team A vs Team B")
      const parts = (game.matchup || `${req.matchup || ""}`).split(/\s+vs\.?\s+/i);
      const team1Name = (parts[0] || "").trim();
      const team2Name = (parts[1] || "").trim();

      // 3. Look up both teams
      const teamsSnap = await db.collection("teams").get();
      let team1Doc = null, team2Doc = null;
      teamsSnap.forEach(d => {
        const data = d.data();
        const name = data.teamName || data.name || "";
        if (name.toLowerCase() === team1Name.toLowerCase()) team1Doc = { id: d.id, ...data };
        if (name.toLowerCase() === team2Name.toLowerCase()) team2Doc = { id: d.id, ...data };
      });

      if (!team1Doc || !team2Doc) throw new Error(`Could not find both teams: "${team1Name}", "${team2Name}"`);

      const cap1Phone = team1Doc.captainPhone || "";
      const cap2Phone = team2Doc.captainPhone || "";
      const cap1Email = team1Doc.captainEmail || "";
      const cap2Email = team2Doc.captainEmail || "";
      const cap1Name = team1Doc.captainName || team1Doc.captain || "Captain";
      const cap2Name = team2Doc.captainName || team2Doc.captain || "Captain";

      // 4. Create GroupMe group
      const groupName = `IBA Reschedule: ${team1Name} vs ${team2Name}`;
      const group = await gmPost("/groups", {
        name: groupName,
        description: `Reschedule coordination for IBA game. Original: ${req.originalDate} at ${req.originalTime}, ${req.originalCourt}.`,
        share: true,
      });
      const groupId = group.id;
      const shareUrl = group.share_url || null;

      // 5. Add both captains by phone number (GroupMe SMS-invites non-members automatically)
      const membersToAdd = [];
      if (cap1Phone) membersToAdd.push({ nickname: `${cap1Name} (${team1Name})`, phone_number: cap1Phone });
      if (cap2Phone) membersToAdd.push({ nickname: `${cap2Name} (${team2Name})`, phone_number: cap2Phone });

      let membersAdded = [];
      let inviteFallbackUsed = false;

      if (membersToAdd.length > 0) {
        try {
          await gmPost(`/groups/${groupId}/members/add`, { members: membersToAdd });
          membersAdded = membersToAdd.map(m => m.phone_number);
        } catch (err) {
          console.warn("Members add failed, falling back to invite link:", err.message);
          inviteFallbackUsed = true;
        }
      } else {
        inviteFallbackUsed = true;
      }

      // 6. Create a bot for the IBA admin
      const bot = await gmPost("/bots", {
        bot: {
          name: "IBA Admin",
          group_id: groupId,
          avatar_url: "https://ibapurdue.online/images/iba-logo.png",
        },
      });
      const botId = bot.bot_id;

      // 7. Bot posts opening message
      const openingMsg = [
        `🏀 IBA RESCHEDULE REQUEST`,
        ``,
        `Game: ${team1Name} vs ${team2Name}`,
        `Original date: ${req.originalDate}`,
        `Original time: ${req.originalTime}`,
        `Court: ${req.originalCourt}`,
        ``,
        `Reason: ${req.reason}`,
        ``,
        `Both captains: please agree on a new date and time in this chat. Reply with your proposed time and an admin will confirm.`,
        ``,
        `⚠️ Admin approval is required before any reschedule is official.`,
      ].join("\n");

      await fetch(`${GROUPME_API}/bots/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_id: botId, text: openingMsg }),
      });

      // 8. If fallback needed — send invite link via email
      if (inviteFallbackUsed && shareUrl) {
        const fallbackBody = [
          `Hi,`,
          ``,
          `A reschedule has been requested for your IBA game: ${team1Name} vs ${team2Name}.`,
          `Original time: ${req.originalDate} at ${req.originalTime}, ${req.originalCourt}.`,
          ``,
          `Join the GroupMe coordination chat here: ${shareUrl}`,
          ``,
          `Both captains need to agree on a new time. Admin approval is required.`,
          ``,
          `— IBA Admin`,
        ].join("\n");

        const emailTargets = [cap1Email, cap2Email].filter(Boolean);
        for (const email of emailTargets) {
          try {
            await sendFallbackEmail(email, `IBA Reschedule: ${team1Name} vs ${team2Name}`, fallbackBody);
          } catch (err) {
            console.warn(`Email to ${email} failed:`, err.message);
          }
        }
      }

      // 9. Write groupMeChats doc
      await db.collection("groupMeChats").add({
        requestId,
        gameId: req.gameId,
        groupMeGroupId: groupId,
        groupMeBotId: botId,
        shareUrl,
        membersAdded,
        inviteFallbackUsed,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: "active",
      });

      // 10. Update the request doc
      await db.collection("rescheduleRequests").doc(requestId).update({
        status: "chat_created",
        groupMeChatId: groupId,
        groupMeShareUrl: shareUrl,
        groupMeBotId: botId,
      });

      console.log(`Reschedule group created: ${groupId} for request ${requestId}`);

    } catch (err) {
      console.error("onRescheduleRequestCreated failed:", err.message);
      // Mark as failed so admin can see it
      await db.collection("rescheduleRequests").doc(requestId).update({
        status: "chat_failed",
        chatError: err.message,
      }).catch(() => {});
    }
  });

/**
 * HTTP endpoint for GroupMe bot callbacks.
 * GroupMe posts here whenever someone sends a message in the reschedule group.
 * Parses "NEW TIME: <date> <time>" from captain messages and saves proposed time.
 */
exports.groupMeWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") { res.status(405).send("Method Not Allowed"); return; }

  try {
    const { group_id, sender_type, text } = req.body;
    // Ignore bot's own messages
    if (sender_type === "bot") { res.status(200).send("ok"); return; }
    if (!text || !group_id) { res.status(200).send("ok"); return; }

    // Look for "NEW TIME: ..." in the message
    const match = text.match(/new\s+time[:\s]+(.+)/i);
    if (!match) { res.status(200).send("ok"); return; }

    const proposedText = match[1].trim();

    // Find the active reschedule request for this GroupMe group
    const snap = await db.collection("rescheduleRequests")
      .where("groupMeChatId", "==", group_id)
      .where("status", "in", ["chat_created", "proposed"])
      .limit(1)
      .get();

    if (snap.empty) { res.status(200).send("ok"); return; }

    const reqDoc = snap.docs[0];
    await reqDoc.ref.update({
      status: "proposed",
      proposedTimeRaw: proposedText,
    });

    // Bot acknowledges
    const botId = reqDoc.data().groupMeBotId;
    if (botId) {
      await fetch(`${GROUPME_API}/bots/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bot_id: botId,
          text: `✅ Proposed time recorded: "${proposedText}"\nAn IBA admin will review and confirm shortly.`,
        }),
      });
    }

    res.status(200).send("ok");
  } catch (err) {
    console.error("groupMeWebhook error:", err);
    res.status(200).send("ok"); // Always 200 to GroupMe to prevent retries
  }
});
