# IBA Purdue Website Architecture

## Overview
Basketball tournament management website for IBA (Indian Basketball Association) at Purdue University. Built with vanilla JavaScript and Firebase backend, supporting both desktop and mobile interfaces.

---

## Directory Structure

```
ibapurdue/
├── index.html              # Desktop main page
├── mobile.html             # Mobile-optimized page (auto-redirects based on device)
├── login.html              # Authentication page
├── profile.html            # User profile page
├── inbox.html              # Notifications/messages inbox
├── teams.html              # Team management page
├── about.html              # About IBA page
│
├── style.css               # Main stylesheet (all pages)
│
├── js/                     # JavaScript modules
│   ├── app.js              # Application entry point
│   ├── config/
│   │   └── firebase.config.js   # Firebase initialization
│   ├── ui/
│   │   └── navigation.logic.js  # Navigation & animations
│   ├── utils/
│   │   ├── firebase-helpers.js  # Firebase utility functions
│   │   └── time.js              # Time conversion helpers
│   ├── auth/
│   │   └── google-auth.js       # Google Sign-In
│   ├── teams/
│   │   ├── team-management.js   # Team CRUD operations
│   │   ├── free-agency.js       # Free agent system
│   │   └── notifications.js     # Team notifications
│   ├── tournament/
│   │   ├── games.js             # Game management
│   │   ├── schedule.js          # Schedule filtering
│   │   ├── bracket.js           # Tournament bracket
│   │   └── teams-display.js     # Teams grid display
│   └── admin/
│       ├── admin-mode.js        # Admin mode toggle
│       └── admin-requests.js    # Admin request handling
│
├── functions/              # Firebase Cloud Functions
│   └── index.js            # Server-side functions
│
├── images/                 # Image assets
├── docs/                   # Documentation
│
├── firestore.rules         # Firestore security rules
├── firestore.indexes.json  # Firestore indexes
├── firebase.json           # Firebase configuration
└── deploy.sh               # Deployment script
```

---

## Module Reference

### Core Modules

#### `js/app.js` - Application Entry Point
Main orchestrator that initializes all modules after Firebase is ready.

#### `js/config/firebase.config.js` - Firebase Configuration
```javascript
// Initializes Firebase services
// Exports: window.db, window.auth, window.functions, window.firestoreImports
```

#### `js/ui/navigation.logic.js` - Navigation & UI
```javascript
initNavigation()     // Initialize GSAP animations, tab switching
toggleMenu()         // Hamburger menu toggle
switchTab(tabId)     // Switch between main tabs
```

---

### Utility Modules

#### `js/utils/firebase-helpers.js`
```javascript
waitForFirebase(callback)  // Wait for Firebase to initialize, then execute callback
```

#### `js/utils/time.js`
```javascript
convertTo24Hour(timeStr)   // Convert "2:30 PM" to "14:30" format
```

---

### Authentication Modules

#### `js/auth/google-auth.js`
```javascript
signInWithGoogle()         // Trigger Google Sign-In popup, create/update user in Firestore
```

---

### Team Modules

#### `js/teams/team-management.js`
```javascript
handleCreateTeam(event)              // Create new team (captain only)
loadUserTeam(user)                   // Load current user's team data
showAddPlayerForm(teamId)            // Show form to add player
hideAddPlayerForm()                  // Hide add player form
handleAddPlayer(event, teamId)       // Add player to team roster
removePlayer(teamId, playerIndex)    // Remove player from roster
deleteTeam(teamId, teamName)         // Delete entire team
switchTeamsTab(tab)                  // Switch teams sub-tabs
switchToTeamsTab(subtab)             // Navigate to teams tab
```

#### `js/teams/free-agency.js`
```javascript
loadFreeAgents()                     // Load free agents for current tournament
joinFreeAgency(formData)             // Register as free agent
sendTeamInvite(agentId, name, email) // Captain invites free agent
acceptTeamInvite(inviteId, teamId)   // Accept team invitation
rejectTeamInvite(inviteId)           // Decline team invitation
```

#### `js/teams/notifications.js`
```javascript
loadTeamNotifications(uid)           // Load pending join requests
showJoinRequests(teamId)             // Display join requests modal
acceptJoinRequest(requestId, teamId) // Approve join request
rejectJoinRequest(requestId)         // Deny join request
```

---

### Tournament Modules

#### `js/tournament/games.js`
```javascript
loadGames()                          // Fetch games from Firestore
editGame(btn)                        // Open edit game modal
deleteGame(btn)                      // Delete game
syncGameToTeams(gameData, gameId)    // Sync game to team schedules
removeGameFromTeams(matchup, day)    // Remove game from team schedules
cleanupOldGames()                    // Auto-delete past games
```

