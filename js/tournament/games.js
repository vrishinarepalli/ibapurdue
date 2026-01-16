/**
 * Games Management Module
 *
 * Handles game/match scheduling operations:
 * - Loading games from Firestore
 * - Creating/editing/deleting games (admin only)
 * - Syncing games to team schedules
 * - Auto-cleanup of old games
 *
 * Firestore Collections Used:
 * - games: Individual game documents
 * - teams: Team documents with schedule arrays
 */

/**
 * Load all games from Firestore and display in schedule table.
 *
 * @returns {Promise<void>}
 *
 * Features:
 * - Groups games by day
 * - Sorts by time within each day
 * - Shows admin edit/delete buttons if in admin mode
 * - Applies any active filters
 */
export async function loadGames() {
  // Implementation in index.html inline script
}

/**
 * Open edit modal for a specific game.
 * Admin only.
 *
 * @param {HTMLElement} btn - Button element with game data attributes
 * @returns {void}
 */
export function editGame(btn) {
  // Implementation in index.html inline script
}

/**
 * Delete a game from the schedule.
 * Admin only. Removes game from teams' schedules.
 *
 * @param {HTMLElement} btn - Button element with game ID
 * @returns {Promise<void>}
 */
export async function deleteGame(btn) {
  // Implementation in index.html inline script
}

/**
 * Sync a game to both teams' schedule arrays.
 * Called when creating/editing games.
 *
 * @param {Object} gameData - Game data object
 * @param {string} gameId - Game document ID
 * @returns {Promise<void>}
 *
 * Game data includes:
 * - team1, team2: Team names
 * - day: Day of week
 * - time: Game time
 * - court: Court assignment
 */
export async function syncGameToTeams(gameData, gameId) {
  // Implementation in index.html inline script
}

/**
 * Remove a game from teams' schedule arrays.
 * Called when deleting games.
 *
 * @param {string} matchup - "Team1 vs Team2" string
 * @param {string} day - Day of week
 * @returns {Promise<void>}
 */
export async function removeGameFromTeams(matchup, day) {
  // Implementation in index.html inline script
}

/**
 * Automatically delete games older than today.
 * Called on page load to keep schedule current.
 *
 * @returns {Promise<void>}
 */
export async function cleanupOldGames() {
  // Implementation in index.html inline script
}
