import { Bell, Menu, Package, Wifi } from "lucide-react";

function Navbar({
  user,
  onNavigate,
  isSidebarOpen,
  onOpenSidebar
}) {
  return (
    <header className="navbar">
      <div className="navbar-left">
        {/* Navbar Hamburger: ONLY shown when sidebar is CLOSED/COLLAPSED */}
        {!isSidebarOpen && (
          <button
            className="sidebar-menu-3lines-btn"
            onClick={onOpenSidebar}
            aria-label="Open sidebar"
            title="Open sidebar"
          >
            <Menu size={22} />
          </button>
        )}

        {/* Brand emblem shown in navbar only when sidebar is closed */}
        {!isSidebarOpen && (
          <div className="navbar-brand-emblem is-visible">
            <div className="brand-badge-shape navbar-logo-shape">
              <img src="/petigo-logo.png" alt="PETIGO" />
            </div>
            <strong className="navbar-brand-name">
              PETI<span>GO</span>
            </strong>
          </div>
        )}

        {/* Connection pill */}
        <div className="navbar-box-pill">
          <Wifi size={13} style={{ color: "var(--success)" }} />
          <span className="pill-box-code">BOX001</span>
          <span className="pill-dot">•</span>
          <span className="pill-status-text">Online</span>
        </div>
      </div>

      <div className="navbar-right">
        {onNavigate && (
          <button
            className="navbar-quick-action desktop-only"
            onClick={() => onNavigate("delivery")}
            title="Open delivery access portal"
          >
            <Package size={15} />
            <span>Delivery Access</span>
          </button>
        )}

        <button
          className="icon-button"
          aria-label="Notifications"
          title="System notifications"
        >
          <Bell size={18} />
          <span className="notification-badge" />
        </button>

        <div className="user-mini">
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase() || "P"}
          </div>

          <div className="user-mini-info desktop-only">
            <strong>{user?.name || "Admin"}</strong>
            <span>Box Owner</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;