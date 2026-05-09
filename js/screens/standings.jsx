// Standings + stats

const Standings = () => {
  const { TEAMS, STANDINGS_LEADERS } = window.IBA_DATA;
  const sorted = [...TEAMS].sort((a, b) => (b.wins||0) - (a.wins||0) || ((b.pf||0)-(b.pa||0)) - ((a.pf||0)-(a.pa||0)));
  const leaders = (STANDINGS_LEADERS && STANDINGS_LEADERS.length > 0) ? STANDINGS_LEADERS : [];

  return (
    <>
      <PageHeader
        eyebrow="Regular season + playoffs"
        title="Standings & <em>stats</em>"
        lede="Final regular-season table. Top 16 made the bracket — every team did."
      />
      <div className="page-body">
        <div className="grid-3" style={{ marginBottom: 40 }}>
          <div className="stat-big" style={{ borderColor: "var(--accent)" }}>
            <div className="l" style={{ marginBottom: 6, marginTop: 0 }}>TEAMS REGISTERED</div>
            <div className="v" style={{ fontSize: 32 }}>{sorted.length}</div>
            <div style={{ marginTop: 8, fontSize: 13 }}>{sorted.length > 0 ? sorted[0].name + " leads" : "Season upcoming"}</div>
          </div>
          <div className="stat-big">
            <div className="l" style={{ marginBottom: 6, marginTop: 0 }}>GAMES PLAYED</div>
            <div className="v" style={{ fontSize: 32 }}>{window.IBA_DATA.GAMES.filter(g => g.status === "Final").length}</div>
            <div style={{ marginTop: 8, fontSize: 13 }}>{window.IBA_DATA.GAMES.filter(g => g.status === "Live").length} live now</div>
          </div>
          <div className="stat-big">
            <div className="l" style={{ marginBottom: 6, marginTop: 0 }}>TOTAL WINS RECORDED</div>
            <div className="v" style={{ fontSize: 32 }}>{sorted.reduce((acc, t) => acc + (t.wins || 0), 0)}</div>
            <div style={{ marginTop: 8, fontSize: 13 }}>Across all teams</div>
          </div>
        </div>

        <div className="grid-2" style={{ alignItems: "flex-start" }}>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
              <Eyebrow>Regular season</Eyebrow>
              <h3 className="h3" style={{ marginTop: 4 }}>Team standings</h3>
            </div>
            <table className="data">
              <thead>
                <tr>
                  <th style={{ width: 32 }}>#</th>
                  <th>Team</th>
                  <th style={{ width: 50 }}>W</th>
                  <th style={{ width: 50 }}>L</th>
                  <th style={{ width: 60 }}>PF</th>
                  <th style={{ width: 60 }}>PA</th>
                  <th style={{ width: 60 }}>+/-</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((t, i) => {
                  const diff = t.pf - t.pa;
                  return (
                    <tr key={t.id}>
                      <td className="mono" style={{ color: "var(--fg-3)", fontSize: 11 }}>{String(i + 1).padStart(2, "0")}</td>
                      <td>
                        <div className="row" style={{ gap: 10 }}>
                          <div style={{ width: 20, height: 20, borderRadius: 4, background: t.color, display: "grid", placeItems: "center", fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--ink)", fontWeight: 600 }}>
                            {t.short}
                          </div>
                          <span style={{ fontWeight: i < 4 ? 600 : 500 }}>{t.name}</span>
                        </div>
                      </td>
                      <td className="mono num-tabular" style={{ fontWeight: 600 }}>{t.wins}</td>
                      <td className="mono num-tabular muted">{t.losses}</td>
                      <td className="mono num-tabular muted">{t.pf}</td>
                      <td className="mono num-tabular muted">{t.pa}</td>
                      <td className="mono num-tabular" style={{ color: diff > 0 ? "var(--green)" : "var(--red)" }}>
                        {diff > 0 ? "+" : ""}{diff}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="col" style={{ gap: 16 }}>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                <Eyebrow>Players</Eyebrow>
                <h3 className="h3" style={{ marginTop: 4 }}>Stat leaders</h3>
              </div>
              <table className="data">
                <tbody>
                  {leaders.length === 0 ? <tr><td colSpan={3} style={{ textAlign: "center", color: "var(--fg-3)", padding: 20 }}>No stat leaders yet.</td></tr> : null}
                  {leaders.map((l, i) => (
                    <tr key={i}>
                      <td className="mono" style={{ width: 60, color: "var(--fg-3)", fontSize: 11 }}>{l.stat}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{l.leader}</div>
                        <div className="muted" style={{ fontSize: 12 }}>{l.team}</div>
                      </td>
                      <td className="mono num-tabular" style={{ width: 60, fontWeight: 600, fontSize: 16, textAlign: "right" }}>
                        {typeof l.val === "number" && l.val < 1 ? (l.val * 100).toFixed(1) + "%" : l.val}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <Eyebrow>Form guide</Eyebrow>
              <h3 className="h3" style={{ margin: "4px 0 16px" }}>Last 5 games</h3>
              <div className="col" style={{ gap: 10 }}>
                {sorted.slice(0, 6).map(t => (
                  <div key={t.id} className="row between">
                    <span style={{ fontSize: 13 }}>{t.name}</span>
                    <div className="row" style={{ gap: 4 }}>
                      {["W","W","L","W","W"].map((r, i) => (
                        <span key={i} style={{
                          width: 18, height: 18, borderRadius: 4,
                          display: "grid", placeItems: "center",
                          fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 600,
                          background: r === "W" ? "color-mix(in oklch, var(--green) 18%, transparent)" : "color-mix(in oklch, var(--red) 18%, transparent)",
                          color: r === "W" ? "var(--green)" : "var(--red)"
                        }}>{r}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

window.Standings = Standings;
