// Registration form — writes to Firestore


const Register = ({ user, onNav }) => {
  const [step, setStep] = React.useState(1);
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState("");
  const [team, setTeam] = React.useState({
    name: "", short: "",
    captain: user ? (user.displayName || "") : "",
  });
  const [roster, setRoster] = React.useState([{ name: "", email: "" }]);

  const next = () => setStep(s => Math.min(3, s + 1));
  const back = () => setStep(s => Math.max(1, s - 1));

  const handleSubmit = async () => {
    if (!window.db || !window.firestoreImports) {
      setError("Firebase not ready. Please try again.");
      return;
    }
    if (!team.name.trim()) { setError("Team name is required."); return; }
    if (!team.captainEmail.trim()) { setError("Captain email is required."); return; }

    const filledPlayers = roster.filter(r => r.name.trim());
    if (filledPlayers.length < 1) { setError("Add at least 1 player."); return; }

    setSubmitting(true);
    setError("");

    try {
      const { collection, addDoc } = window.firestoreImports;
      const captainEmail = user ? user.email : "";
      await addDoc(collection(window.db, "teams"), {
        name: team.name.trim(),
        short: team.short.trim() || team.name.trim().slice(0, 3).toUpperCase(),
        captain: team.captain.trim(),
        captainEmail,
        captainUid: user ? user.uid : null,
        roster: filledPlayers,
        wins: 0,
        losses: 0,
        pf: 0,
        pa: 0,
        paymentStatus: "unpaid",
        registeredAt: new Date().toISOString(),
      });

      setSuccess(true);
      if (window.showToast) window.showToast("Team registered! Welcome to IBA.", "ok");
    } catch (err) {
      console.error("Registration error:", err);
      setError("Failed to register: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <>
        <PageHeader
          eyebrow="Registration complete"
          title="You're <em>in.</em>"
          lede="Your team is registered. An admin will confirm your spot and reach out about payment."
        />
        <div className="page-body">
          <div className="card" style={{ maxWidth: 480, padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏀</div>
            <h2 className="h2" style={{ marginBottom: 12 }}>{team.name}</h2>
            <p style={{ color: "var(--fg-2)", marginBottom: 28 }}>
              Check your email at <strong>{team.captainEmail}</strong> for next steps.
            </p>
            <div className="row" style={{ gap: 10, justifyContent: "center" }}>
              <button className="btn" onClick={() => { setStep(1); setSuccess(false); setTeam({ name: "", short: "", captain: user ? (user.displayName || "") : "" }); setRoster([{ name: "", email: "" }]); }}>
                Register another team
              </button>
              <button className="btn btn-gold" onClick={() => onNav && onNav("teams")}>
                View teams
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="IBA Spring Season · Open registration"
        title="Register your <em>team</em>"
        lede="Free for current Purdue students. 4-player minimum, 8 max. Captain manages the roster."
      />
      <div className="page-body">
        <div className="row" style={{ gap: 32, alignItems: "flex-start" }}>
          {/* Step indicator */}
          <div style={{ width: 220, position: "sticky", top: 32, flexShrink: 0 }}>
            {[
              { n: 1, label: "Team info" },
              { n: 2, label: "Roster" },
              { n: 3, label: "Review & submit" },
            ].map(s => (
              <div key={s.n} className="row" style={{ gap: 12, padding: "12px 0", opacity: step === s.n ? 1 : step > s.n ? 0.6 : 0.35 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: step >= s.n ? "var(--fg)" : "transparent",
                  border: "1px solid var(--fg)",
                  color: step >= s.n ? "var(--bg)" : "var(--fg)",
                  display: "grid", placeItems: "center",
                  fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600,
                }}>{s.n}</div>
                <div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                    STEP {s.n} OF 3
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{s.label}</div>
                </div>
              </div>
            ))}

            {!user && (
              <div className="card" style={{ marginTop: 24, padding: 16, background: "color-mix(in oklch, var(--gold) 10%, transparent)", borderColor: "var(--gold)" }}>
                <p style={{ fontSize: 12, color: "var(--fg-2)", margin: 0 }}>
                  Sign in with your Google account to link this registration to your profile.
                </p>
                <button className="btn btn-sm btn-gold" style={{ marginTop: 10, width: "100%", justifyContent: "center" }}
                  onClick={() => window.signInWithGoogle && window.signInWithGoogle()}>
                  Sign in
                </button>
              </div>
            )}
          </div>

          {/* Step content */}
          <div className="card" style={{ flex: 1, padding: 40, maxWidth: 720 }}>
            {step === 1 && (
              <div className="col" style={{ gap: 20 }}>
                <h2 className="h2">Tell us about your team</h2>
                <div className="grid-2">
                  <div className="field">
                    <label>Team name</label>
                    <input value={team.name} onChange={e => setTeam({ ...team, name: e.target.value })} placeholder="e.g. The Boilers" />
                  </div>
                  <div className="field">
                    <label>Short tag (3 letters)</label>
                    <input value={team.short} onChange={e => setTeam({ ...team, short: e.target.value.toUpperCase().slice(0, 3) })} placeholder="BOI" maxLength="3" />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="field">
                    <label>Captain name</label>
                    <input value={team.captain} onChange={e => setTeam({ ...team, captain: e.target.value })} placeholder="Your name" />
                  </div>
                  <div className="field">
                    <label>Email</label>
                    <input value={user ? user.email : ""} readOnly style={{ opacity: 0.6, cursor: "not-allowed" }} placeholder="Sign in to auto-fill" type="email" />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="col" style={{ gap: 20 }}>
                <div className="row between">
                  <h2 className="h2">Roster</h2>
                  <span className="mono muted" style={{ fontSize: 11 }}>{roster.length}/8 PLAYERS · MIN 4</span>
                </div>
                {roster.map((p, i) => (
                  <div key={i} className="row" style={{ gap: 12 }}>
                    <span className="mono" style={{ width: 24, color: "var(--fg-3)", fontSize: 11 }}>{String(i + 1).padStart(2, "0")}</span>
                    <input
                      placeholder="Player name"
                      value={p.name}
                      onChange={e => { const r = [...roster]; r[i] = { ...r[i], name: e.target.value }; setRoster(r); }}
                      style={{ flex: 1, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--bg-elev)", color: "var(--fg)", font: "inherit", fontSize: 14 }}
                    />
                    <input
                      placeholder="Purdue email (optional)"
                      value={p.email}
                      onChange={e => { const r = [...roster]; r[i] = { ...r[i], email: e.target.value }; setRoster(r); }}
                      style={{ flex: 1, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--bg-elev)", color: "var(--fg)", font: "inherit", fontSize: 14 }}
                    />
                    {roster.length > 1 && (
                      <button className="btn btn-sm btn-ghost" onClick={() => setRoster(roster.filter((_, ii) => ii !== i))}>×</button>
                    )}
                  </div>
                ))}
                {roster.length < 8 && (
                  <button className="btn" style={{ alignSelf: "flex-start" }} onClick={() => setRoster([...roster, { name: "", email: "" }])}>
                    + Add player
                  </button>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="col" style={{ gap: 20 }}>
                <h2 className="h2">Looks good?</h2>
                <div className="card" style={{ background: "color-mix(in oklch, var(--accent-bg) 18%, transparent)", borderColor: "var(--gold)" }}>
                  <div className="row" style={{ gap: 16 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 12, background: "var(--gold)", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontSize: 18, color: "var(--ink)", fontWeight: 600 }}>
                      {team.short || "···"}
                    </div>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-display)", letterSpacing: "0.02em", textTransform: "uppercase" }}>
                        {team.name || "Your team"}
                      </div>
                      <div className="mono muted" style={{ fontSize: 12 }}>
                        {roster.filter(r => r.name).length} PLAYERS · CAPT. {team.captain || "—"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col" style={{ gap: 0 }}>
                  <div className="row between" style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                    <span>Registration fee</span><span className="mono">Free</span>
                  </div>
                  <div className="row between" style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                    <span>Jersey deposit (refundable)</span><span className="mono">$20</span>
                  </div>
                  <div className="row between" style={{ padding: "12px 0", fontWeight: 600 }}>
                    <span>Due at first game</span><span className="mono">$20</span>
                  </div>
                </div>

                <label className="row" style={{ gap: 10, fontSize: 13 }}>
                  <input type="checkbox" id="rulesCheck" />
                  <span>I've read the IBA rules and agree to the code of conduct.</span>
                </label>

                {error && (
                  <div style={{ color: "var(--red)", fontSize: 13, padding: "10px 14px", border: "1px solid var(--red)", borderRadius: "var(--radius)" }}>
                    {error}
                  </div>
                )}
              </div>
            )}

            <div className="row between" style={{ marginTop: 32 }}>
              <button className="btn" onClick={back} disabled={step === 1} style={{ opacity: step === 1 ? 0.4 : 1 }}>
                ← Back
              </button>
              {step < 3 ? (
                <button className="btn btn-primary" onClick={next}>Continue →</button>
              ) : (
                <button
                  className="btn btn-gold"
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{ opacity: submitting ? 0.6 : 1 }}
                >
                  {submitting ? "Submitting…" : "Submit registration ✓"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

window.Register = Register;
