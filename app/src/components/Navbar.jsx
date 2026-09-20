import { Bell, Menu, Package } from "lucide-react";

function Navbar({ onMenuClick, user }) {
  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          className="mobile-menu-button"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <div className="brand">
          <div className="brand-icon">
            <Package size={21} />
          </div>

          <div className="brand-text">
            <strong>Universal</strong>
            <span>Smart Parcel</span>
          </div>
        </div>
      </div>

      <div className="navbar-right">
        <button
          className="icon-button"
          aria-label="Notifications"
        >
          <Bell size={20} />
          <span className="notification-dot" />
        </button>

        <div className="user-mini">
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>

          <div className="user-mini-info">
            <strong>{user?.name || "User"}</strong>
            <span>Owner</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;