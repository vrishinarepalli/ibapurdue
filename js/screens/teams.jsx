// Teams browser

const Teams = () => {
  const { TEAMS, GAMES } = window.IBA_DATA;
  const [selected, setSelected] = React.useState(null);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    if (!selected && TEAMS.length > 0) setSelected(TEAMS[0].id);
  }, [TEAMS.length]);

  const team = TEAMS.find(t => t.id === selected) || null;
  const filtered = TEAMS.filter(t => t.name.toLowerCase().includes(query.toLowerCase()));
  const teamGames = team ? GAMES.filter(g => g.team1 === team.name || g.team2 === team.name) : [];
  const roster = (team && team.roster && team.roster.length > 0)
    ? team.roster.map((p, i) => ({
        name: typeof p === "string" ? p : (p.name || "Player " + (i + 1)),
        pos: p.pos || "—",
        no: p.no || (i + 1),
        h: p.h || "—",
      }))
    : [];

  if (TEAMS.length === 0) {
    return (
      <>
        <PageHeader eyebrow="0 teams" title="Team <em>roster</em>" lede="Teams will appear here once registration opens." />
        <div className="page-body" style={{ textAlign: "center", color: "var(--fg-3)", padding: "60px 0" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 14, letterSpacing: "0.2em" }}>NO TEAMS REGISTERED YET</div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={`${TEAMS.length} team${TEAMS.length !== 1 ? "s" : ""} registered`}
        title="Team <em>roster</em>"
        lede="Scout your next opponent. Click any team to see their roster, schedule, and form."
      />
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", minHeight: "calc(100vh - 220px)" }}>

        {/* Sidebar list */}
        <div style={{ borderRight: "1px solid var(--border)", padding: "16px" }}>
          <input
            type="text"
            placeholder="Search teams…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              width: "100%", padding: "10px 12px",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              background: "var(--bg-elev)",
              color: "var(--fg)", font: "inherit", fontSize: 13,
              marginBottom: 12,
            }}
          />
          <div className="col" style={{ gap: 4 }}>
            {filtered.map(t => (
              <button
                key={t.id}
                onClick={() => setSelected(t.id)}
                className="row"
                style={{
                  gap: 12, padding: "10px 12px",
                  border: "1px solid " + (selected === t.id ? "var(--fg)" : "transparent"),
                  background: selected === t.id ? "var(--bg-elev)" : "transparent",
                  borderRadius: "var(--radius)",
                  cursor: "pointer", textAlign: "left",
                  width: "100%", color: "var(--fg)",
                }}
              >
                <div style={{ width: 30, height: 30, borderRadius: 6, background: t.color, display: "grid", placeItems: "center", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink)", fontWeight: 600, flexShrink: 0 }}>
                  {t.short}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.name}
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>
                    {t.wins}-{t.losses}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div style={{ padding: "32px 40px" }}>
          {!team ? (
            <div style={{ color: "var(--fg-3)", textAlign: "center", padding: 40 }}>Select a team.</div>
          ) : (
            <>
              {/* Team header */}
              <div className="row" style={{ gap: 24, marginBottom: 32, alignItems: "flex-start" }}>
                <div style={{
                  width: 96, height: 96, borderRadius: 16, background: team.color,
                  display: "grid", placeItems: "center",
                  fontFamily: "var(--font-display)", fontSize: 36, color: "var(--ink)", fontWeight: 600,
                }}>
                  {team.short}
                </div>
                <div style={{ flex: 1 }}>
                  <Eyebrow>Captain {team.captain}</Eyebrow>
                  <h2 className="h1" style={{ fontSize: 48, marginTop: 4 }}>{team.name}</h2>
                  <div className="row" style={{ gap: 20, marginTop: 16 }}>
                    <div>
                      <span className="mono num-tabular" style={{ fontSize: 22, fontWeight: 600 }}>{team.wins}-{team.losses}</span>
                      <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)", marginLeft: 6 }}>RECORD</span>
                    </div>
                    <div>
                      <span className="mono num-tabular" style={{ fontSize: 22, fontWeight: 600 }}>
                        {(team.wins + team.losses) > 0 ? (team.pf / (team.wins + team.losses)).toFixed(1) : "—"}
                      </span>
                      <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)", marginLeft: 6 }}>PPG</span>
                    </div>
                    <div>
                      <span className="mono num-tabular" style={{ fontSize: 22, fontWeight: 600 }}>
                        {(team.wins + team.losses) > 0 ? (team.pa / (team.wins + team.losses)).toFixed(1) : "—"}
                      </span>
                      <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)", marginLeft: 6 }}>OPP PPG</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span className={`tag ${team.paymentStatus === "paid" ? "ok" : ""}`}>
                    {team.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                  </span>
                </div>
              </div>

              {/* Roster */}
              <Eyebrow>Roster</Eyebrow>
              <h3 className="h3" style={{ margin: "4px 0 16px" }}>
                {roster.length > 0 ? `${roster.length} players` : "No roster submitted yet"}
              </h3>
              {roster.length > 0 && (
                <div className="grid-4" style={{ marginBottom: 32 }}>
                  {roster.map((p, i) => (
                    <div key={i} className="card" style={{ padding: 16 }}>
                      <StripedPlaceholder label="player" style={{ aspectRatio: "1", marginBottom: 12 }} />
                      <div className="row between">
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</span>
                        <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>#{p.no}</span>
                      </div>
                      <div className="mono" style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 2 }}>
                        {p.pos} · {p.h}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Games */}
              <Eyebrow>Games</Eyebrow>
              <h3 className="h3" style={{ margin: "4px 0 16px" }}>Path to the title</h3>
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <table className="data">
                  <thead>
                    <tr><th>Date</th><th>Round</th><th>Opponent</th><th>Court</th><th>Result</th></tr>
                  </thead>
                  <tbody>
                    {teamGames.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", color: "var(--fg-3)", padding: 24 }}>No games yet.</td>
                      </tr>
                    ) : teamGames.map(g => {
                      const opp = g.team1 === team.name ? g.team2 : g.team1;
                      const myScore = g.team1 === team.name ? g.score1 : g.score2;
                      const oppScore = g.team1 === team.name ? g.score2 : g.score1;
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
            </>
          )}
        </div>
      </div>
    </>
  );
};

window.Teams = Teams;
