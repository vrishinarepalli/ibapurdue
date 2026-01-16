/**
 * Free Agency Module
 *
 * Manages the free agent system where players without teams can:
 * - Register as free agents
 * - Receive team invitations
 * - Accept/decline invitations
 *
 * And team captains can:
 * - View available free agents
 * - Send team invitations
 *
 * Firestore Collections Used:
 * - freeAgents: Free agent profiles
 * - teamInvites: Pending invitations
 * - notifications: Invite notifications
 */

/**
 * Load all active free agents for the current tournament.
 *
 * @returns {Promise<void>}
 *
 * Displays:
 * - Free agent cards with player info
 * - "Invite" button for team captains
 * - "Join Free Agency" form for users without teams
 */
export async function loadFreeAgents() {
  // Implementation in index.html inline script
}

/**
 * Register current user as a free agent.
 *
 * @param {Object} formData - Free agent registration form data
 * @returns {Promise<void>}
 *
 * Required fields:
 * - playerName: Display name
 * - email: Contact email
 * - tournament: Which tournament (e.g., 'spring-2026')
 *
 * Optional fields:
 * - instagram: Instagram handle
 * - groupme: GroupMe link
 * - notes: Additional notes
 */
export async function joinFreeAgency(formData) {
  // Implementation in index.html inline script
}

/**
 * Send team invitation to a free agent.
 * Only team captains can send invitations.
 *
 * @param {string} agentId - Free agent document ID
 * @param {string} playerName - Player's display name
 * @param {string} playerEmail - Player's email
 * @returns {Promise<void>}
 *
 * Creates:
 * - teamInvites document with pending status
 * - notifications document for the player
 */
export async function sendTeamInvite(agentId, playerName, playerEmail) {
  // Implementation in index.html inline script
}

/**
 * Accept a team invitation.
 * Adds user to team and removes from free agency.
 *
 * @param {string} inviteId - Invite document ID
 * @param {string} teamId - Team to join
 * @param {string} teamName - Team name for display
 * @returns {Promise<void>}
 *
 * Flow:
 * 1. Add user to team's members array
 * 2. Update user's teamId in users collection
 * 3. Delete free agent document
 * 4. Update invite status to 'accepted'
 * 5. Notify team captain
 */
export async function acceptTeamInvite(inviteId, teamId, teamName) {
  // Implementation in index.html/inbox.html inline script
}

/**
 * Decline a team invitation.
 *
 * @param {string} inviteId - Invite document ID
 * @param {string} teamName - Team name for confirmation
 * @returns {Promise<void>}
 */
export async function rejectTeamInvite(inviteId, teamName) {
  // Implementation in index.html/inbox.html inline script
}
