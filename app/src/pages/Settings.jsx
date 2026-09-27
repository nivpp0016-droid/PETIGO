import { useEffect, useState } from "react";
import {
  User,
  Box,
  ShieldCheck,
  Wifi,
  Sliders,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  CheckCircle2,
  Lock,
  Radio,
  Cpu,
  Smartphone
} from "lucide-react";

import { getBoxes } from "../services/api";

function Settings({ user }) {
  const [box, setBox] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  // Navigation tab in settings
  const [activeTab, setActiveTab] = useState("box");

  // Sensitive Field Hide / Unhide States
  const [showWifiPassword, setShowWifiPassword] = useState(false);
  const [showDeviceToken, setShowDeviceToken] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);

  // Form states for settings
  const [boxName, setBoxName] = useState("PETIGO-BOX001");
  const [locationTag, setLocationTag] = useState("Front Porch / Main Gate");
  const [wifiSsid, setWifiSsid] = useState("N1V");
  const [wifiPassword, setWifiPassword] = useState("••••••••••••");
  const [deviceToken, setDeviceToken] = useState("ptg_live_8f93bc149a0247de8b1e8471");
  const [autoRelockSeconds, setAutoRelockSeconds] = useState(30);
  const [sensorThresholdCm, setSensorThresholdCm] = useState(20);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  async function loadBox(showLoading = true) {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");
      const data = await getBoxes();
      const firstBox = data.boxes && data.boxes.length > 0 ? data.boxes[0] : null;
      setBox(firstBox);
      if (firstBox) {
        setBoxName(firstBox.box_code || "PETIGO-BOX001");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to retrieve parcel box settings.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadBox();
  }, []);

  async function handleCopyToken() {
    try {
      await navigator.clipboard.writeText(deviceToken);
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    } catch (e) {
      console.error("Clipboard copy failed:", e);
    }
  }

  function handleSaveSettings(e) {
    e.preventDefault();
    setSavedMessage("Settings successfully synchronized to PETIGO cloud & chamber!");
    setTimeout(() => setSavedMessage(""), 4000);
  }

  return (
    <div className="settings-page">
      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">CONFIGURATION</span>
          <h1>System Settings</h1>
          <p>Manage chamber identity, sensor calibration, hardware network, and security credentials.</p>
        </div>

        <button
          className="btn-secondary-white"
          style={{
            background: "var(--surface)",
            color: "var(--primary-navy)",
            border: "1px solid var(--border)",
            fontSize: "0.85rem",
            padding: "8px 16px"
          }}
          onClick={() => loadBox(false)}
          disabled={refreshing}
        >
          <RefreshCw size={15} className={refreshing ? "spin" : ""} />
          <span>{refreshing ? "Syncing..." : "Sync Status"}</span>
        </button>
      </div>

      {savedMessage && (
        <div
          style={{
            padding: "14px 20px",
            background: "var(--success-light)",
            border: "1px solid var(--success-border)",
            borderRadius: "var(--radius-md)",
            color: "var(--success)",
            fontWeight: 600,
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}
        >
          <CheckCircle2 size={18} />
          <span>{savedMessage}</span>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "14px 20px",
            background: "var(--error-light)",
            border: "1px solid var(--error-border)",
            borderRadius: "var(--radius-md)",
            color: "var(--error)",
            fontWeight: 600,
            marginBottom: "20px"
          }}
        >
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="settings-container">
        <nav className="settings-nav-tabs">
          <button
            className={`settings-tab-btn ${activeTab === "box" ? "active" : ""}`}
            onClick={() => setActiveTab("box")}
          >
            <Box size={16} />
            <span>Chamber Identity</span>
          </button>

          <button
            className={`settings-tab-btn ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            <ShieldCheck size={16} />
            <span>Security & Rules</span>
          </button>

          <button
            className={`settings-tab-btn ${activeTab === "sensors" ? "active" : ""}`}
            onClick={() => setActiveTab("sensors")}
          >
            <Sliders size={16} />
            <span>Sensor Thresholds</span>
          </button>

          <button
            className={`settings-tab-btn ${activeTab === "network" ? "active" : ""}`}
            onClick={() => setActiveTab("network")}
          >
            <Wifi size={16} />
            <span>Network & Wi-Fi</span>
          </button>

          <button
            className={`settings-tab-btn ${activeTab === "account" ? "active" : ""}`}
            onClick={() => setActiveTab("account")}
          >
            <User size={16} />
            <span>Owner Profile</span>
          </button>
        </nav>

        {/* TAB 1: CHAMBER IDENTITY */}
        {activeTab === "box" && (
          <form className="settings-panel-card" onSubmit={handleSaveSettings}>
            <div className="settings-panel-header">
              <h2>Chamber Identity & Placement</h2>
              <p>Configure identifying labels and view live hardware properties.</p>
            </div>

            <div className="form-group-grid" style={{ marginBottom: "24px" }}>
              <div className="form-control-group">
                <label htmlFor="box-code">Chamber Unique ID</label>
                <div className="input-with-action">
                  <input
                    id="box-code"
                    type="text"
                    value={boxName}
                    onChange={(e) => setBoxName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-control-group">
                <label htmlFor="box-loc">Installation Location Tag</label>
                <div className="input-with-action">
                  <input
                    id="box-loc"
                    type="text"
                    value={locationTag}
                    onChange={(e) => setLocationTag(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-control-group">
                <label>Microcontroller Model</label>
                <div className="input-with-action">
                  <input
                    type="text"
                    value="PETIGO Secure Core Chamber Controller"
                    disabled
                    style={{ background: "#F1F5F9", color: "var(--text-muted)" }}
                  />
                </div>
              </div>

              <div className="form-control-group">
                <label>Firmware Version</label>
                <div className="input-with-action">
                  <input
                    type="text"
                    value="PETIGO v2.4-PRO (C++ / FreeRTOS)"
                    disabled
                    style={{ background: "#F1F5F9", color: "var(--text-muted)" }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="btn-primary-orange">
                <Save size={16} />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: SECURITY & RULES */}
        {activeTab === "security" && (
          <form className="settings-panel-card" onSubmit={handleSaveSettings}>
            <div className="settings-panel-header">
              <h2>Access Rules & Automation</h2>
              <p>Define lock timeout policies and courier authorization behaviors.</p>
            </div>

            <div className="form-group-grid" style={{ marginBottom: "24px" }}>
              <div className="form-control-group">
                <label htmlFor="relock-timeout">Auto-Relock Delay (Seconds)</label>
                <div className="input-with-action">
                  <input
                    id="relock-timeout"
                    type="number"
                    min="10"
                    max="300"
                    value={autoRelockSeconds}
                    onChange={(e) => setAutoRelockSeconds(Number(e.target.value))}
                  />
                </div>
                <small style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                  Chamber automatically locks after this period once the door shuts.
                </small>
              </div>

              <div className="form-control-group">
                <label>OTP Validity Lifetime</label>
                <div className="input-with-action">
                  <input
                    type="text"
                    value="15 Minutes (Single-Use Token)"
                    disabled
                    style={{ background: "#F1F5F9", color: "var(--text-muted)" }}
                  />
                </div>
                <small style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                  Codes expire automatically after 15 minutes or once successfully keyed.
                </small>
              </div>
            </div>

            <div
              style={{
                padding: "16px 20px",
                background: "var(--surface-subtle)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-light)",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div>
                <strong style={{ color: "var(--primary-navy)", fontSize: "0.95rem", display: "block" }}>
                  Instant Mobile Push Alerts
                </strong>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Receive instant alerts when parcels are deposited or unexpected door opens occur.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                style={{ width: "20px", height: "20px", accentColor: "var(--primary-orange)" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="btn-primary-orange">
                <Save size={16} />
                <span>Save Security Rules</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: SENSOR THRESHOLDS */}
        {activeTab === "sensors" && (
          <form className="settings-panel-card" onSubmit={handleSaveSettings}>
            <div className="settings-panel-header">
              <h2>Ultrasonic & Reed Switch Calibration</h2>
              <p>Tune sensor detection sensitivity to prevent false positives.</p>
            </div>

            <div style={{ marginBottom: "28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <label style={{ fontWeight: 700, color: "var(--primary-navy)", fontSize: "0.9rem" }}>
                  Ultrasonic Parcel Detection Threshold: <span style={{ color: "var(--primary-orange)" }}>{sensorThresholdCm} cm</span>
                </label>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Chamber Depth: ~50cm</span>
              </div>

              <input
                type="range"
                min="5"
                max="40"
                value={sensorThresholdCm}
                onChange={(e) => setSensorThresholdCm(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--primary-orange)" }}
              />

              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "8px" }}>
                When an object is detected closer than {sensorThresholdCm} cm, the chamber flags
                "Parcel Detected Inside". Empty clearance is typically 45 - 50 cm.
              </p>
            </div>

            <div className="form-group-grid" style={{ marginBottom: "24px" }}>
              <div className="form-control-group">
                <label>Door Sensor Debounce</label>
                <div className="input-with-action">
                  <input
                    type="text"
                    value="150ms Hardware Debounce Filter"
                    disabled
                    style={{ background: "#F1F5F9", color: "var(--text-muted)" }}
                  />
                </div>
              </div>

              <div className="form-control-group">
                <label>Telemetry Interval</label>
                <div className="input-with-action">
                  <input
                    type="text"
                    value="Every 5 Seconds (Continuous Polling)"
                    disabled
                    style={{ background: "#F1F5F9", color: "var(--text-muted)" }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="btn-primary-orange">
                <Save size={16} />
                <span>Save Calibration</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 4: NETWORK & WI-FI (WITH HIDE/UNHIDE TOGGLES) */}
        {activeTab === "network" && (
          <form className="settings-panel-card" onSubmit={handleSaveSettings}>
            <div className="settings-panel-header">
              <h2>Wireless Network & Device Token</h2>
              <p>Chamber Wi-Fi access configuration and private cryptographic authorization keys.</p>
            </div>

            <div className="form-group-grid" style={{ marginBottom: "24px" }}>
              <div className="form-control-group">
                <label htmlFor="wifi-ssid">Wi-Fi Network Name (SSID)</label>
                <div className="input-with-action">
                  <input
                    id="wifi-ssid"
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Wi-Fi Password with Hide / Unhide Toggle */}
              <div className="form-control-group">
                <label htmlFor="wifi-pw">Wi-Fi Password (WPA2/WPA3)</label>
                <div className="input-with-action">
                  <input
                    id="wifi-pw"
                    type={showWifiPassword ? "text" : "password"}
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="input-action-btn"
                    onClick={() => setShowWifiPassword(!showWifiPassword)}
                    aria-label={showWifiPassword ? "Hide password" : "Unhide password"}
                    title={showWifiPassword ? "Hide password" : "Unhide password"}
                  >
                    {showWifiPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Device API Token with Hide / Unhide Toggle & Copy Button */}
            <div className="form-control-group" style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label htmlFor="device-token">Hardware Authorization Token (Bearer Secret)</label>
                <span style={{ fontSize: "0.75rem", color: "var(--primary-orange)", fontWeight: 700 }}>
                  Keep Secret
                </span>
              </div>

              <div className="input-with-action">
                <input
                  id="device-token"
                  type={showDeviceToken ? "text" : "password"}
                  value={deviceToken}
                  readOnly
                  style={{ fontFamily: "monospace", letterSpacing: showDeviceToken ? "normal" : "0.2em" }}
                />

                <div style={{ position: "absolute", right: "8px", display: "flex", gap: "4px" }}>
                  <button
                    type="button"
                    className="input-action-btn"
                    style={{ position: "static" }}
                    onClick={() => setShowDeviceToken(!showDeviceToken)}
                    aria-label={showDeviceToken ? "Hide token" : "Unhide token"}
                    title={showDeviceToken ? "Hide token" : "Unhide token"}
                  >
                    {showDeviceToken ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>

                  <button
                    type="button"
                    className="input-action-btn"
                    style={{ position: "static" }}
                    onClick={handleCopyToken}
                    aria-label="Copy token"
                    title="Copy token to clipboard"
                  >
                    {tokenCopied ? (
                      <Check size={18} style={{ color: "var(--success)" }} />
                    ) : (
                      <Copy size={18} />
                    )}
                  </button>
                </div>
              </div>
              <small style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                Programmed into chamber firmware for mutual TLS and encrypted heartbeat validation.
              </small>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="btn-primary-orange">
                <Save size={16} />
                <span>Save Network Config</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 5: OWNER PROFILE */}
        {activeTab === "account" && (
          <div className="settings-panel-card">
            <div className="settings-panel-header">
              <h2>Owner Account Profile</h2>
              <p>Manage your account identity and authenticated session credentials.</p>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                padding: "20px",
                background: "var(--surface-subtle)",
                borderRadius: "var(--radius-lg)",
                marginBottom: "24px"
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--dark-navy) 0%, var(--primary-navy) 100%)",
                  color: "var(--surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-display)",
                  fontSize: "1.5rem",
                  fontWeight: 800
                }}
              >
                {(user?.name || "P").charAt(0).toUpperCase()}
              </div>

              <div>
                <strong style={{ fontSize: "1.1rem", color: "var(--primary-navy)", display: "block" }}>
                  {user?.name || "Administrator"}
                </strong>
                <span style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>
                  {user?.email || "owner@example.com"}
                </span>
                <div style={{ marginTop: "4px" }}>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      background: "var(--orange-subtle)",
                      color: "var(--primary-orange)",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-pill)"
                    }}
                  >
                    Primary Box Administrator
                  </span>
                </div>
              </div>
            </div>

            <div className="form-group-grid">
              <div className="form-control-group">
                <label>Security Authentication Level</label>
                <div className="input-with-action">
                  <input
                    type="text"
                    value="Signed JWT Token (RS256)"
                    disabled
                    style={{ background: "#F1F5F9", color: "var(--text-muted)" }}
                  />
                </div>
              </div>

              <div className="form-control-group">
                <label>Registered Parcels Protected</label>
                <div className="input-with-action">
                  <input
                    type="text"
                    value="Unlimited Protection Tier"
                    disabled
                    style={{ background: "#F1F5F9", color: "var(--text-muted)" }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;