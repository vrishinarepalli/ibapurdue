// Bracket screen — three layout styles

const BracketMatch = ({ match, compact }) => {
  const aWin = match.a.score != null && match.b.score != null && match.a.score > match.b.score;
  const bWin = match.a.score != null && match.b.score != null && match.b.score > match.a.score;
  return (
    <div className="bc-match">
      <div className={`bc-row ${aWin ? "win" : ""}`}>
        <span className="seed">{match.a.seed}</span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{match.a.name}</span>
        <span className="score">{match.a.score ?? "—"}</span>
      </div>
      <div className={`bc-row ${bWin ? "win" : ""}`}>
        <span className="seed">{match.b.seed}</span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{match.b.name}</span>
        <span className="score">{match.b.score ?? "—"}</span>
      </div>
    </div>
  );
};

const BracketClassic = ({ rounds }) => (
  <div className="bracket-classic">
    {rounds.map((r, ri) => {
      const gap = ri === 0 ? 12 : (ri === 1 ? 80 : ri === 2 ? 200 : 0);
      return (
        <div key={ri} className="round" style={{ gap, justifyContent: "center" }}>
          <div className="round-label">{r.label}</div>
          {r.matches.map((m, mi) => (
            <BracketMatch key={mi} match={m} />
          ))}
        </div>
      );
    })}
  </div>
);

const BracketList = ({ rounds }) => (
  <div className="bracket-list">
    {rounds.map((r, ri) => (
      <div key={ri} className="round-list">
        <h3>{r.label} <span style={{ color: "var(--fg-3)", marginLeft: 8 }}>· {r.matches.length} {r.matches.length === 1 ? "game" : "games"}</span></h3>
        <div className="matches">
          {r.matches.map((m, mi) => (
            <div key={mi} className="card" style={{ padding: 0 }}>
              <BracketMatch match={m} />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const BracketRadial = ({ rounds }) => {
  // place R16 around outer ring, QF closer, SF closer still, F at center
  const outer = rounds[0].matches;
  const r16Radius = 340;
  return (
    <div className="bracket-radial">
      <div className="center">
        Final<br/>
        <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.7 }}>
          Sun · 7pm
        </span>
      </div>
      {outer.map((m, i) => {
        const angle = (i / outer.length) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(angle) * r16Radius;
        const y = Math.sin(angle) * r16Radius;
        return (
          <div key={i} className="leaf" style={{
            left: `calc(50% + ${x}px)`,
            top: `calc(50% + ${y}px)`,
          }}>
            <BracketMatch match={m} />
          </div>
        );
      })}
      {rounds[1].matches.map((m, i) => {
        const angle = (i / rounds[1].matches.length) * Math.PI * 2 - Math.PI / 2 + Math.PI / rounds[1].matches.length;
        const x = Math.cos(angle) * 200;
        const y = Math.sin(angle) * 200;
        return (
          <div key={`qf${i}`} className="leaf" style={{
            left: `calc(50% + ${x}px)`,
            top: `calc(50% + ${y}px)`,
            opacity: 0.6,
            width: 160,
          }}>
            <BracketMatch match={m} />
          </div>
        );
      })}
    </div>
  );
};

const Bracket = ({ style }) => {
  const { BRACKET_ROUNDS } = window.IBA_DATA;
  const rounds = BRACKET_ROUNDS || [];
  return (
    <>
      <PageHeader
        eyebrow={`Single elimination · ${window.IBA_DATA.TEAMS.length} teams`}
        title="The <em>bracket</em>"
        lede=""
        actions={[
          <button key="1" className="btn btn-sm">Print PDF</button>,
        ]}
      />
      <div className="bracket-shell">
        {rounds.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--fg-3)", padding: "60px 0", fontFamily: "var(--font-display)", letterSpacing: "0.2em" }}>
            BRACKET NOT YET SET
          </div>
        )}
        {rounds.length > 0 && style === "classic" && <BracketClassic rounds={rounds} />}
        {rounds.length > 0 && style === "list"    && <BracketList rounds={rounds} />}
        {rounds.length > 0 && style === "radial"  && <BracketRadial rounds={rounds} />}
        {rounds.length > 0 && !style              && <BracketList rounds={rounds} />}
      </div>
    </>
  );
};

window.Bracket = Bracket;
