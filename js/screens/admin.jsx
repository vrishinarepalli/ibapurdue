// Admin dashboard — real Firestore operations

const Admin = ({ user, isAdmin }) => {
  const { TEAMS, GAMES } = window.IBA_DATA;
  const [tab, setTab] = React.useState("payments");
  const [filterPayment, setFilterPayment] = React.useState("all");
  const [editGame, setEditGame] = React.useState(null);
  const [scoreInput, setScoreInput] = React.useState({ score1: "", score2: "" });
  const [saving, setSaving] = React.useState(false);
  const [rescheduleRequests, setRescheduleRequests] = React.useState([]);
  const [approveModal, setApproveModal] = React.useState(null);
  const [newDate, setNewDate] = React.useState("");
  const [newTime, setNewTime] = React.useState("");
  const [newCourt, setNewCourt] = React.useState("");
  const [approving, setApproving] = React.useState(false);

  React.useEffect(() => {
    if (!window.db || !window.firestoreImports) return;
    const { collection, onSnapshot, query, orderBy } = window.firestoreImports;
    const q = query(collection(window.db, "rescheduleRequests"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, snap => {
      setRescheduleRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => console.error("reschedule listener:", err));
    return () => unsub();
  }, []);

  if (!isAdmin) {
    return (
      <>
        <PageHeader
          eyebrow="Restricted"
          title="Admin <em>dashboard</em>"
          lede="This area is restricted to approved administrators."
        />
        <div className="page-body">
          <div className="card" style={{ maxWidth: 400, padding: 40, textAlign: "center" }}>
            <p style={{ color: "var(--fg-2)", marginBottom: 24 }}>
              {user ? "Your account does not have admin access." : "Sign in to request access."}
            </p>
            {!user && (
              <button className="btn btn-gold" onClick={() => window.signInWithGoogle && window.signInWithGoogle()}>
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  const paidTeams = TEAMS.filter(t => t.paymentStatus === "paid").length;
  const pendingTeams = TEAMS.filter(t => t.paymentStatus !== "paid").length;
  const liveGames = GAMES.filter(g => g.status === "Live").length;

  const filteredTeams = filterPayment === "all" ? TEAMS
    : filterPayment === "paid" ? TEAMS.filter(t => t.paymentStatus === "paid")
    : TEAMS.filter(t => t.paymentStatus !== "paid");

  const togglePayment = async (team) => {
    if (!window.db || !window.firestoreImports) return;
    const { doc, updateDoc } = window.firestoreImports;
    const newStatus = team.paymentStatus === "paid" ? "unpaid" : "paid";
    try {
      await updateDoc(doc(window.db, "teams", team.id), { paymentStatus: newStatus });
      if (window.showToast) window.showToast(`${team.name} marked as ${newStatus}.`, "ok");
    } catch (err) {
      console.error(err);
      if (window.showToast) window.showToast("Failed to update payment.", "err");
    }
  };

  const openScoreEdit = (game) => {
    setEditGame(game);
    setScoreInput({ score1: game.score1 ?? "", score2: game.score2 ?? "" });
  };

  const saveScore = async () => {
    if (!editGame || !window.db || !window.firestoreImports) return;
    setSaving(true);
    const { doc, updateDoc } = window.firestoreImports;
    try {
      const s1 = scoreInput.score1 !== "" ? Number(scoreInput.score1) : null;
      const s2 = scoreInput.score2 !== "" ? Number(scoreInput.score2) : null;
      await updateDoc(doc(window.db, "games", editGame.id), {
        score1: s1,
        score2: s2,
        status: s1 != null && s2 != null ? "Final" : editGame.status,
      });
      if (window.showToast) window.showToast("Score saved.", "ok");
      setEditGame(null);
    } catch (err) {
      console.error(err);
      if (window.showToast) window.showToast("Failed to save score.", "err");
    } finally {
      setSaving(false);
    }
  };

  const markGameLive = async (game) => {
    if (!window.db || !window.firestoreImports) return;
    const { doc, updateDoc } = window.firestoreImports;
    try {
      await updateDoc(doc(window.db, "games", game.id), { status: "Live" });
      if (window.showToast) window.showToast("Game marked as Live.", "ok");
    } catch (err) {
      console.error(err);
    }
  };

  const markGameFinal = async (game) => {
    if (!window.db || !window.firestoreImports) return;
    const { doc, updateDoc } = window.firestoreImports;
    try {
      await updateDoc(doc(window.db, "games", game.id), { status: "Final" });
      if (window.showToast) window.showToast("Game marked as Final.", "ok");
    } catch (err) {
      console.error(err);
    }
  };

  const denyReschedule = async (req) => {
    if (!window.db || !window.firestoreImports) return;
    const { doc, updateDoc } = window.firestoreImports;
    try {
      await updateDoc(doc(window.db, "rescheduleRequests", req.id), {
        status: "denied",
        resolvedAt: new Date().toISOString(),
      });
      if (window.showToast) window.showToast("Request denied.", "ok");
    } catch (err) {
      console.error(err);
      if (window.showToast) window.showToast("Failed to deny request.", "err");
    }
  };

  const approveReschedule = async () => {
    if (!approveModal || !window.db || !window.firestoreImports) return;
    if (!newDate.trim() || !newTime.trim()) {
      if (window.showToast) window.showToast("New date and time are required.", "err");
      return;
    }
    setApproving(true);
    const { doc, updateDoc } = window.firestoreImports;
    try {
      await updateDoc(doc(window.db, "games", approveModal.gameId), {
        date: newDate.trim(),
        time: newTime.trim(),
        court: newCourt.trim() || approveModal.originalCourt,
        status: "Scheduled",
        rescheduleRequestId: approveModal.id,
      });
      await updateDoc(doc(window.db, "rescheduleRequests", approveModal.id), {
        status: "approved",
        proposedDate: newDate.trim(),
        proposedTime: newTime.trim(),
        resolvedAt: new Date().toISOString(),
      });
      if (window.showToast) window.showToast("Reschedule approved. Game updated.", "ok");
      setApproveModal(null);
      setNewDate(""); setNewTime(""); setNewCourt("");
    } catch (err) {
      console.error(err);
      if (window.showToast) window.showToast("Failed to approve reschedule.", "err");
    } finally {
      setApproving(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Restricted · approved admins only"
        title="Admin <em>dashboard</em>"
        lede="Tournament operations. Payments, schedule edits, bracket updates."
        actions={[
          <Tag key="0" kind="ok"><span className="dot"></span> Live</Tag>,
          <span key="1" className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>
            Signed in as {user?.email}
          </span>,
        ]}
      />
      <div className="page-body">
        {/* Stats row */}
        <div className="grid-4" style={{ marginBottom: 32 }}>
          <StatBig value={`${paidTeams}/${TEAMS.length}`} label="Teams paid" accent />
          <StatBig value={GAMES.length} label="Games total" />
          <StatBig value={liveGames} label="Live now" />
          <StatBig value={pendingTeams} label="Pending payment" />
        </div>

        {/* Tab bar */}
        <div className="row" style={{ gap: 4, marginBottom: 24, borderBottom: "1px solid var(--border)" }}>
          {[
            { id: "payments",   label: "Payments" },
            { id: "schedule",   label: "Schedule" },
            { id: "bracket",    label: "Scores" },
            { id: "reschedule", label: `Reschedule${rescheduleRequests.filter(r => r.status === "pending" || r.status === "chat_created" || r.status === "proposed").length > 0 ? ` (${rescheduleRequests.filter(r => r.status === "pending" || r.status === "chat_created" || r.status === "proposed").length})` : ""}` },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "12px 16px",
                border: 0,
                background: "transparent",
                borderBottom: "2px solid " + (tab === t.id ? "var(--fg)" : "transparent"),
                color: tab === t.id ? "var(--fg)" : "var(--fg-3)",
                fontWeight: 600,
                fontSize: 14,
                marginBottom: -1,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >{t.label}</button>
          ))}
        </div>

        {/* PAYMENTS TAB */}
        {tab === "payments" && (
          <>
            <div className="row" style={{ gap: 6, marginBottom: 16 }}>
              {["all", "paid", "unpaid"].map(f => (
                <button key={f} className={`btn btn-sm ${filterPayment === f ? "btn-primary" : ""}`}
                  onClick={() => setFilterPayment(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <table className="data">
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Captain</th>
                    <th>Email</th>
                    <th>Division</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--fg-3)", padding: 32 }}>No teams found.</td></tr>
                  ) : filteredTeams.map(t => (
                    <tr key={t.id}>
                      <td>
                        <div className="row" style={{ gap: 10 }}>
                          <div style={{ width: 22, height: 22, borderRadius: 5, background: t.color, display: "grid", placeItems: "center", fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink)", fontWeight: 600 }}>
                            {t.short}
                          </div>
                          <span style={{ fontWeight: 600 }}>{t.name}</span>
                        </div>
                      </td>
                      <td className="muted">{t.captain || "—"}</td>
                      <td className="mono muted" style={{ fontSize: 11 }}>{t.captainEmail || "—"}</td>
                      <td><Tag>{(t.division || "open").toUpperCase()}</Tag></td>
                      <td>
                        {t.paymentStatus === "paid"
                          ? <Tag kind="ok">Paid</Tag>
                          : <Tag>Unpaid</Tag>}
                      </td>
                      <td>
                        <button
                          className={`btn btn-sm ${t.paymentStatus === "paid" ? "" : "btn-primary"}`}
                          onClick={() => togglePayment(t)}
                        >
                          {t.paymentStatus === "paid" ? "Mark unpaid" : "Mark paid"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* SCHEDULE TAB */}
        {tab === "schedule" && (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="row between" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
              <h3 className="h3">All games</h3>
              <span className="mono muted" style={{ fontSize: 11 }}>{GAMES.length} TOTAL</span>
            </div>
            <table className="data">
              <thead>
                <tr><th>Date</th><th>Time</th><th>Matchup</th><th>Court</th><th>Round</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {GAMES.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--fg-3)", padding: 32 }}>No games in database.</td></tr>
                ) : GAMES.map(g => (
                  <tr key={g.id}>
                    <td className="mono" style={{ fontSize: 12 }}>{g.date}</td>
                    <td className="mono num-tabular" style={{ fontSize: 12 }}>{g.time}</td>
                    <td>
                      <span style={{ fontWeight: 500 }}>{g.team1}</span>
                      <span className="muted"> vs. </span>
                      <span style={{ fontWeight: 500 }}>{g.team2}</span>
                    </td>
                    <td className="mono muted" style={{ fontSize: 12 }}>{g.court}</td>
                    <td><Tag>{g.round}</Tag></td>
                    <td>
                      {g.status === "Live" ? <LiveTag /> :
                       g.status === "Final" ? <Tag kind="ok">Final</Tag> :
                       <Tag>Scheduled</Tag>}
                    </td>
                    <td>
                      <div className="row" style={{ gap: 4 }}>
                        <button className="btn btn-sm" onClick={() => openScoreEdit(g)}>Score</button>
                        {g.status === "Scheduled" && (
                          <button className="btn btn-sm btn-primary" onClick={() => markGameLive(g)}>Go live</button>
                        )}
                        {g.status === "Live" && (
                          <button className="btn btn-sm" onClick={() => markGameFinal(g)}>Final</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SCORES TAB */}
        {tab === "bracket" && (
          <div>
            {editGame ? (
              <div className="card" style={{ maxWidth: 480 }}>
                <Eyebrow>Update score</Eyebrow>
                <h3 className="h3" style={{ margin: "4px 0 16px" }}>{editGame.team1} vs. {editGame.team2}</h3>
                <div className="grid-2" style={{ marginBottom: 20 }}>
                  <div className="field">
                    <label>{editGame.team1}</label>
                    <input type="number" min="0" value={scoreInput.score1}
                      onChange={e => setScoreInput(s => ({ ...s, score1: e.target.value }))} />
                  </div>
                  <div className="field">
                    <label>{editGame.team2}</label>
                    <input type="number" min="0" value={scoreInput.score2}
                      onChange={e => setScoreInput(s => ({ ...s, score2: e.target.value }))} />
                  </div>
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <button className="btn btn-primary" onClick={saveScore} disabled={saving}>
                    {saving ? "Saving…" : "Save score"}
                  </button>
                  <button className="btn" onClick={() => setEditGame(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <p style={{ color: "var(--fg-2)", marginBottom: 20, fontSize: 14 }}>
                  Select a game from the Schedule tab to update its score.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
                  {GAMES.filter(g => g.status === "Live" || g.status === "Scheduled").map(g => (
                    <div key={g.id} className="card" style={{ padding: 16 }}>
                      <div className="row between" style={{ marginBottom: 10 }}>
                        {g.status === "Live" ? <LiveTag /> : <Tag>{g.round}</Tag>}
                        <span className="mono muted" style={{ fontSize: 11 }}>{g.court}</span>
                      </div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{g.team1} vs. {g.team2}</div>
                      <div className="mono muted" style={{ fontSize: 12, marginBottom: 12 }}>{g.date} · {g.time}</div>
                      <button className="btn btn-sm btn-primary" onClick={() => openScoreEdit(g)}>Update score</button>
                    </div>
                  ))}
                  {GAMES.filter(g => g.status === "Live" || g.status === "Scheduled").length === 0 && (
                    <p style={{ color: "var(--fg-3)" }}>No active or scheduled games.</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}
        {/* RESCHEDULE TAB */}
        {tab === "reschedule" && (
          <div>
            {rescheduleRequests.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--fg-3)", padding: "60px 0", fontFamily: "var(--font-display)", letterSpacing: "0.2em" }}>
                NO RESCHEDULE REQUESTS
              </div>
            ) : (
              <div className="col" style={{ gap: 16 }}>
                {rescheduleRequests.map(req => {
                  const statusColor = { pending: "var(--gold)", chat_created: "var(--gold)", proposed: "#a78bfa", approved: "var(--green)", denied: "var(--fg-3)" };
                  const isPending = ["pending", "chat_created", "proposed"].includes(req.status);
                  return (
                    <div key={req.id} className="card" style={{ padding: 20, opacity: req.status === "denied" ? 0.5 : 1 }}>
                      <div className="row between" style={{ marginBottom: 12 }}>
                        <div>
                          <Eyebrow>{req.matchup || "Unknown matchup"}</Eyebrow>
                          <h3 className="h3" style={{ margin: "2px 0" }}>{req.requestingTeamName || "—"} requested reschedule</h3>
                        </div>
                        <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "0.1em", padding: "3px 8px", borderRadius: 4, border: `1px solid ${statusColor[req.status] || "var(--border)"}`, color: statusColor[req.status] || "var(--fg-3)" }}>
                          {req.status.toUpperCase().replace("_", " ")}
                        </span>
                      </div>
                      <div className="grid-2" style={{ marginBottom: 12, gap: 8 }}>
                        {[
                          ["Original Date", req.originalDate],
                          ["Original Time", req.originalTime],
                          ["Court", req.originalCourt],
                          ["Reason", req.reason],
                          ["Requested by", req.requestingCaptainEmail],
                          ["Submitted", req.createdAt ? req.createdAt.slice(0, 10) : "—"],
                        ].map(([k, v]) => (
                          <div key={k} style={{ fontSize: 12 }}>
                            <span className="mono" style={{ fontSize: 10, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block" }}>{k}</span>
                            <span>{v || "—"}</span>
                          </div>
                        ))}
                      </div>
                      {req.groupMeChatId && (
                        <div style={{ fontSize: 12, color: "var(--fg-3)", marginBottom: 12 }}>
                          GroupMe Group ID: <span className="mono">{req.groupMeChatId}</span>
                          {req.groupMeShareUrl && (
                            <a href={req.groupMeShareUrl} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8, color: "var(--gold)" }}>Open chat →</a>
                          )}
                        </div>
                      )}
                      {req.status === "chat_failed" && (
                        <div style={{ fontSize: 12, color: "var(--red)", marginBottom: 12, padding: "8px 12px", border: "1px solid var(--red)", borderRadius: "var(--radius)" }}>
                          GroupMe chat creation failed. Captains were notified via email fallback.
                        </div>
                      )}
                      {isPending && (
                        <div className="row" style={{ gap: 8 }}>
                          <button className="btn btn-sm btn-gold" onClick={() => { setApproveModal(req); setNewDate(req.proposedDate || ""); setNewTime(req.proposedTime || ""); setNewCourt(req.originalCourt || ""); }}>
                            Approve & Set New Time
                          </button>
                          <button className="btn btn-sm" onClick={() => denyReschedule(req)}>Deny</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Approve Reschedule Modal */}
      {approveModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setApproveModal(null); }}>
          <div className="card" style={{ maxWidth: 440, width: "100%", padding: 32 }}>
            <Eyebrow>Approve Reschedule</Eyebrow>
            <h3 className="h3" style={{ margin: "4px 0 20px" }}>{approveModal.matchup}</h3>
            <div className="col" style={{ gap: 14, marginBottom: 24 }}>
              <div className="field">
                <label>New date</label>
                <input value={newDate} onChange={e => setNewDate(e.target.value)} placeholder="e.g. 2026-05-15" />
              </div>
              <div className="field">
                <label>New time</label>
                <input value={newTime} onChange={e => setNewTime(e.target.value)} placeholder="e.g. 3:00 PM" />
              </div>
              <div className="field">
                <label>Court (leave blank to keep original)</label>
                <input value={newCourt} onChange={e => setNewCourt(e.target.value)} placeholder={approveModal.originalCourt || "Court"} />
              </div>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn btn-gold" onClick={approveReschedule} disabled={approving} style={{ opacity: approving ? 0.6 : 1 }}>
                {approving ? "Saving…" : "Confirm & Update Game"}
              </button>
              <button className="btn" onClick={() => setApproveModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

window.Admin = Admin;
