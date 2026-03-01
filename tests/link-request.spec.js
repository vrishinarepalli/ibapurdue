/**
 * Player account linking flow tests
 *
 * Covers:
 *  1. Player without a team sees "Link to Team" section on profile page
 *  2. Player can search for a team and see the roster
 *  3. Player sends a link request → Firestore doc created, captain notified
 *  4. Player sees "Request Pending" state after sending
 *  5. Captain sees pending request in My Team panel
 *  6. Captain approves → player added to player_teams.members + user profile updated
 *  7. Captain denies → request marked denied, player notified
 *  8. Player can cancel a pending request
 */

const { test, expect } = require('@playwright/test');
const { createAuthUser, resetEmulator, seedTeam, adminDb } = require('./helpers/emulator');
const { gotoEmulator, signIn, openSignedIn } = require('./helpers/page');

const CAPTAIN_UID   = 'link-captain-uid';
const CAPTAIN_EMAIL = 'link-captain@test.com';
const CAPTAIN_NAME  = 'Coach Test';

const PLAYER_UID   = 'link-player-uid';
const PLAYER_EMAIL = 'link-player@test.com';
const PLAYER_NAME  = 'Test Player';

const TEAM_ID   = 'link-test-team';
const TEAM_NAME = 'Link Ballers';
const ROSTER    = ['Coach Test', 'Test Player', 'Other Guy'];

let captainToken, playerToken;

test.beforeEach(async () => {
  await resetEmulator();
  [captainToken, playerToken] = await Promise.all([
    createAuthUser(CAPTAIN_UID, CAPTAIN_EMAIL, CAPTAIN_NAME),
    createAuthUser(PLAYER_UID, PLAYER_EMAIL, PLAYER_NAME),
  ]);
  await seedTeam({
    teamId:       TEAM_ID,
    captainUid:   CAPTAIN_UID,
    captainEmail: CAPTAIN_EMAIL,
    captainName:  CAPTAIN_NAME,
    teamName:     TEAM_NAME,
    players:      ROSTER,
  });
});

// ─── Helper: seed a pending link request ─────────────────────────────────────
async function seedPendingRequest() {
  const ref = await adminDb().collection('team_link_requests').add({
    playerUid:         PLAYER_UID,
    playerEmail:       PLAYER_EMAIL,
    playerDisplayName: PLAYER_NAME,
    teamId:            TEAM_ID,
    teamName:          TEAM_NAME,
    rosterName:        PLAYER_NAME,
    captainUid:        CAPTAIN_UID,
    captainEmail:      CAPTAIN_EMAIL,
    status:            'pending',
    createdAt:         new Date().toISOString(),
    updatedAt:         new Date().toISOString(),
  });
  return ref;
}

// ─── Player-side tests ────────────────────────────────────────────────────────

test('player sees "Link to Team" section when they have no team', async ({ page }) => {
  // Sign in on index.html first, then navigate to profile.html
  await openSignedIn(page, '/profile.html', playerToken);

  await expect(page.locator('#linkToTeamSection')).toBeVisible({ timeout: 8_000 });
  await expect(page.locator('#linkToTeamSection')).toContainText('Link to Your Team');
});

test('player searches for team and sees full roster', async ({ page }) => {
  await openSignedIn(page, '/profile.html', playerToken);

  await expect(page.locator('#linkToTeamSection')).toBeVisible({ timeout: 8_000 });

  await page.fill('#teamNameSearch', TEAM_NAME);
  await page.click('button:has-text("Search")');

  for (const name of ROSTER) {
    await expect(page.locator(`#teamSearchResults button[data-player="${name}"]`))
      .toBeVisible({ timeout: 6_000 });
  }
});

test('player sends link request → Firestore doc created, pending state shown', async ({ page }) => {
  await openSignedIn(page, '/profile.html', playerToken);

  await expect(page.locator('#linkToTeamSection')).toBeVisible({ timeout: 8_000 });
  await page.fill('#teamNameSearch', TEAM_NAME);
  await page.click('button:has-text("Search")');

  await expect(page.locator(`button[data-player="${PLAYER_NAME}"]`))
    .toBeVisible({ timeout: 6_000 });

  page.once('dialog', d => d.accept());
  await page.click(`button[data-player="${PLAYER_NAME}"]`);

  // Profile section should update to show "Request Pending"
  await expect(page.locator('#linkToTeamContent')).toContainText('Request Pending', { timeout: 6_000 });
  await expect(page.locator('#linkToTeamContent')).toContainText(PLAYER_NAME);

  // Verify Firestore
  const snap = await adminDb()
    .collection('team_link_requests')
    .where('playerUid', '==', PLAYER_UID)
    .where('status', '==', 'pending')
    .get();
  expect(snap.size).toBe(1);
  expect(snap.docs[0].data().rosterName).toBe(PLAYER_NAME);
  expect(snap.docs[0].data().teamId).toBe(TEAM_ID);
});

