// Home / Landing screen — editorial dark + gold

const TeamLogo = ({ team, size = 80 }) => (
  <div className="team-logo" style={{
    width: size, height: size,
    background: `radial-gradient(circle at 30% 30%, ${team.color}, color-mix(in oklch, ${team.color} 60%, #000))`,
    border: `1.5px solid color-mix(in oklch, ${team.color} 70%, #000)`,
    color: "#0B0A08",
    fontSize: size * 0.18,
  }}>
    <span>{team.name.split(" ").slice(0, 2).join(" ")}</span>
  </div>
);

const Home = ({ onNav }) => {
  const { GAMES, TEAMS, ANNOUNCEMENTS } = window.IBA_DATA;
  const standings = [...TEAMS].sort((a, b) => b.wins - a.wins).slice(0, 5);
  const nextGame = GAMES.find(g => g.status === "Scheduled" && g.team1 !== "TBD") || null;
  const news = (ANNOUNCEMENTS && ANNOUNCEMENTS[0]) || null;
  const t1 = nextGame ? TEAMS.find(t => t.name === nextGame.team1) : null;
  const t2 = nextGame ? TEAMS.find(t => t.name === nextGame.team2) : null;
  const featuredTeams = TEAMS.slice(0, 6);


  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-bg">
          <div className="placeholder hero">
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)", letterSpacing: "0.2em" }}>
              HERO PHOTO · ATHLETE DUNK · GYM INTERIOR
            </div>
          </div>
        </div>
        <div className="hero-page-no">01</div>
        <div className="hero-content">
          <h1 className="display">
            Indian<br />
            <span className="accent">Basketball</span><br />
            Association
          </h1>
          <div className="sub">Purdue University</div>
          <div className="tag-line">Competitive. Community. Culture.</div>
          <div className="hero-cta">
            <button className="btn btn-gold" onClick={() => onNav && onNav("register")}>Join IBA <span className="arrow"></span></button>
            <button className="btn" onClick={() => onNav && onNav("schedule")}>View schedule <span className="arrow"></span></button>
          </div>
        </div>
        <div className="hero-watch">
          <div className="play-circle"></div>
          <div className="label">
            Watch<br/>
            <small>IBA recap</small>
          </div>
        </div>
      </section>

      {/* CARD CLUSTER: News · Standings · Next Game */}
      <div className="card-cluster">
        {/* Latest News */}
        <div className="card">
          <div className="cluster-card-head">
            <h3 className="h3">Latest News</h3>
          </div>
          <div className="placeholder wide" style={{ marginBottom: 16 }}>
            IBA BASKETBALL · PURDUE
          </div>
          <h4 style={{
            fontFamily: "var(--font-display)", fontWeight: 800,
            fontSize: 22, letterSpacing: "0.02em", textTransform: "uppercase",
            margin: "0 0 8px", lineHeight: 1.05
          }}>
            {news ? news.title : "Season is live."}
          </h4>
          <p style={{ color: "var(--fg-2)", fontSize: 13, margin: "0 0 4px" }}>
            {news ? news.body : "Games, standings, and bracket updated in real time."}
          </p>
          <p className="mono" style={{ fontSize: 11, color: "var(--fg-3)", letterSpacing: "0.12em" }}>
            {news ? news.date : "IBA @ PURDUE"}
          </p>
        </div>

        {/* League Standings */}
        <div className="card">
          <div className="cluster-card-head">
            <h3 className="h3">League Standings</h3>
            <a className="link" href="#">View full</a>
          </div>
          <table className="data" style={{ marginTop: -4 }}>
            <thead>
              <tr>
                <th style={{ width: 24, paddingLeft: 0 }}></th>
                <th>Team</th>
                <th style={{ width: 36 }}>W</th>
                <th style={{ width: 36 }}>L</th>
                <th style={{ width: 56 }}>Pct</th>
                <th style={{ width: 56 }}>Strk</th>
              </tr>
            </thead>
            <tbody>
              {standings.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--fg-3)", padding: 24 }}>No teams yet.</td></tr>
              ) : null}
              {standings.map((t, i) => {
                const total = (t.wins || 0) + (t.losses || 0);
                const pct = total > 0 ? (t.wins / total).toFixed(3).replace(/^0/, "") : ".000";
                const strk = "—";
                return (
                  <tr key={t.id} style={{ background: i === 0 ? "color-mix(in oklch, var(--gold) 10%, transparent)" : "transparent" }}>
                    <td className="mono" style={{ paddingLeft: 0, color: "var(--fg-3)", fontSize: 11 }}>{i + 1}</td>
                    <td style={{ fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", fontSize: 13 }}>
                      {t.name}
                    </td>
                    <td className="mono num-tabular" style={{ fontWeight: 600 }}>{t.wins}</td>
                    <td className="mono num-tabular muted">{t.losses}</td>
                    <td className="mono num-tabular muted">{pct}</td>
                    <td className="mono num-tabular gold" style={{ fontWeight: 600 }}>{strk}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Next Game */}
        <div className="card">
          <div className="cluster-card-head">
            <h3 className="h3">Next Game</h3>
          </div>
          {nextGame && t1 && t2 ? (
            <>
              <div className="row" style={{ justifyContent: "center", gap: 24, padding: "8px 0 20px" }}>
                <div className="col" style={{ alignItems: "center", gap: 8 }}>
                  <TeamLogo team={t1} size={88} />
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, color: "var(--fg-3)", letterSpacing: "0.1em" }}>VS</div>
                <div className="col" style={{ alignItems: "center", gap: 8 }}>
                  <TeamLogo team={t2} size={88} />
                </div>
              </div>
              <div className="col" style={{ gap: 10, padding: "16px 0", borderTop: "1px solid var(--border)" }}>
                <div className="row" style={{ gap: 12 }}>
                  <span style={{ width: 18, height: 18, border: "1px solid var(--gold)", borderRadius: 3, display: "grid", placeItems: "center", color: "var(--gold)", fontSize: 10 }}>📅</span>
                  <span className="mono" style={{ fontSize: 12, letterSpacing: "0.1em" }}>
                    {nextGame.date} <span className="muted" style={{ margin: "0 8px" }}>·</span> {nextGame.time}
                  </span>
                </div>
                <div className="row" style={{ gap: 12 }}>
                  <span style={{ width: 18, height: 18, border: "1px solid var(--gold)", borderRadius: 3, display: "grid", placeItems: "center", color: "var(--gold)", fontSize: 10 }}>📍</span>
                  <span className="mono" style={{ fontSize: 12, letterSpacing: "0.1em" }}>
                    {nextGame.court || "FRANCE A. CÓRDOVA REC CENTER"}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--fg-3)" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 14, letterSpacing: "0.2em" }}>NO GAMES SCHEDULED</div>
            </div>
          )}
          <button className="btn btn-outline-gold" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
            onClick={() => onNav && onNav("schedule")}>
            View all games <span className="arrow"></span>
          </button>
        </div>
      </div>

      {/* HIGHLIGHT REEL */}
      <div className="highlight">
        <div className="highlight-meta">
          <div>
            <div style={{ width: 28, height: 2, background: "var(--gold)", marginBottom: 16 }}></div>
            <h2 className="h2">Highlight Reel</h2>
            <p style={{ color: "var(--fg-2)", maxWidth: "32ch", marginTop: 14, fontSize: 14 }}>
              Top plays, buzzer beaters, and unforgettable moments.
            </p>
          </div>
          <button className="btn btn-gold" style={{ alignSelf: "flex-start", marginTop: 24 }}>
            Watch now <span style={{
              width: 16, height: 16, borderRadius: "50%", background: "var(--ink)",
              display: "grid", placeItems: "center", marginLeft: 4
            }}>
              <span style={{
                width: 0, height: 0,
                borderLeft: "5px solid var(--gold)",
                borderTop: "3px solid transparent",
                borderBottom: "3px solid transparent",
                marginLeft: 1
              }}></span>
            </span>
          </button>
        </div>
        <div className="highlight-vid">
          <div className="placeholder">
            HIGHLIGHT VIDEO · DUNK + STADIUM LIGHTS
          </div>
          <div className="highlight-play"></div>
        </div>
      </div>

      {/* OUR TEAMS */}
      <div className="teams-strip">
        <div className="teams-strip-head">
          <h2 className="h2">Our Teams</h2>
          <button onClick={() => onNav && onNav("teams")} style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "var(--font-display)", fontSize: 11, letterSpacing: "0.22em",
            textTransform: "uppercase", color: "var(--fg-2)"
          }}>View all teams</button>
        </div>
        <div className="teams-strip-grid">
          {featuredTeams.length === 0 ? (
            <div style={{ color: "var(--fg-3)", gridColumn: "1 / -1", textAlign: "center", padding: 32, fontFamily: "var(--font-display)", letterSpacing: "0.2em" }}>
              TEAMS COMING SOON
            </div>
          ) : featuredTeams.map(t => (
            <div key={t.id} className="team-tile">
              <TeamLogo team={t} size={84} />
              <div className="name">{t.name.split(" ")[0]}</div>
              <div className="rec">{t.wins}-{t.losses}</div>
            </div>
          ))}
        </div>
        <button className="carousel-arrow left" aria-label="prev">‹</button>
        <button className="carousel-arrow right" aria-label="next">›</button>
      </div>

      {/* BOTTOM CTA */}
      <div className="bottom-cta">
        <div className="bg">
          <div className="placeholder">BASKETBALL · WARM LIGHT</div>
        </div>
        <div className="bottom-cta-content">
          <h2 className="h1" style={{ fontSize: 56 }}>Be part of<br/>something bigger.</h2>
          <p style={{ color: "var(--fg-2)", marginTop: 16, fontSize: 14, fontFamily: "var(--font-display)", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 500 }}>
            Join the IBA family.
          </p>
          <button className="btn btn-gold" style={{ marginTop: 32 }} onClick={() => onNav && onNav("register")}>
            Register now <span className="arrow"></span>
          </button>
        </div>
      </div>
    </>
  );
};

window.Home = Home;