#### `js/tournament/schedule.js`
```javascript
applyFilters()                       // Apply day/team filters to schedule
```

#### `js/tournament/bracket.js`
```javascript
loadBracket()                        // Load tournament bracket from Firestore
renderPreviousBracket(rounds, el)    // Render bracket visualization
```

#### `js/tournament/teams-display.js`
```javascript
loadTeams()                          // Load all teams from Firestore
renderTeamsGrid()                    // Render teams as cards
openTeamModal(teamId)                // Open team detail modal
findTeamIdByName(teamName)           // Lookup team ID by name
```

---

### Admin Modules

#### `js/admin/admin-mode.js`
```javascript
isApprovedAdmin(email)               // Check if user is approved admin
checkAdminSession()                  // Verify admin session validity
adminLogout()                        // Disable admin mode
toggleAdminMode()                    // Toggle admin UI visibility
```

#### `js/admin/admin-requests.js`
```javascript
loadAdminRequests(filterStatus)      // Load admin access requests
approveAdminRequest(requestId)       // Approve admin request
rejectAdminRequest(requestId)        // Reject admin request
```

---

## Firebase Collections

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| `users` | User profiles | `email`, `displayName`, `teamId`, `roles[]` |
| `player_teams` | Team data | `teamName`, `captain`, `members[]`, `createdAt` |
| `team_requests` | Join requests | `teamId`, `userId`, `status`, `createdAt` |
| `freeAgents` | Free agent pool | `uid`, `email`, `playerName`, `tournament` |
| `teamInvites` | Team invitations | `teamId`, `captainUid`, `playerEmail`, `status` |
| `notifications` | User notifications | `userId`, `type`, `message`, `read` |
| `games` | Game schedule | `team1`, `team2`, `day`, `time`, `court` |
| `teams` | Tournament standings | `teamName`, `wins`, `losses`, `seed` |
| `approved_admins` | Admin whitelist | Document ID = user UID |
| `admin_requests` | Admin access requests | `email`, `status`, `requestedAt` |

---

## Authentication Flow

```
1. User clicks "Sign In with Google"
   └── signInWithGoogle() called

2. Google OAuth popup opens
   └── Firebase Auth handles OAuth flow

3. On success:
   ├── Check if user exists in Firestore
   │   ├── New user: Create user document with roles: ['user']
   │   └── Existing user: Update lastLogin timestamp
   │
   └── Redirect to index.html

4. Auth state listener (onAuthStateChanged) updates UI:
   ├── Show/hide login button
   ├── Display user avatar
   ├── Load user's team data
   └── Check admin status
```

---

## Data Flow

```
Page Load
    │
    ▼
Firebase Initializes (firebase.config.js)
    │
    ▼
waitForFirebase() callback executes
    │
    ├── initNavigation() - Setup UI
    │
    ├── onAuthStateChanged listener
    │   ├── If logged in:
    │   │   ├── loadUserTeam()
    │   │   ├── loadTeamNotifications()
    │   │   └── isApprovedAdmin() check
    │   └── If logged out:
    │       └── Show login button
    │
    ├── loadGames() - Fetch schedule
    │
    ├── loadTeams() - Fetch teams grid
    │
    └── loadBracket() - Fetch tournament bracket
```

---

## Mobile vs Desktop

The site auto-redirects based on device:

- **Desktop** (`index.html`): Full layout, hover effects
- **Mobile** (`mobile.html`): Touch-optimized, larger tap targets

Detection is done via User-Agent string at page load.

---

## Key CSS Classes

| Class | Purpose |
|-------|---------|
| `.card-nav` | Main navigation card component |
| `.tab-nav` | Tab navigation bar |
| `.panel` | Content panel for each tab |
| `.team-card` | Individual team display card |
| `.btn-gold` | Primary gold-colored button |
| `.admin-only` | Elements visible only in admin mode |
| `.notification-badge` | Notification count indicator |

---

## Environment Variables

Firebase configuration is in `js/config/firebase.config.js`:
- `apiKey` - Firebase API key
- `projectId` - `iba-website-63cb3`
- `authDomain` - `iba-website-63cb3.firebaseapp.com`

---

## Deployment

```bash
# Deploy to Firebase Hosting
firebase deploy --project iba-website-63cb3 --only hosting

# Deploy Firestore rules
firebase deploy --project iba-website-63cb3 --only firestore:rules

# Deploy Cloud Functions
firebase deploy --project iba-website-63cb3 --only functions
```
