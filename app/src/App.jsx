import "./App.css";

import { useState } from "react";
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

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

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

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-content">
        <Navbar
          user={user}
          onMenuClick={() =>
            setSidebarOpen(true)
          }
        />

        <main className="page-content">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;