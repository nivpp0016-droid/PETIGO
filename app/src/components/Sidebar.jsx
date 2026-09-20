import {
  LayoutDashboard,
  Package,
  ShieldCheck,
  Settings,
  LogOut,
  X
} from "lucide-react";

function Sidebar({
  activePage,
  setActivePage,
  onLogout,
  isOpen,
  onClose
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
      icon: Package
    },
    {
      id: "security",
      label: "Security",
      icon: ShieldCheck
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings
    }
  ];

  function handleNavigation(page) {
    setActivePage(page);

    // Close mobile sidebar after navigation
    if (onClose) {
      onClose();
    }
  }

  return (
    <>
      {/* Mobile overlay */}

      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}

      <aside
        className={`sidebar ${
          isOpen
            ? "sidebar-open"
            : ""
        }`}
      >

        {/* Logo */}

        <div className="sidebar-header">

          <div className="brand-mark">
            <Package size={19} />
          </div>

          <div className="brand-text">
            <strong>
              Smart Parcel
            </strong>

            <span>
              BOX SYSTEM
            </span>
          </div>

          <button
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>

        </div>

        {/* Navigation */}

        <nav className="sidebar-nav">

          <span className="sidebar-section-label">
            MENU
          </span>

          {navigation.map(
            ({
              id,
              label,
              icon: Icon
            }) => (
              <button
                key={id}
                className={`sidebar-link ${
                  activePage === id
                    ? "sidebar-link-active"
                    : ""
                }`}
                onClick={() =>
                  handleNavigation(id)
                }
              >
                <Icon size={17} />

                <span>
                  {label}
                </span>
              </button>
            )
          )}

        </nav>

        {/* Bottom */}

        <div className="sidebar-bottom">

          <div className="sidebar-status">

            <span className="sidebar-status-dot" />

            <div>
              <strong>
                System online
              </strong>

              <span>
                BOX001 connected
              </span>
            </div>

          </div>

          <button
            className="sidebar-logout"
            onClick={onLogout}
          >
            <LogOut size={16} />

            <span>
              Sign out
            </span>
          </button>

        </div>

      </aside>
    </>
  );
}

export default Sidebar;