test('player can cancel a pending link request', async ({ page }) => {
  const reqRef = await seedPendingRequest();

  await openSignedIn(page, '/profile.html', playerToken);

  await expect(page.locator('#linkToTeamContent')).toContainText('Request Pending', { timeout: 8_000 });

  page.once('dialog', d => d.accept());
  await page.click('button:has-text("Cancel Request")');

  // Should go back to the search form
  await expect(page.locator('#teamNameSearch')).toBeVisible({ timeout: 6_000 });

  const doc = await reqRef.get();
  expect(doc.data().status).toBe('cancelled');
});

// ─── Captain-side tests ───────────────────────────────────────────────────────

test('captain sees pending link request in My Team panel', async ({ page }) => {
  await seedPendingRequest();

  await gotoEmulator(page, '/index.html');
  await signIn(page, captainToken);
  await page.evaluate(() => window.switchToTeamsTab('create'));
  await page.waitForFunction(
    () => { const p = document.getElementById('teams-panel-create'); return p && p.style.display !== 'none'; },
    { timeout: 8_000 }
  );

  await expect(page.locator('#linkRequestsList')).toContainText(PLAYER_NAME, { timeout: 8_000 });
  await expect(page.locator('#linkRequestsList')).toContainText(PLAYER_EMAIL);
});

test('captain approves → player added to team, user profile updated, notification sent', async ({ page }) => {
  const reqRef = await seedPendingRequest();

  await gotoEmulator(page, '/index.html');
  await signIn(page, captainToken);
  await page.evaluate(() => window.switchToTeamsTab('create'));
  await page.waitForFunction(
    () => { const p = document.getElementById('teams-panel-create'); return p && p.style.display !== 'none'; },
    { timeout: 8_000 }
  );

  await expect(page.locator('#linkRequestsList button:has-text("Approve")')).toBeVisible({ timeout: 8_000 });
  await page.click('#linkRequestsList button:has-text("Approve")');

  await expect(page.locator('#linkRequestsList')).toContainText('No pending link requests', { timeout: 6_000 });

  // player_teams.members includes player UID
  const teamDoc = await adminDb().doc(`player_teams/${TEAM_ID}`).get();
  expect(teamDoc.data().members).toContain(PLAYER_UID);

  // Request marked approved
  const reqDoc = await reqRef.get();
  expect(reqDoc.data().status).toBe('approved');

  // Player's user profile has teamId set
  const userDoc = await adminDb().doc(`users/${PLAYER_UID}`).get();
  expect(userDoc.data()?.teamId).toBe(TEAM_ID);

  // Approval notification sent to player
  const notifSnap = await adminDb()
    .collection('notifications')
    .where('userId', '==', PLAYER_EMAIL)
    .where('type', '==', 'link_approved')
    .get();
  expect(notifSnap.size).toBe(1);
});

test('captain denies → request marked denied, player notified, member list unchanged', async ({ page }) => {
  const reqRef = await seedPendingRequest();

  await gotoEmulator(page, '/index.html');
  await signIn(page, captainToken);
  await page.evaluate(() => window.switchToTeamsTab('create'));
  await page.waitForFunction(
    () => { const p = document.getElementById('teams-panel-create'); return p && p.style.display !== 'none'; },
    { timeout: 8_000 }
  );

  await expect(page.locator('#linkRequestsList button:has-text("Deny")')).toBeVisible({ timeout: 8_000 });
  page.once('dialog', d => d.accept());
  await page.click('#linkRequestsList button:has-text("Deny")');

  await expect(page.locator('#linkRequestsList')).toContainText('No pending link requests', { timeout: 6_000 });

  // Request marked denied
  const reqDoc = await reqRef.get();
  expect(reqDoc.data().status).toBe('denied');

  // Player NOT added to team
  const teamDoc = await adminDb().doc(`player_teams/${TEAM_ID}`).get();
  expect(teamDoc.data().members).not.toContain(PLAYER_UID);

  // Denial notification sent
  const notifSnap = await adminDb()
    .collection('notifications')
    .where('userId', '==', PLAYER_EMAIL)
    .where('type', '==', 'link_denied')
    .get();
  expect(notifSnap.size).toBe(1);
});
