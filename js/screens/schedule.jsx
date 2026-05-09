// Schedule screen

const Schedule = () => {
  const { GAMES, TEAMS } = window.IBA_DATA;
  const findTeam = name => TEAMS.find(t => t.name === name);
  const days = [...new Set(GAMES.map(g => g.date))];

  return (
    <>
      <PageHeader
        eyebrow={`${GAMES.length} game${GAMES.length !== 1 ? "s" : ""} scheduled`}
        title="Game <em>schedule</em>"
        lede="Filter by day, court or round. Add to your calendar to get reminders before tip-off."
        actions={[
          <button key="1" className="btn btn-sm">Add to calendar</button>,
          <button key="2" className="btn btn-sm">Filter ▾</button>,
        ]}
      />
      <div className="page-body">
        {days.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--fg-3)", padding: "60px 0", fontFamily: "var(--font-display)", letterSpacing: "0.2em" }}>
            NO GAMES SCHEDULED YET
          </div>
        )}
        {days.map(day => (
          <div key={day} style={{ marginBottom: 40 }}>
            <div className="row between" style={{ marginBottom: 16 }}>
              <h2 className="h2">{day}</h2>
              <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>
                {GAMES.filter(g => g.date === day).length} GAMES
              </span>
            </div>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <table className="data">
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>Time</th>
                    <th>Matchup</th>
                    <th style={{ width: 100 }}>Court</th>
                    <th style={{ width: 120 }}>Round</th>
                    <th style={{ width: 110 }}>Status</th>
                    <th style={{ width: 90 }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {GAMES.filter(g => g.date === day).map(g => {
                    const t1 = findTeam(g.team1);
                    const t2 = findTeam(g.team2);
                    return (
                      <tr key={g.id}>
                        <td className="mono num-tabular">{g.time}</td>
                        <td>
                          <div className="col" style={{ gap: 4 }}>
                            <div className="row" style={{ gap: 8 }}>
                              <div style={{ width: 18, height: 18, borderRadius: 4, background: t1?.color || "var(--border)" }}></div>
                              <span style={{ fontWeight: g.score1 > g.score2 ? 600 : 500 }}>{g.team1}</span>
                            </div>
                            <div className="row" style={{ gap: 8 }}>
                              <div style={{ width: 18, height: 18, borderRadius: 4, background: t2?.color || "var(--border)" }}></div>
                              <span style={{ fontWeight: g.score2 > g.score1 ? 600 : 500 }}>{g.team2}</span>
                            </div>
                          </div>
                        </td>
                        <td className="mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>{g.court}</td>
                        <td><Tag>{g.round}</Tag></td>
                        <td>
                          {g.status === "Live" ? <LiveTag /> :
                           g.status === "Final" ? <Tag kind="ok">Final</Tag> :
                           <Tag>Scheduled</Tag>}
                        </td>
                        <td>
                          {g.score1 != null ? (
                            <span className="mono num-tabular" style={{ fontWeight: 600 }}>{g.score1}–{g.score2}</span>
                          ) : <span className="muted">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

window.Schedule = Schedule;
