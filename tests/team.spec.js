/**
 * Team creation and management tests
 *
 * Covers:
 *  1. Captain creates a team → written to both `teams` and `player_teams`
 *  2. After creation, tab label changes to "My Team"
 *  3. My Team panel shows correct team name and roster
 *  4. Captain can add a fourth player (roster under max)
 *  5. "+ Add Player" hidden when roster is full (4 players)
 */

const { test, expect } = require('@playwright/test');
const { createAuthUser, resetEmulator, seedTeam, adminDb } = require('./helpers/emulator');
const { gotoEmulator, signIn } = require('./helpers/page');

const CAPTAIN_UID   = 'team-captain-uid';
const CAPTAIN_EMAIL = 'team-captain@test.com';
const CAPTAIN_NAME  = 'Team Captain';

let captainToken;

test.beforeEach(async () => {
  await resetEmulator();
  captainToken = await createAuthUser(CAPTAIN_UID, CAPTAIN_EMAIL, CAPTAIN_NAME);
});

// ─── Navigate to the Create Team / My Team subtab ────────────────────────────
async function openCreateTeamTab(page) {
  // .tablist is CSS display:none; navigate via JS
  await page.evaluate(() => window.switchToTeamsTab('create'));
  // Wait for either the create form or the My Team panel
  await page.waitForFunction(
    () => {
      const panel = document.getElementById('teams-panel-create');
      return panel && panel.style.display !== 'none';
    },
    { timeout: 8_000 }
  );
}

// ─── Fill the create-team form ────────────────────────────────────────────────
async function fillCreateTeamForm(page, teamName = 'New Ballers') {
  await page.fill('#teamName', teamName);
  // captainEmail is readonly and auto-filled from auth — skip
  // Players use name= attributes, not id= attributes
  await page.fill('[name="player1"]', CAPTAIN_NAME);
  await page.fill('[name="player2"]', 'Player Two');
  await page.fill('[name="player3"]', 'Player Three');
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test('captain creates a team — written to teams and player_teams', async ({ page }) => {
  await gotoEmulator(page, '/index.html');
  await signIn(page, captainToken);
  await openCreateTeamTab(page);

  // Create form should be visible
  await page.waitForSelector('#teamName', { state: 'visible', timeout: 6_000 });
  await fillCreateTeamForm(page, 'Test Squad');

  page.once('dialog', d => d.accept());
  await page.click('#createTeamForm button[type="submit"]');
  await page.waitForTimeout(2_500);

  // `teams` collection
  const teamsSnap = await adminDb().collection('teams').where('teamName', '==', 'Test Squad').get();
  expect(teamsSnap.size).toBe(1);
  const teamId = teamsSnap.docs[0].id;
  expect(teamsSnap.docs[0].data().captainUid).toBe(CAPTAIN_UID);
  expect(teamsSnap.docs[0].data().players).toContain(CAPTAIN_NAME);

  // `player_teams` — same doc ID as `teams`
  const ptDoc = await adminDb().doc(`player_teams/${teamId}`).get();
  expect(ptDoc.exists).toBe(true);
  expect(ptDoc.data().captain).toBe(CAPTAIN_UID);
  expect(ptDoc.data().members).toContain(CAPTAIN_UID);
});

test('after team creation, tab label changes to "My Team"', async ({ page }) => {
  await gotoEmulator(page, '/index.html');
  await signIn(page, captainToken);
  await openCreateTeamTab(page);

  await page.waitForSelector('#teamName', { state: 'visible', timeout: 6_000 });
  await fillCreateTeamForm(page, 'Renamed Ballers');

  page.once('dialog', d => d.accept());
  await page.click('#createTeamForm button[type="submit"]');

  await expect(page.locator('#teams-subtab-create')).toHaveText('My Team', { timeout: 8_000 });
});

test('My Team panel shows correct team info for existing captain', async ({ page }) => {
  await seedTeam({
    teamId:       'my-team-id',
    captainUid:   CAPTAIN_UID,
    captainEmail: CAPTAIN_EMAIL,
    captainName:  CAPTAIN_NAME,
    teamName:     'Pre-Seeded Team',
    players:      [CAPTAIN_NAME, 'Player A', 'Player B'],
  });

  await gotoEmulator(page, '/index.html');
  await signIn(page, captainToken);
  await openCreateTeamTab(page);

  await expect(page.locator('#displayTeamName')).toHaveText('Pre-Seeded Team', { timeout: 8_000 });
  await expect(page.locator('#playersList')).toContainText('Player A');
  await expect(page.locator('#playersList')).toContainText('Player B');
});

test('captain can add a fourth player to the roster', async ({ page }) => {
  await seedTeam({
    teamId:       'addplayer-team',
    captainUid:   CAPTAIN_UID,
    captainEmail: CAPTAIN_EMAIL,
    captainName:  CAPTAIN_NAME,
    teamName:     'Add Player Test',
    players:      [CAPTAIN_NAME, 'Player A', 'Player B'],
  });

  await gotoEmulator(page, '/index.html');
  await signIn(page, captainToken);
  await openCreateTeamTab(page);

  await expect(page.locator('#playersList')).toContainText('Player A', { timeout: 8_000 });

  await page.click('button:has-text("+ Add Player")');
  await page.fill('#newPlayerName', 'Player D');
  await page.click('#addPlayerForm button[type="submit"]');

  await expect(page.locator('#playersList')).toContainText('Player D', { timeout: 6_000 });

  const teamDoc = await adminDb().doc('teams/addplayer-team').get();
  expect(teamDoc.data().players).toContain('Player D');
  expect(teamDoc.data().players.length).toBe(4);
});

test('+ Add Player hidden when roster is at max (4 players)', async ({ page }) => {
  await seedTeam({
    teamId:       'full-team',
    captainUid:   CAPTAIN_UID,
    captainEmail: CAPTAIN_EMAIL,
    captainName:  CAPTAIN_NAME,
    teamName:     'Full Team',
    players:      [CAPTAIN_NAME, 'Player A', 'Player B', 'Player C'],
  });

  await gotoEmulator(page, '/index.html');
  await signIn(page, captainToken);
  await openCreateTeamTab(page);

  await expect(page.locator('#playersList')).toContainText('Player C', { timeout: 8_000 });
  await expect(page.locator('button:has-text("+ Add Player")')).not.toBeVisible();
});
