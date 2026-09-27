import "./App.css";

import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Delivery from "./pages/Delivery";
import History from "./pages/History";
import Security from "./pages/Security";
import Settings from "./pages/Settings";
import {
  getStoredUser,
  login as loginAPI,
  logout as logoutAPI
} from "./services/api";

function App() {
  const [user, setUser] = useState(
    getStoredUser()
  );

  const [activePage, setActivePage] =
    useState("dashboard");

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 1024 : false
  );

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("petigo_sidebar_collapsed") === "true";
  });

  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      }
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isSidebarOpen = isMobile ? sidebarOpen : !sidebarCollapsed;

  function handleOpenSidebar() {
    if (isMobile) {
      setSidebarOpen(true);
    } else {
      setSidebarCollapsed(false);
      localStorage.setItem("petigo_sidebar_collapsed", "false");
    }
  }

  function handleCloseSidebar() {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarCollapsed(true);
      localStorage.setItem("petigo_sidebar_collapsed", "true");
    }
  }

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loginLoading, setLoginLoading] =
    useState(false);

  const [loginError, setLoginError] =
    useState("");

  async function handleLogin(event) {
    event.preventDefault();

    setLoginError("");
    setLoginLoading(true);

    try {
      const data = await loginAPI(
        email,
        password
      );

      localStorage.setItem(
        "token",
        data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      setUser(data.user);
      setActivePage("dashboard");
    } catch (error) {
      setLoginError(
        error.message || "Login failed"
      );
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    logoutAPI();

    setUser(null);
    setEmail("");
    setPassword("");
    setActivePage("dashboard");
  }

  if (!user) {
    return (
      <Login
        email={email}
        password={password}
        setEmail={setEmail}
        setPassword={setPassword}
        onLogin={handleLogin}
        loading={loginLoading}
        error={loginError}
      />
    );
  }

  function renderPage() {
    switch (activePage) {
      case "history":
        return (
          <History user={user} />
        );

      case "security":
        return (
          <Security user={user} />
        );

      case "delivery":
        return (
          <Delivery
            user={user}
            onBack={() => setActivePage("dashboard")}
          />
        );
        case "settings":
        return (
          <Settings user={user} />
        );

      case "dashboard":
      default:
        return (
          <Dashboard
            user={user}
            onNavigate={setActivePage}
          />
        );
    }
  }

  const appShellClasses = [
    "app-shell",
    sidebarCollapsed ? "sidebar-collapsed" : "",
    (isMobile && sidebarOpen) ? "mobile-sidebar-open" : ""
  ].filter(Boolean).join(" ");

  return (
    <div className={appShellClasses}>
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        isMobile={isMobile}
      />

      <div className="main-content">
        <Navbar
          user={user}
          onNavigate={setActivePage}
          isSidebarOpen={isSidebarOpen}
          onOpenSidebar={handleOpenSidebar}
        />

        <main className="page-content">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;