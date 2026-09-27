import {
  LayoutDashboard,
  Package,
  History as HistoryIcon,
  ShieldCheck,
  Settings as SettingsIcon,
  LogOut,
  PanelLeftClose
} from "lucide-react";

function Sidebar({
  activePage,
  setActivePage,
  onLogout,
  isOpen,
  onClose,
  isMobile
}) {
  const navigation = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard
    },
    {
      id: "delivery",
      label: "Delivery Access",
      icon: Package
    },
    {
      id: "history",
      label: "Delivery History",
      icon: HistoryIcon
    },
    {
      id: "security",
      label: "Security & Logs",
      icon: ShieldCheck
    },
    {
      id: "settings",
      label: "Settings",
      icon: SettingsIcon
    }
  ];

  function handleNavigation(page) {
    setActivePage(page);
    if (isMobile && onClose) {
      onClose();
    }
  }

  return (
    <>
      {/* Mobile Backdrop Overlay - rendered only when on mobile drawer */}
      {isMobile && isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar ${
          isOpen ? "sidebar-open" : ""
        }`}
      >
        {/* Brand Header with Shaped White Logo Container */}
        <div className="sidebar-header">
          <div className="sidebar-brand-group">
            <div className="brand-badge-shape" title="PETIGO Brand Logo">
              <img
                src="/petigo-logo.png"
                alt="PETIGO"
              />
            </div>

            <div className="sidebar-brand-text">
              <strong>
                PETI<span>GO</span>
              </strong>
              <small>Smart Doorstep Box</small>
            </div>
          </div>

          {/* Single Collapse Button with PanelLeftClose icon */}
          <button
            className="sidebar-collapse-btn"
            onClick={onClose}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <PanelLeftClose size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Main Menu</span>

          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`sidebar-link ${
                activePage === id ? "sidebar-link-active" : ""
              }`}
              onClick={() => handleNavigation(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom Logout */}
        <div className="sidebar-bottom">
          <button
            className="sidebar-logout"
            onClick={onLogout}
            title="Sign out of PETIGO"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;