// IBA @ Purdue — React app root
// Wires Firebase auth, data loading, and screen routing

const App = () => {
  const [active, setActive] = React.useState("home");
  const [dataVersion, setDataVersion] = React.useState(0);
  const [user, setUser] = React.useState(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [authReady, setAuthReady] = React.useState(false);
  const [theme, setTheme] = React.useState("dark");
  const [bracketStyle, setBracketStyle] = React.useState("list");

  // Register data change callback so Firestore updates trigger re-renders
  React.useEffect(() => {
    const cb = () => setDataVersion(v => v + 1);
    window._ibaDataListeners.push(cb);
    return () => {
      window._ibaDataListeners = window._ibaDataListeners.filter(fn => fn !== cb);
    };
  }, []);

  // Apply theme to document
  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.density = "comfortable";
    document.documentElement.dataset.cardstyle = "bordered";
  }, [theme]);

  // Firebase auth listener
  React.useEffect(() => {
    function setupAuth() {
      if (!window.auth || !window.authImports) {
        setTimeout(setupAuth, 200);
        return;
      }
      window.authImports.onAuthStateChanged(window.auth, async (firebaseUser) => {
        setUser(firebaseUser);
        setAuthReady(true);

        if (firebaseUser) {
          // Check admin status
          try {
            const { doc, getDoc } = window.firestoreImports;
            const adminRef = doc(window.db, "approved_admins", firebaseUser.uid);
            const adminDoc = await getDoc(adminRef);
            setIsAdmin(adminDoc.exists());
          } catch {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      });
    }
    setupAuth();
  }, []);

  // Hide loading overlay once data is ready (or after 8s max)
  React.useEffect(() => {
    const hide = () => {
      const el = document.getElementById("fb-loading");
      if (el) { el.classList.add("hidden"); setTimeout(() => el.remove(), 500); }
    };
    if (!window.IBA_DATA.loading) { hide(); return; }
    const t = setTimeout(hide, 8000);
    return () => clearTimeout(t);
  }, [dataVersion]);

  const s = (Comp, props) => {
    if (typeof Comp !== "function") return <div style={{ padding: 40, color: "var(--fg-3)" }}>Screen unavailable.</div>;
    return <Comp {...props} />;
  };

  const screens = {
    home:      s(Home,      { onNav: setActive }),
    bracket:   s(Bracket,   { style: bracketStyle }),
    schedule:  s(Schedule,  { user }),
    standings: s(Standings, {}),
    teams:     s(Teams,     {}),
    register:  s(Register,  { user, onNav: setActive }),
    profile:   s(Profile,   { user, onNav: setActive }),
    admin:     s(Admin,     { user, isAdmin }),
  };

  return (
    <>
      <TopNav
        active={active}
        setActive={setActive}
        user={user}
        isAdmin={isAdmin}
        openMobile={() => {}}
      />
      <main>{screens[active] || screens.home}</main>

      <footer style={{
        borderTop: "1px solid var(--border)",
        padding: "40px var(--pad-5)",
        display: "flex", flexWrap: "wrap",
        justifyContent: "space-between", alignItems: "center",
        gap: 24, color: "var(--fg-3)", fontSize: 13,
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <img src="images/iba-logo.png" alt="IBA Purdue" style={{ height: 52, width: "auto", objectFit: "contain" }} />
          <span style={{ fontSize: 12 }}>Indian Basketball Association @ Purdue University</span>
        </div>
        <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
          <a href="mailto:ibapurdue@gmail.com" style={{ color: "var(--fg-3)", textDecoration: "none", fontSize: 13 }}
            onMouseOver={e => e.target.style.color = "var(--fg)"}
            onMouseOut={e => e.target.style.color = "var(--fg-3)"}>
            ibapurdue@gmail.com
          </a>
          <a href="https://www.instagram.com/iba.purdue/" target="_blank" rel="noopener noreferrer"
            style={{ color: "var(--fg-3)", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}
            onMouseOver={e => e.currentTarget.style.color = "var(--fg)"}
            onMouseOut={e => e.currentTarget.style.color = "var(--fg-3)"}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.7" fill="currentColor" />
            </svg>
            @iba.purdue
          </a>
        </div>
        <div style={{ fontSize: 11, color: "var(--fg-3)", opacity: 0.6 }}>
          © {new Date().getFullYear()} IBA Purdue
        </div>
      </footer>

      {/* Toast container */}
      <div id="iba-toast"></div>
    </>
  );
};

// Toast helper
window.showToast = (msg, kind = "") => {
  const container = document.getElementById("iba-toast");
  if (!container) return;
  const el = document.createElement("div");
  el.className = `toast ${kind}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4000);
};

// Wait for DOM and Firebase data listeners to be wired before rendering
function mountApp() {
  const root = document.getElementById("root");
  if (!root) return;
  ReactDOM.createRoot(root).render(<App />);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountApp);
} else {
  mountApp();
}
