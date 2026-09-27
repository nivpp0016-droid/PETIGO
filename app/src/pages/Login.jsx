import { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles
} from "lucide-react";

function Login({
  email,
  password,
  setEmail,
  setPassword,
  onLogin,
  loading,
  error
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="login-page">
      {/* Brand Visual Hero Showcase */}
      <section className="login-visual">
        <div className="login-brand-header">
          <div
            className="brand-badge-shape"
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "18px",
              padding: "6px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.25)"
            }}
          >
            <img
              src="/petigo-logo.png"
              alt="PETIGO Logo"
            />
          </div>

          <div className="login-brand-title">
            <strong>
              PETI<span>GO</span>
            </strong>
            <small>Your Smart Doorstep Box</small>
          </div>
        </div>

        <div className="login-hero-content">
          <div className="login-tag-pill">
            <Sparkles size={16} />
            <span>Next-Gen Smart Delivery Protection</span>
          </div>

          <h1>
            Your deliveries.
            <br />
            <span>Always protected.</span>
          </h1>

          <p>
            Seamlessly monitor your doorstep parcel chamber in real-time, issue
            dynamic one-time passwords, and control remote access with hardware-grade
            security.
          </p>
        </div>

        <div className="login-features-column">
          <div className="login-feature-card">
            <ShieldCheck size={22} />
            <div>
              <strong>Hardware OTP & Relay Security</strong>
              <span>Single-use authorization verified directly with chamber lock.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Authentication Form Panel */}
      <section className="login-panel">
        <div className="login-form-wrapper">
          <div className="mobile-login-logo">
            <div
              className="brand-badge-shape"
              style={{
                width: "72px",
                height: "72px",
                margin: "0 auto 12px",
                borderRadius: "18px",
                boxShadow: "0 6px 20px rgba(11,31,58,0.15)"
              }}
            >
              <img
                src="/petigo-logo.png"
                alt="PETIGO"
              />
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--primary-navy)", fontSize: "1.4rem" }}>
              PETI<span style={{ color: "var(--primary-orange)" }}>GO</span>
            </h2>
          </div>

          <div className="login-form-heading">
            <span className="page-eyebrow">OWNER PORTAL</span>
            <h2>Sign in to PETIGO</h2>
            <p>Access your live parcel box dashboard and controls.</p>
          </div>

          <form className="login-form" onSubmit={onLogin}>
            <div className="form-group">
              <label htmlFor="login-email">Email Address</label>
              <div className="login-input-container">
                <input
                  id="login-email"
                  type="email"
                  placeholder="owner@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label htmlFor="login-password">Password</label>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--primary-orange)",
                    cursor: "pointer"
                  }}
                  onClick={() => alert("Default test password is: password123")}
                >
                  Forgot password?
                </span>
              </div>

              {/* Password with Hide / Unhide Toggle */}
              <div className="login-input-container">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="login-toggle-pw"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-alert-error">
                <span>{error}</span>
              </div>
            )}

            <button
              className="login-submit-btn"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>Signing in...</>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div
            style={{
              marginTop: "24px",
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              background: "var(--surface-subtle)",
              border: "1px solid var(--border-light)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "0.82rem",
              color: "var(--text-muted)"
            }}
          >
            <ShieldCheck size={18} style={{ color: "var(--success)", flexShrink: 0 }} />
            <span>Secured with 256-bit encrypted session authorization.</span>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Login;