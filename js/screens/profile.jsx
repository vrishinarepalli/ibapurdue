// Profile screen — real Firebase auth

const Profile = ({ user, onNav }) => {
  const { TEAMS, GAMES } = window.IBA_DATA;

  if (!user) {
    return (
      <>
        <PageHeader
          eyebrow="Not signed in"
          title="Your <em>profile</em>"
          lede="Sign in with your Google account to view your profile."
        />
        <div className="page-body">
          <div className="card" style={{ maxWidth: 400, padding: 40, textAlign: "center" }}>
            <p style={{ color: "var(--fg-2)", marginBottom: 24 }}>
              You need to sign in to access your profile.
            </p>
            <button className="btn btn-gold" onClick={() => window.signInWithGoogle && window.signInWithGoogle()}>
              Sign in with Google
            </button>
          </div>
        </div>
      </>
    );
  }

  const displayName = user.displayName || user.email.split("@")[0];
  const email = user.email || "";
  const initials = displayName.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();

  // Find user's team by captain email
  const myTeam = TEAMS.find(t =>
    t.captainEmail && t.captainEmail.toLowerCase() === email.toLowerCase()
  ) || TEAMS.find(t =>
    t.captain && displayName && t.captain.toLowerCase().includes(displayName.split(" ")[0].toLowerCase())
  );

  const teamGames = myTeam
    ? GAMES.filter(g => g.team1 === myTeam.name || g.team2 === myTeam.name)
    : [];

  const nextGame = teamGames.find(g => g.status === "Scheduled");

  const handleSignOut = () => {
    if (window.auth && window.authImports) {
      window.authImports.signOut(window.auth).catch(console.error);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow={`Purdue · ${email}`}
        title={`<em>${displayName}</em>`}
        lede="Your team, your games, your stats. All in one place."
        actions={[
          <button key="2" className="btn btn-sm btn-ghost" onClick={handleSignOut}>Sign out</button>,
        ]}
      />
      <div className="page-body">
        <div className="row" style={{ gap: 32, marginBottom: 40, alignItems: "flex-start" }}>
          <div style={{
            width: 120, height: 120, borderRadius: "50%",
            background: "var(--gold)",
            display: "grid", placeItems: "center",
            fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 800,
            color: "var(--ink)", flexShrink: 0,
          }}>
            {initials}
          </div>
          <div className="col" style={{ gap: 16, flex: 1 }}>
            {myTeam ? (
              <>
                <div>
                  <Eyebrow>Captain · {myTeam.name}</Eyebrow>
                  <h2 className="h2" style={{ marginTop: 4 }}>{myTeam.name}</h2>
                </div>
                <div className="grid-4">
                  <StatBig value={`${myTeam.wins}-${myTeam.losses}`} label="Record" accent />
                  <StatBig value={myTeam.wins} label="Wins" />
                  <StatBig value={myTeam.losses} label="Losses" />
                  <StatBig value={myTeam.pf > 0 ? (myTeam.pf / Math.max(1, myTeam.wins + myTeam.losses)).toFixed(1) : "—"} label="PPG" />
                </div>
              </>
            ) : (
              <div>
                <Eyebrow>No team found</Eyebrow>
                <h2 className="h2" style={{ marginTop: 4 }}>Unregistered</h2>
                <p style={{ color: "var(--fg-2)", marginTop: 8, fontSize: 14 }}>
                  You're not registered as a team captain yet.
                </p>
                <button className="btn btn-gold" style={{ marginTop: 16 }} onClick={() => onNav && onNav("register")}>
                  Register a team
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid-2" style={{ alignItems: "flex-start" }}>
          {/* Team games */}
          <div>
            <Eyebrow>Your games</Eyebrow>
            <h3 className="h3" style={{ margin: "4px 0 16px" }}>
              {myTeam ? "Schedule & results" : "No games yet"}
            </h3>
            {teamGames.length > 0 ? (
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <table className="data">
                  <thead>
                    <tr><th>Date</th><th>Round</th><th>Opponent</th><th>Court</th><th>Result</th></tr>
                  </thead>
                  <tbody>
                    {teamGames.map(g => {
                      const opp = g.team1 === myTeam.name ? g.team2 : g.team1;
                      const myScore = g.team1 === myTeam.name ? g.score1 : g.score2;
                      const oppScore = g.team1 === myTeam.name ? g.score2 : g.score1;
                      const won = myScore != null && oppScore != null && myScore > oppScore;
                      return (
                        <tr key={g.id}>
                          <td className="mono">{g.date}</td>
                          <td><Tag>{g.round}</Tag></td>
                          <td>{opp}</td>
                          <td className="mono muted">{g.court}</td>
                          <td>
                            {myScore != null ? (
                              <span className="mono num-tabular" style={{ fontWeight: 600, color: won ? "var(--green)" : "var(--red)" }}>
                                {won ? "W" : "L"} {myScore}–{oppScore}
                              </span>
                            ) : g.status === "Live" ? (
                              <LiveTag />
                            ) : (
                              <span className="muted mono">{g.time}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="card" style={{ color: "var(--fg-3)", textAlign: "center", padding: 40 }}>
                No games scheduled yet.
              </div>
            )}
          </div>

          {/* Account & next game */}
          <div className="col" style={{ gap: 16 }}>
            <div>
              <Eyebrow>Account</Eyebrow>
              <h3 className="h3" style={{ margin: "4px 0 16px" }}>Settings</h3>
              <div className="card" style={{ padding: 0 }}>
                {[
                  { label: "Email", val: email },
                  { label: "Team", val: myTeam ? myTeam.name : "—" },
                  { label: "Role", val: myTeam ? "Captain" : "Player" },
                  { label: "Division", val: myTeam ? myTeam.division.toUpperCase() : "—" },
                  { label: "Payment", val: myTeam ? (myTeam.paymentStatus === "paid" ? "Paid ✓" : "Pending") : "—" },
                ].map((s, i, arr) => (
                  <div key={i} className="row between" style={{ padding: "14px 18px", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : 0 }}>
                    <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</span>
                    <span style={{ fontSize: 13 }}>{s.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {nextGame && (
              <div className="card" style={{ background: "var(--fg)", color: "var(--bg)", borderColor: "var(--fg)" }}>
                <div className="mono" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.6 }}>NEXT GAME</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 28, marginTop: 8, lineHeight: 1.05, fontWeight: 800, textTransform: "uppercase" }}>
                  vs. {nextGame.team1 === myTeam.name ? nextGame.team2 : nextGame.team1}
                </div>
                <div className="row" style={{ gap: 16, marginTop: 14, opacity: 0.7 }}>
                  <span className="mono" style={{ fontSize: 12 }}>{nextGame.date}</span>
                  <span className="mono" style={{ fontSize: 12 }}>{nextGame.time}</span>
                  <span className="mono" style={{ fontSize: 12 }}>{nextGame.court}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

window.Profile = Profile;
