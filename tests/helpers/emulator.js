/**
 * Emulator helpers for Playwright tests.
 *
 * Uses:
 *  - Firebase Admin SDK (pointing at local emulators) for Firestore seeding
 *  - Auth Emulator REST API for creating users with specific UIDs
 *
 * Prerequisites: Firebase emulators must be running (`npm run emulator`)
 */

const PROJECT_ID = 'iba-website-63cb3';
const AUTH_EMULATOR = 'http://localhost:9099';
const FIRESTORE_EMULATOR = 'localhost:8080';

// Point Admin SDK to emulators BEFORE requiring firebase-admin
process.env.FIRESTORE_EMULATOR_HOST = FIRESTORE_EMULATOR;
process.env.FIREBASE_AUTH_EMULATOR_HOST = AUTH_EMULATOR.replace('http://', '');

const admin = require('firebase-admin');

let _adminApp;
function adminApp() {
  if (!_adminApp) {
    _adminApp = admin.initializeApp({ projectId: PROJECT_ID }, 'test-' + Date.now());
  }
  return _adminApp;
}

function adminDb() {
  return admin.firestore(adminApp());
}

// ─── Auth helpers ──────────────────────────────────────────────────────────────

/**
 * Create a user in the Auth emulator with a specific UID.
 * Deletes the user first if it already exists.
 */
async function createAuthUser(uid, email, displayName, password = 'TestPass123!') {
  // Delete existing user if present
  try {
    await admin.auth(adminApp()).deleteUser(uid);
  } catch (_) { /* doesn't exist yet */ }

  await admin.auth(adminApp()).createUser({
    uid,
    email,
    displayName,
    emailVerified: true,
    password,
  });

  // Return a custom token so tests can sign in via signInWithCustomToken
  return admin.auth(adminApp()).createCustomToken(uid);
}

/**
 * Clear all Auth users from the emulator.
 */
async function clearAuthUsers() {
  const url = `${AUTH_EMULATOR}/emulator/v1/projects/${PROJECT_ID}/accounts`;
  await fetch(url, { method: 'DELETE' });
}

// ─── Firestore helpers ────────────────────────────────────────────────────────

/**
 * Delete every document in the given collections.
 */
async function clearCollections(...collections) {
  const db = adminDb();
  for (const col of collections) {
    const snap = await db.collection(col).get();
    if (snap.empty) continue;
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
}

/**
 * Full reset — clears all test-relevant Firestore collections and Auth users.
 */
async function resetEmulator() {
  await Promise.all([
    clearCollections(
      'teams', 'player_teams', 'users',
      'team_link_requests', 'tournament_entries',
      'notifications', 'freeAgents', 'teamInvites'
    ),
    clearAuthUsers(),
  ]);
}

/**
 * Seed a team into both `teams` and `player_teams`.
 * Also creates the captain's user doc.
 */
async function seedTeam({ teamId, captainUid, captainEmail, captainName, teamName, players = [] }) {
  const db = adminDb();
  const now = new Date().toISOString();

  await Promise.all([
    db.doc(`teams/${teamId}`).set({
      teamName,
      captainUid,
      captainEmail,
      captainName,
      players,
      tournament: 'spring-2026',
      status: 'active',
      createdAt: now,
    }),
    db.doc(`player_teams/${teamId}`).set({
      teamName,
      captain: captainUid,
      captainEmail,
      captainName,
      members: [captainUid],
      tournament: 'spring-2026',
      status: 'active',
      createdAt: now,
    }),
    db.doc(`users/${captainUid}`).set({
      uid: captainUid,
      email: captainEmail,
      displayName: captainName,
      teamId,
      teamName,
      isCaptain: true,
    }, { merge: true }),
  ]);
}

/**
 * Create a user doc in Firestore (no team).
 */
async function seedUser({ uid, email, displayName }) {
  await adminDb().doc(`users/${uid}`).set({
    uid,
    email,
    displayName,
    teamId: null,
    isCaptain: false,
  }, { merge: true });
}

module.exports = {
  createAuthUser,
  clearAuthUsers,
  clearCollections,
  resetEmulator,
  seedTeam,
  seedUser,
  adminDb,
};
