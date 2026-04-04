import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useData } from "../context/DataContext";
import "./Layout.css";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: "GRID", shortcut: "D" },
  { path: "/response", label: "Auto Response", icon: "SHLD", shortcut: "A" },
  { path: "/nodes", label: "Node Explorer", icon: "NODE", shortcut: "N" },
  { path: "/heatmap", label: "Sleeper Heatmap", icon: "HEAT", shortcut: "H" },
  { path: "/threats", label: "Threat Intel", icon: "LOCK", shortcut: "T" },
  { path: "/schema", label: "Schema Monitor", icon: "CODE", shortcut: "S" },
  { path: "/report", label: "Report", icon: "FILE", shortcut: "R" },
];

export default function Layout({ children }) {
  const { data, loading } = useData();
  const location = useLocation();
  const [theme, setTheme] = useState("dark");
  const [uptime, setUptime] = useState(0);
  const [rotation, setRotation] = useState(600);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const interval = setInterval(() => {
      setUptime((prev) => prev + 1);
      setRotation((prev) => (prev <= 0 ? 600 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const summary = data?.summary || {};

  return (
    <div className="layout">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="aegis-logo">
            <span className="logo-bracket">[</span>
            <span className="logo-text">AEGIS ACTIVE</span>
            <span className="logo-bracket">]</span>
          </div>
        </div>
        <div className="header-center">
          <div className="header-metric">
            <span className="metric-label">NODES</span>
            <span className="metric-value">{summary.total_nodes || "---"}</span>
          </div>
          <div className="header-divider" />
          <div className="header-metric">
            <span className="metric-label">THREATS</span>
            <span className="metric-value threat">
              {summary.threats_detected || "---"}
            </span>
          </div>
          <div className="header-divider" />
          <div className="header-metric">
            <span className="metric-label">SCHEMA</span>
            <span className="metric-value">
              v{summary.current_schema_version || "-"}
            </span>
          </div>
          <div className="header-divider" />
          <div className="header-metric">
            <span className="metric-label">ROTATION</span>
            <span className="metric-value timer">{formatTime(rotation)}</span>
          </div>
        </div>
        <div className="header-right">
          <button
            className="btn-control"
            style={{ marginRight: "16px" }}
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          >
            THEME: {theme.toUpperCase()}
          </button>
          <span className="uptime-label">UPTIME</span>
          <span className="uptime-value">{formatTime(uptime)}</span>
        </div>
      </header>

      {/* Alert Banner */}
      {data && summary.threats_detected > 0 && (
        <div className="alert-banner">
          <span className="alert-blink">!!</span>
          <span>
            THREAT ADVISORY: {summary.threats_detected} compromised nodes
            detected across Nexus City infrastructure
          </span>
        </div>
      )}

      {/* Sidebar */}
      <nav className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">A</div>
          <div className="brand-text">
            <span className="brand-name">AEGIS</span>
            <span className="brand-sub">DEFENSE CONSOLE</span>
          </div>
        </div>

        <div className="sidebar-nav">
          <div className="nav-section-label">OPERATIONS</div>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="system-status">
            <div className="status-dot" />
            <span>System Online</span>
          </div>
          <div className="sidebar-stats">
            <div className="stat-row">
              <span className="text-dim">Clean</span>
              <span className="text-green">{summary.clean_nodes || 0}</span>
            </div>
            <div className="stat-row">
              <span className="text-dim">Threats</span>
              <span className="text-red">{summary.threats_detected || 0}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {loading ? (
          <div className="loading-screen">
            <div className="loading-spinner" />
            <span>INITIALIZING AEGIS DEFENSE SYSTEMS...</span>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
