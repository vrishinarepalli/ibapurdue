// IBA Firebase Data Loader
// Replaces static data.jsx — loads live data from Firestore

window.IBA_DATA = {
  TEAMS: [],
  GAMES: [],
  BRACKET_ROUNDS: [],
  ANNOUNCEMENTS: [],
  STANDINGS_LEADERS: [],
  loading: true,
};

window._ibaDataListeners = [];
function notifyDataChanged() {
  window._ibaDataListeners.forEach(fn => fn());
}

function buildBracketRounds(games, teams) {
  const findTeam = (name) => (teams || []).find(t => t.name === name);
  const roundOrder = ["Round of 16", "R32", "Quarterfinal", "Semifinal", "Final"];
  const labelMap = { "R32": "Round of 16" };

  const grouped = {};
  (games || []).forEach(g => {
    const label = labelMap[g.round] || g.round || "Round of 16";
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(g);
  });

  const orderedLabels = roundOrder
    .map(r => labelMap[r] || r)
    .filter((v, i, a) => a.indexOf(v) === i)
    .filter(label => grouped[label]);

  return orderedLabels.map(label => ({
    label,
    matches: (grouped[label] || []).map(g => ({
      id: g.id,
      a: {
        name: g.team1 || "TBD",
        score: (g.score1 !== undefined && g.score1 !== null && g.score1 !== "") ? Number(g.score1) : null,
        seed: findTeam(g.team1)?.seed || null,
      },
      b: {
        name: g.team2 || "TBD",
        score: (g.score2 !== undefined && g.score2 !== null && g.score2 !== "") ? Number(g.score2) : null,
        seed: findTeam(g.team2)?.seed || null,
      },
    })),
  }));
}

function normalizeTeam(data, id, index) {
  const name = data.teamName || data.name || "Team " + (index + 1);
  const words = name.trim().split(/\s+/);
  const short = data.short ||
    (words.length >= 2
      ? (words[0][0] + words[1][0] + (words[2] ? words[2][0] : words[1][1] || words[1][0])).toUpperCase()
      : name.slice(0, 3).toUpperCase());

  // players field is an array of strings; roster field (from register screen) is array of objects
  const rawPlayers = data.players || data.roster || [];
  const roster = rawPlayers.map((p, i) =>
    typeof p === "string"
      ? { name: p, pos: "—", no: i + 1, h: "—" }
      : { name: p.name || "Player " + (i + 1), pos: p.pos || "—", no: p.no || (i + 1), h: p.h || "—" }
  );

  const PALETTE = [
    "oklch(0.78 0.13 78)", "oklch(0.70 0.15 250)", "oklch(0.72 0.14 145)",
    "oklch(0.75 0.16 30)",  "oklch(0.68 0.17 310)", "oklch(0.74 0.12 195)",
    "oklch(0.80 0.13 60)",  "oklch(0.66 0.18 340)",
  ];

  return {
    id,
    name,
    short,
    seed: data.seed || (index + 1),
    wins: data.wins || 0,
    losses: data.losses || 0,
    pf: data.pf || 0,
    pa: data.pa || 0,
    captain: data.captainName || data.captain || "—",
    captainEmail: data.captainEmail || data.email || "",
    color: data.color || PALETTE[index % PALETTE.length],
    paymentStatus: data.paymentStatus || "unpaid",
    division: data.division || "open",
    roster,
  };
}

function normalizeGame(data, id) {
  // matchup field: "Team A vs Team B" — split on " vs "
  let team1 = data.team1 || "TBD";
  let team2 = data.team2 || "TBD";
  if (data.matchup) {
    const parts = data.matchup.split(/\s+vs\.?\s+/i);
    team1 = (parts[0] || "TBD").trim();
    team2 = (parts[1] || "TBD").trim();
  }
  const score1 = (data.score1 !== undefined && data.score1 !== null && data.score1 !== "") ? Number(data.score1) : null;
  const score2 = (data.score2 !== undefined && data.score2 !== null && data.score2 !== "") ? Number(data.score2) : null;
  return {
    id,
    date: data.date || "TBD",
    time: data.time || "TBD",
    team1,
    team2,
    court: data.court || "TBD",
    round: data.round || "Division Play",
    status: data.status || "Scheduled",
    score1,
    score2,
    day: data.day || null,
    division: data.division || null,
    divisionName: data.divisionName || null,
  };
}

function waitForFirebase(callback) {
  if (window.db && window.firestoreImports) {
    callback();
    return;
  }
  let attempts = 0;
  const interval = setInterval(() => {
    if (window.db && window.firestoreImports) {
      clearInterval(interval);
      callback();
    } else if (++attempts >= 100) {
      clearInterval(interval);
      console.error("IBA: Firebase did not load in time");
      window.IBA_DATA.loading = false;
      notifyDataChanged();
    }
  }, 100);
}

function initFirebaseData() {
  const { collection, onSnapshot } = window.firestoreImports;
  const db = window.db;

  let teamsLoaded = false;
  let gamesLoaded = false;

  function checkReady() {
    if (teamsLoaded && gamesLoaded) {
      window.IBA_DATA.loading = false;
    }
    notifyDataChanged();
  }

  // Teams listener
  onSnapshot(collection(db, "teams"), (snap) => {
    const teams = snap.docs.map((d, i) => normalizeTeam(d.data(), d.id, i));
    teams.sort((a, b) => b.wins - a.wins || (b.pf - b.pa) - (a.pf - a.pa));
    teams.forEach((t, i) => { if (!t.seed) t.seed = i + 1; });
    window.IBA_DATA.TEAMS = teams;

    // Rebuild bracket when teams change
    window.IBA_DATA.BRACKET_ROUNDS = buildBracketRounds(window.IBA_DATA.GAMES, teams);
    teamsLoaded = true;
    checkReady();
  }, (err) => {
    console.error("Teams listener error:", err);
    teamsLoaded = true;
    checkReady();
  });

  // Games listener
  onSnapshot(collection(db, "games"), (snap) => {
    const games = snap.docs.map(d => normalizeGame(d.data(), d.id));
    window.IBA_DATA.GAMES = games;
    window.IBA_DATA.BRACKET_ROUNDS = buildBracketRounds(games, window.IBA_DATA.TEAMS);
    gamesLoaded = true;
    checkReady();
  }, (err) => {
    console.error("Games listener error:", err);
    gamesLoaded = true;
    checkReady();
  });

  // Announcements listener (optional collection)
  onSnapshot(collection(db, "announcements"), (snap) => {
    if (!snap.empty) {
      window.IBA_DATA.ANNOUNCEMENTS = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      notifyDataChanged();
    }
  }, () => {
    // Collection may not exist — that's OK
  });
}

waitForFirebase(initFirebaseData);
