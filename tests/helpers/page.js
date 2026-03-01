/**
 * Playwright page helpers — sign-in, navigation, and common assertions.
 */

const FIREBASE_AUTH_SDK = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

/**
 * Set the emulator flag and navigate to a page.
 * addInitScript persists across all navigations on the same page object.
 */
async function gotoEmulator(page, path) {
  await page.addInitScript(() => {
    window.__FIREBASE_EMULATOR__ = true;
  });
  await page.goto(path);
  // Wait for Firebase globals to be ready
  await page.waitForFunction(() => !!(window.db && window.firestoreImports), { timeout: 10_000 });
}

/**
 * Sign in using a Firebase custom token (issued by Admin SDK).
 */
async function signIn(page, customToken) {
  await page.evaluate(
    async ({ token, sdk }) => {
      const { signInWithCustomToken } = await import(sdk);
      await signInWithCustomToken(window.auth, token);
      await new Promise(resolve => {
        const unsub = window.auth.onAuthStateChanged(user => {
          if (user) { unsub(); resolve(); }
        });
      });
    },
    { token: customToken, sdk: FIREBASE_AUTH_SDK }
  );
}

/**
 * Open index.html, sign in, then navigate to target path.
 *
 * Strategy for pages (like profile.html) that redirect unauthenticated users:
 *  1. Sign in on index.html — session written to localStorage
 *  2. Extract the Firebase auth token from localStorage
 *  3. Before navigating to target, inject the token back into localStorage via
 *     addInitScript so it's present BEFORE any page script runs
 *  4. Navigate to target — Firebase Auth finds the session on first read, fires
 *     onAuthStateChanged with user, no redirect occurs
 */
async function openSignedIn(page, targetPath, customToken) {
  // Sign in on index.html
  await gotoEmulator(page, '/index.html');
  await signIn(page, customToken);

  if (targetPath === '/index.html') return;

  // Extract the Firebase auth session from localStorage
  const authEntry = await page.evaluate(() => {
    const key = Object.keys(localStorage).find(k => k.startsWith('firebase:authUser'));
    return key ? { key, value: localStorage.getItem(key) } : null;
  });

  // Inject the auth session into localStorage BEFORE profile.html runs any scripts.
  // addInitScript runs before all page scripts (including module scripts), so Firebase
  // Auth will find the stored session on its very first localStorage read and fire
  // onAuthStateChanged with the user — no redirect.
  if (authEntry) {
    await page.addInitScript(({ key, value }) => {
      window.__FIREBASE_EMULATOR__ = true;
      localStorage.setItem(key, value);
    }, authEntry);
  }

  await page.goto(targetPath);
  await page.waitForFunction(
    () => !!(window.db && window.auth && window.firestoreImports),
    { timeout: 10_000 }
  );

  // Wait for profile page to finish loading (loadProfile sets #profileEmail)
  if (targetPath.includes('profile')) {
    await page.waitForFunction(
      () => {
        const el = document.getElementById('profileEmail');
        return el && el.textContent && el.textContent.includes('@');
      },
      { timeout: 15_000 }
    );
  }
}

module.exports = { gotoEmulator, signIn, openSignedIn };
