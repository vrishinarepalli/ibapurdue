// Top navigation — Firebase auth wired

const NAV_ITEMS = [
  { id: "home",      label: "Home" },
  { id: "bracket",   label: "League" },
  { id: "teams",     label: "Teams" },
  { id: "schedule",  label: "Games" },
  { id: "standings", label: "Stats" },
  { id: "register",  label: "Join" },
  { id: "profile",   label: "Profile" },
  { id: "admin",     label: "Admin" },
];

const TopNav = ({ active, setActive, openMobile, user, isAdmin }) => {
  const handleSignIn = () => {
    if (window.signInWithGoogle) {
      window.signInWithGoogle();
    }
  };

  const handleSignOut = () => {
    if (window.auth && window.authImports) {
      window.authImports.signOut(window.auth).catch(console.error);
    }
  };

  const initials = user
    ? (user.displayName || user.email || "?").split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "";

  const visibleNav = NAV_ITEMS.filter(item => {
    if (item.id === "admin" && !isAdmin) return false;
    if (item.id === "profile" && !user) return false;
    return true;
  });

  return (
    <header className="topnav">
      <div className="topnav-brand" style={{ cursor: "pointer" }} onClick={() => setActive("home")}>
        <div className="topnav-mark"></div>
        <div>
          <div className="name">IBA</div>
          <div className="sub">PURDUE</div>
        </div>
      </div>

      <nav>
        <div className="topnav-links">
          {visibleNav.map(item => (
            <button
              key={item.id}
              className="topnav-link"
              data-active={active === item.id}
              onClick={() => setActive(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="topnav-right">
        <button className="topnav-icon" title="Instagram" aria-label="Instagram"
          onClick={() => window.open("https://www.instagram.com/iba.purdue/", "_blank")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.7" fill="currentColor" />
          </svg>
        </button>

        {user ? (
          <button className="topnav-user" onClick={handleSignOut} title="Sign out">
            <div className="avatar" style={{ width: 28, height: 28, fontSize: 11, background: "var(--gold)" }}>
              {initials}
            </div>
            <span style={{ fontSize: 12, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.displayName || user.email.split("@")[0]}
            </span>
          </button>
        ) : (
          <button className="btn btn-sm" onClick={handleSignIn}>Sign in</button>
        )}

        <button className="btn btn-gold btn-sm" onClick={() => setActive("register")}>Join IBA</button>
      </div>
    </header>
  );
};

window.TopNav = TopNav;
