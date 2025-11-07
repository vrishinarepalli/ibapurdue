/**
 * ============================================================================
 * TOURNAMENT DATA MODULE
 * ============================================================================
 *
 * Handles loading and displaying tournament data:
 * - Games schedule
 * - Teams list
 * - Bracket visualization
 */

export function initializeTournamentData() {
  console.log('📊 Initializing tournament data module');

  const { collection, getDocs, onSnapshot } = window.firestoreImports;
  const db = window.db;

  let allGames = [];
  let allTeams = [];
  let bracketData = {};

  /**
   * Load games from Firestore
   */
  async function loadGames() {
    try {
      console.log('📥 Loading games from Firestore...');
      const gamesCol = collection(db, 'games');
      const gamesSnapshot = await getDocs(gamesCol);
      allGames = gamesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log(`📊 Loaded ${allGames.length} games from database`);
      displayGames(allGames);
    } catch (error) {
      console.error('❌ Error loading games:', error);
    }
  }

  /**
   * Display games in the table
   */
  function displayGames(games) {
    const tbody = document.querySelector('#gamesTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    games.forEach(game => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td data-label="Date">${game.date || 'TBD'}</td>
        <td data-label="Time">${game.time || 'TBD'}</td>
        <td data-label="Team 1">${game.team1 || 'TBD'}</td>
        <td data-label="Team 2">${game.team2 || 'TBD'}</td>
        <td data-label="Court">${game.court || 'TBD'}</td>
        <td data-label="Round">${game.round || 'TBD'}</td>
        <td data-label="Status">
          <span class="status-badge status-${(game.status || 'scheduled').toLowerCase()}">
            ${game.status || 'Scheduled'}
          </span>
        </td>
        <td class="admin-mode" style="display: none;">
          <button class="icon-btn edit-game-btn" data-id="${game.id}" title="Edit game">✏️</button>
          <button class="icon-btn delete-game-btn" data-id="${game.id}" title="Delete game">🗑️</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  /**
   * Load teams from Firestore
   */
  async function loadTeams() {
    try {
      console.log('📥 Loading teams from Firestore...');
      const teamsCol = collection(db, 'teams');
      const teamsSnapshot = await getDocs(teamsCol);
      allTeams = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log(`📊 Loaded ${allTeams.length} teams from database`);
      displayTeams(allTeams);
    } catch (error) {
      console.error('❌ Error loading teams:', error);
    }
  }

  /**
   * Display teams in the grid
   */
  function displayTeams(teams) {
    const grid = document.getElementById('teamsGrid');
    if (!grid) return;

    grid.innerHTML = '';

    teams.forEach(team => {
      const card = document.createElement('div');
      card.className = 'team-card';
      card.innerHTML = `
        <div class="team-icon">${team.icon || '🏀'}</div>
        <div class="team-name">${team.name || 'Unknown Team'}</div>
        <div class="team-record">${team.wins || 0}-${team.losses || 0}</div>
        <div class="admin-mode team-actions" style="display: none;">
          <button class="icon-btn edit-team-btn" data-id="${team.id}" title="Edit team">✏️</button>
          <button class="icon-btn delete-team-btn" data-id="${team.id}" title="Delete team">🗑️</button>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  /**
   * Load bracket from Firestore
   */
  async function loadBracket() {
    try {
      console.log('📥 Loading bracket from Firestore...');
      const { doc, getDoc } = window.firestoreImports;
      const bracketDoc = await getDoc(doc(db, 'bracket', 'current'));
      if (bracketDoc.exists()) {
        bracketData = bracketDoc.data();
        console.log('📊 Loaded bracket data from database');
        displayBracket(bracketData);
      }
    } catch (error) {
      console.error('❌ Error loading bracket:', error);
    }
  }

  /**
   * Display bracket visualization
   */
  function displayBracket(data) {
    // Bracket display logic here
    console.log('🏆 Displaying bracket with data:', data);
  }

  // Initialize
  loadGames();
  loadTeams();
  loadBracket();

  // Export for use by other modules
  window.tournamentData = {
    allGames,
    allTeams,
    bracketData,
    loadGames,
    loadTeams,
    loadBracket,
    displayGames,
    displayTeams
  };
}
