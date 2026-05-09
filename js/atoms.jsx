// Shared UI atoms

const StripedPlaceholder = ({ label, className = "", style }) => (
  <div className={`placeholder ${className}`} style={style}>{label}</div>
);

const Tag = ({ kind, children }) => (
  <span className={`tag ${kind || ""}`}>{children}</span>
);

const LiveTag = () => (
  <span className="tag live"><span className="dot pulse"></span>LIVE</span>
);

const Avatar = ({ initials, size = 28, color }) => (
  <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.42, background: color }}>
    {initials}
  </div>
);

const Eyebrow = ({ children }) => <div className="eyebrow">{children}</div>;

const PageHeader = ({ eyebrow, title, lede, actions }) => (
  <div className="page-header">
    <div>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h1 className="h1" dangerouslySetInnerHTML={{ __html: title }} />
      {lede && <p className="lede" style={{ marginTop: 16 }}>{lede}</p>}
    </div>
    {actions && <div className="row">{actions}</div>}
  </div>
);

const Section = ({ title, sub, right, children, style }) => (
  <section className="section" style={style}>
    {(title || right) && (
      <div className="row between" style={{ marginBottom: 24 }}>
        <div>
          {sub && <Eyebrow>{sub}</Eyebrow>}
          {title && <h2 className="h2">{title}</h2>}
        </div>
        {right && <div className="row">{right}</div>}
      </div>
    )}
    {children}
  </section>
);

const StatBig = ({ value, label, accent }) => (
  <div className="stat-big" style={accent ? { borderColor: "var(--accent)" } : {}}>
    <div className="v">{value}</div>
    <div className="l">{label}</div>
  </div>
);

const TeamPill = ({ team, score, won, seed }) => (
  <div className="row" style={{ gap: 10, opacity: won === false ? 0.55 : 1 }}>
    {seed != null && <span className="mono" style={{ fontSize: 10, color: "var(--fg-3)", width: 16 }}>{seed}</span>}
    <div style={{
      width: 22, height: 22, borderRadius: 5,
      background: team?.color || "var(--border)",
      display: "grid", placeItems: "center",
      fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink)", fontWeight: 600
    }}>
      {team?.short || "·"}
    </div>
    <div style={{ flex: 1, fontSize: 14, fontWeight: won ? 600 : 500 }}>{team?.name || "TBD"}</div>
    {score != null && <span className="mono num-tabular" style={{ fontWeight: won ? 700 : 500 }}>{score}</span>}
  </div>
);

Object.assign(window, { StripedPlaceholder, Tag, LiveTag, Avatar, Eyebrow, PageHeader, Section, StatBig, TeamPill });
