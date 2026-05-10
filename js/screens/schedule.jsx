// Schedule screen

const Schedule = ({ user }) => {
  const { GAMES, TEAMS } = window.IBA_DATA;
  const findTeam = name => TEAMS.find(t => t.name === name);

  const myTeam = user
    ? TEAMS.find(t => t.captainUid === user.uid || (t.captainEmail && t.captainEmail.toLowerCase() === (user.email || "").toLowerCase()))
    : null;

  const [rescheduleModal, setRescheduleModal] = React.useState(null);
  const [reason, setReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [existingRequests, setExistingRequests] = React.useState({});

  React.useEffect(() => {
    if (!window.db || !window.firestoreImports) return;
    const { collection, onSnapshot } = window.firestoreImports;
    const unsub = onSnapshot(collection(window.db, "rescheduleRequests"), snap => {
      const map = {};
      snap.docs.forEach(d => {
        const data = d.data();
        if (data.status !== "denied") map[data.gameId] = { id: d.id, ...data };
      });
      setExistingRequests(map);
    }, () => {});
    return () => unsub();
  }, []);

  const submitReschedule = async () => {
    if (!reason.trim()) return;
    if (!window.db || !window.firestoreImports) return;
    setSubmitting(true);
    try {
      const { collection, addDoc } = window.firestoreImports;
      await addDoc(collection(window.db, "rescheduleRequests"), {
        gameId: rescheduleModal.id,
        matchup: `${rescheduleModal.team1} vs ${rescheduleModal.team2}`,
        originalDate: rescheduleModal.date,
        originalTime: rescheduleModal.time,
        originalCourt: rescheduleModal.court,
        requestingTeamId: myTeam?.id || null,
        requestingTeamName: myTeam?.name || null,
        requestingCaptainUid: user.uid,
        requestingCaptainEmail: user.email,
        reason: reason.trim(),
        status: "pending",
        createdAt: new Date().toISOString(),
        groupMeChatId: null,
        proposedDate: null,
        proposedTime: null,
      });
      if (window.showToast) window.showToast("Reschedule request submitted. A GroupMe chat will be created shortly.", "ok");
      setRescheduleModal(null);
      setReason("");
    } catch (err) {
      console.error(err);
      if (window.showToast) window.showToast("Failed to submit request.", "err");
    } finally {
      setSubmitting(false);
    }
  };

  const days = [...new Set(GAMES.map(g => g.date))];

  const reqBadge = (req) => {
    const colors = { pending: "var(--gold)", chat_created: "var(--gold)", proposed: "#a78bfa", approved: "var(--green)" };
    const labels = { pending: "RESCHEDULE PENDING", chat_created: "CHAT ACTIVE", proposed: "NEW TIME PROPOSED", approved: "RESCHEDULED" };
    const c = colors[req.status] || "var(--fg-3)";
    return (
      <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", letterSpacing: "0.1em", padding: "2px 6px", borderRadius: 4, border: `1px solid ${c}`, color: c }}>
        {labels[req.status] || req.status.toUpperCase()}
      </span>
    );
  };

  return (
    <>
      <PageHeader
        eyebrow={`${GAMES.length} game${GAMES.length !== 1 ? "s" : ""} scheduled`}
        title="Game <em>schedule</em>"
        lede="All games, times, and courts."
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
                    <th style={{ width: 130 }}>Status</th>
                    <th style={{ width: 90 }}>Score</th>
                    <th style={{ width: 120 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {GAMES.filter(g => g.date === day).map(g => {
                    const t1 = findTeam(g.team1);
                    const t2 = findTeam(g.team2);
                    const isMyCaptainGame = myTeam && (g.team1 === myTeam.name || g.team2 === myTeam.name);
                    const existingReq = existingRequests[g.id];
                    const canRequest = isMyCaptainGame && g.status === "Scheduled" && !existingReq;
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
                          <div className="col" style={{ gap: 4, alignItems: "flex-start" }}>
                            {g.status === "Live" ? <LiveTag /> :
                             g.status === "Final" ? <Tag kind="ok">Final</Tag> :
                             <Tag>Scheduled</Tag>}
                            {existingReq && reqBadge(existingReq)}
                          </div>
                        </td>
                        <td>
                          {g.score1 != null
                            ? <span className="mono num-tabular" style={{ fontWeight: 600 }}>{g.score1}–{g.score2}</span>
                            : <span className="muted">—</span>}
                        </td>
                        <td>
                          {canRequest && (
                            <button className="btn btn-sm" onClick={() => { setRescheduleModal(g); setReason(""); }} style={{ fontSize: 11 }}>
                              Reschedule
                            </button>
                          )}
                          {existingReq && isMyCaptainGame && !canRequest && (
                            <span style={{ fontSize: 11, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>REQUESTED</span>
                          )}
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

      {rescheduleModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setRescheduleModal(null); }}>
          <div className="card" style={{ maxWidth: 480, width: "100%", padding: 32 }}>
            <Eyebrow>Reschedule Request</Eyebrow>
            <h3 className="h3" style={{ margin: "4px 0 20px" }}>
              {rescheduleModal.team1} vs {rescheduleModal.team2}
            </h3>
            <div style={{ background: "var(--bg-elev)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "12px 16px", marginBottom: 20 }}>
              {[["Date", rescheduleModal.date], ["Time", rescheduleModal.time], ["Court", rescheduleModal.court], ["Round", rescheduleModal.round]].map(([k, v]) => (
                <div key={k} className="row between" style={{ padding: "4px 0" }}>
                  <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>{k.toUpperCase()}</span>
                  <span style={{ fontSize: 13 }}>{v || "—"}</span>
                </div>
              ))}
            </div>
            <div className="field" style={{ marginBottom: 20 }}>
              <label>Reason for reschedule</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g. exam conflict, player unavailable..."
                rows={3}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--bg-elev)", color: "var(--fg)", font: "inherit", fontSize: 14, resize: "vertical" }}
              />
            </div>
            <p style={{ fontSize: 12, color: "var(--fg-3)", marginBottom: 20 }}>
              A GroupMe group chat will be created with both captains and an IBA admin to coordinate a new time. Admin approval is required to confirm.
            </p>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn btn-gold" onClick={submitReschedule} disabled={submitting || !reason.trim()} style={{ opacity: submitting || !reason.trim() ? 0.5 : 1 }}>
                {submitting ? "Submitting…" : "Submit Request"}
              </button>
              <button className="btn" onClick={() => setRescheduleModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

window.Schedule = Schedule;
