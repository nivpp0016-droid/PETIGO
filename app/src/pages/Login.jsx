import {
  ArrowRight,
  LockKeyhole,
  Package,
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
  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="login-brand">
          <div className="login-brand-icon">
            <Package size={22} />
          </div>

          <span>Universal Smart Parcel</span>
        </div>

        <div className="login-hero">
          <div className="hero-badge">
            <Sparkles size={15} />
            Smart delivery protection
          </div>

          <h1>
            Your parcels.
            <br />
            <span>Always protected.</span>
          </h1>

          <p>
            Monitor your smart parcel box, manage
            delivery access, and keep every delivery
            secure from one place.
          </p>
        </div>

        <div className="login-feature">
          <ShieldCheck size={20} />

          <div>
            <strong>Built for secure delivery</strong>
            <span>
              One-time access codes and real-time
              box monitoring.
            </span>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-form-container">
          <div className="mobile-login-logo">
            <div className="login-brand-icon">
              <Package size={22} />
            </div>
          </div>

          <div className="login-heading">
            <span>WELCOME BACK</span>

            <h2>Sign in to your account</h2>

            <p>
              Access your parcel box securely.
            </p>
          </div>

          <form
            className="login-form"
            onSubmit={onLogin}
          >
            <div className="form-field">
              <label htmlFor="email">
                Email address
              </label>

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                autoComplete="email"
                required
              />
            </div>

            <div className="form-field">
              <div className="field-label-row">
                <label htmlFor="password">
                  Password
                </label>

                <button
                  type="button"
                  className="forgot-password"
                >
                  Forgot password?
                </button>
              </div>

              <div className="password-input">
                <LockKeyhole size={18} />

                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            <button
              className="login-submit"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : "Sign in"}

              {!loading && (
                <ArrowRight size={18} />
              )}
            </button>
          </form>

          <div className="login-security">
            <ShieldCheck size={17} />

            <span>
              Your connection is protected and
              securely authenticated.
            </span>
          </div>

          <p className="login-footer">
            Universal Smart Parcel Box
            <span>•</span>
            Secure delivery platform
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;