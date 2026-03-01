/**
 * Tournament entry form tests
 *
 * Covers:
 *  1. Unauthenticated user cannot submit (sign-in alert fires)
 *  2. Authenticated user can submit → doc created at tournament_entries/{uid}
 *  3. Duplicate submission blocked — status card shown instead of form
 *  4. Edit updates the doc, archives old data to history subcollection
 *  5. Withdraw sets status to 'withdrawn'
 */

const { test, expect } = require('@playwright/test');
const { createAuthUser, resetEmulator, adminDb } = require('./helpers/emulator');
const { gotoEmulator, signIn, openSignedIn } = require('./helpers/page');

const PLAYER_UID   = 'tournament-player-uid';
const PLAYER_EMAIL = 'tournament-player@test.com';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Activate the signup/tournament tab so the tournament form is visible. */
async function openCurrentSeasonTab(page) {
  // #springTournamentForm lives in #panel-signup, NOT #panel-current.
  // #tab-signup is inside .tablist (CSS display:none) but the click event listener
  // registered by navigation.logic.js is still active — call .click() via evaluate.
  await page.evaluate(() => document.getElementById('tab-signup').click());
  await page.waitForFunction(
    () => {
      const panel = document.getElementById('panel-signup');
      return panel && panel.classList.contains('active');
    },
    { timeout: 8_000 }
  );
}

/** Fill the tournament registration form. */
async function fillTournamentForm(page, overrides = {}) {
  const data = {
    teamName:     'Test Squad',
    captainName:  'Test Captain',
    captainEmail: PLAYER_EMAIL,
    player1:      'Player One',
    player2:      'Player Two',
    player3:      'Player Three',
    ...overrides,
  };

  await page.fill('#tournamentTeamName',    data.teamName);
  await page.fill('#tournamentCaptainName', data.captainName);
  await page.fill('#tournamentCaptainEmail',data.captainEmail);
  await page.fill('#tournamentPlayer1',     data.player1);
  await page.fill('#tournamentPlayer2',     data.player2);
  if (data.player3) await page.fill('#tournamentPlayer3', data.player3);
}

// ─── Setup ────────────────────────────────────────────────────────────────────

let playerToken;

test.beforeEach(async () => {
  await resetEmulator();
  playerToken = await createAuthUser(PLAYER_UID, PLAYER_EMAIL, 'Test Captain');
});

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Tournament registration — unauthenticated', () => {
  test('submit shows sign-in prompt and creates no Firestore doc', async ({ page }) => {
    await gotoEmulator(page, '/index.html');
    await openCurrentSeasonTab(page);

    // Wait for form to be visible (no status card since not signed in)
    await page.waitForSelector('#tournamentTeamName', { state: 'visible', timeout: 6_000 });
    await fillTournamentForm(page);

    let dialogSeen = false;
    page.once('dialog', d => { dialogSeen = true; d.accept(); });
    await page.click('#submitTournamentBtn');

    await page.waitForTimeout(1_000);
    expect(dialogSeen).toBe(true);

    const snap = await adminDb().collection('tournament_entries').get();
    expect(snap.empty).toBe(true);
  });
});

test.describe('Tournament registration — authenticated', () => {
  test('submits and creates doc at tournament_entries/{uid}', async ({ page }) => {
    await gotoEmulator(page, '/index.html');
    await signIn(page, playerToken);
    await openCurrentSeasonTab(page);

    // After sign-in, loadUserTournamentSubmission runs — wait for it to settle
    await page.waitForFunction(
      () => document.getElementById('tournamentEntryForm')?.style.display !== 'none' ||
            document.getElementById('userSubmissionStatus')?.style.display !== 'none',
      { timeout: 8_000 }
    );

    // If status card is shown (shouldn't be on fresh emulator), skip
    const statusVisible = await page.locator('#userSubmissionStatus').isVisible();
    if (!statusVisible) {
      await fillTournamentForm(page);
      page.once('dialog', d => d.accept());
      await page.click('#submitTournamentBtn');
      await page.waitForTimeout(2_000);
    }

    const docSnap = await adminDb().doc(`tournament_entries/${PLAYER_UID}`).get();
    expect(docSnap.exists).toBe(true);
    expect(docSnap.data().status).toBe('pending');
    expect(docSnap.data().teamName).toBe('Test Squad');
    expect(docSnap.data().userId).toBe(PLAYER_UID);
    expect(docSnap.data().editCount).toBe(0);
  });

  test('duplicate submission blocked — status card shown', async ({ page }) => {
    await adminDb().doc(`tournament_entries/${PLAYER_UID}`).set({
      userId:    PLAYER_UID,
      status:    'pending',
      teamName:  'Existing Team',
      editCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await gotoEmulator(page, '/index.html');
    await signIn(page, playerToken);
    await openCurrentSeasonTab(page);

    // Status card should appear; form should be hidden
    await expect(page.locator('#userSubmissionStatus')).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('#tournamentEntryForm')).not.toBeVisible();
  });

  test('edit updates doc and archives old data to history subcollection', async ({ page }) => {
    await adminDb().doc(`tournament_entries/${PLAYER_UID}`).set({
      userId:      PLAYER_UID,
      status:      'pending',
      captainName: 'Old Captain',
      teamName:    'Old Team',
      editCount:   0,
      createdAt:   new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
    });

    await gotoEmulator(page, '/index.html');
    await signIn(page, playerToken);
    await openCurrentSeasonTab(page);

    await expect(page.locator('#userSubmissionStatus')).toBeVisible({ timeout: 8_000 });

    // Click Edit
    await page.click('#editSubmissionBtn');
    await page.waitForSelector('#tournamentTeamName', { state: 'visible' });

    // Update team name
    await page.fill('#tournamentTeamName', 'Updated Team');

    page.once('dialog', d => d.accept());
    await page.click('#submitTournamentBtn');
    await page.waitForTimeout(2_000);

    const docSnap = await adminDb().doc(`tournament_entries/${PLAYER_UID}`).get();
    expect(docSnap.data().teamName).toBe('Updated Team');
    expect(docSnap.data().editCount).toBe(1);

    const historySnap = await adminDb()
      .collection(`tournament_entries/${PLAYER_UID}/history`)
      .get();
    expect(historySnap.size).toBe(1);
    expect(historySnap.docs[0].data().teamName).toBe('Old Team');
  });

  test('withdraw sets status to withdrawn', async ({ page }) => {
    await adminDb().doc(`tournament_entries/${PLAYER_UID}`).set({
      userId:    PLAYER_UID,
      status:    'pending',
      teamName:  'My Team',
      editCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await gotoEmulator(page, '/index.html');
    await signIn(page, playerToken);
    await openCurrentSeasonTab(page);

    await expect(page.locator('#userSubmissionStatus')).toBeVisible({ timeout: 8_000 });

    page.once('dialog', d => d.accept());
    await page.click('#withdrawSubmissionBtn');
    await page.waitForTimeout(1_500);

    const docSnap = await adminDb().doc(`tournament_entries/${PLAYER_UID}`).get();
    expect(docSnap.data().status).toBe('withdrawn');
  });
});
