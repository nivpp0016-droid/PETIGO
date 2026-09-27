import { useEffect, useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Lock,
  Unlock,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Trash2,
  CheckCircle2
} from "lucide-react";

import { getActivities, clearActivities } from "../services/api";
import { formatISTTime } from "../utils/time";

function Security() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Show compact list (4-5 items) by default, expand with Show More
  const [showAll, setShowAll] = useState(false);
  const DEFAULT_LIMIT = 5;

  async function loadSecurityLogs(showLoading = true) {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");
      const data = await getActivities();
      const securityEvents = (data.activities || []).filter(
        (activity) => activity.type === "security" || activity.type === "otp" || activity.type === "lock"
      );
      setActivities(securityEvents.length > 0 ? securityEvents : (data.activities || []));
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to load security activity.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadSecurityLogs();
    const interval = setInterval(() => {
      loadSecurityLogs(false);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  async function handleClearLogs() {
    if (!window.confirm("Are you sure you want to clear all security activity logs?")) {
      return;
    }

    try {
      setActivities([]);
      await clearActivities();
      setNotice("Security logs cleared successfully.");
      setTimeout(() => setNotice(""), 3500);
    } catch (err) {
      console.error("Failed to clear security logs:", err);
      setError("Failed to clear security logs.");
      loadSecurityLogs(false);
    }
  }

  function getEventIcon(event = "") {
    const normalized = event.toUpperCase();
    if (normalized.includes("UNLOCK")) return Unlock;
    if (normalized.includes("LOCK")) return Lock;
    if (normalized.includes("OTP")) return KeyRound;
    if (normalized.includes("FAILED") || normalized.includes("INVALID")) return ShieldAlert;
    return ShieldCheck;
  }

  const visibleActivities = showAll
    ? activities
    : activities.slice(0, DEFAULT_LIMIT);

  return (
    <div className="security-page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">AUDIT TRAIL</span>
          <h1>Security & Access Logs</h1>
          <p>Continuous audit logs of solenoid activations, OTP validations, and door states.</p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {activities.length > 0 && (
            <button
              className="btn-secondary-white"
              style={{
                background: "var(--surface)",
                color: "var(--error)",
                border: "1px solid var(--border)",
                fontSize: "0.85rem",
                padding: "8px 14px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
              onClick={handleClearLogs}
              title="Clear all security audit logs"
            >
              <Trash2 size={15} />
              <span>Clear Logs</span>
            </button>
          )}

          <button
            className="btn-secondary-white"
            style={{
              background: "var(--surface)",
              color: "var(--primary-navy)",
              border: "1px solid var(--border)",
              fontSize: "0.85rem",
              padding: "8px 16px"
            }}
            onClick={() => loadSecurityLogs(false)}
            disabled={refreshing}
          >
            <RefreshCw size={15} className={refreshing ? "spin" : ""} />
            <span>{refreshing ? "Refreshing..." : "Refresh Logs"}</span>
          </button>
        </div>
      </div>

      {notice && (
        <div
          style={{
            padding: "12px 18px",
            background: "var(--success-light)",
            border: "1px solid var(--success-border)",
            borderRadius: "var(--radius-md)",
            color: "var(--success)",
            fontWeight: 600,
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <CheckCircle2 size={16} />
          <span>{notice}</span>
        </div>
      )}

      {/* Security Status Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, var(--dark-navy) 0%, var(--primary-navy) 100%)",
          borderRadius: "var(--radius-xl)",
          padding: "24px 28px",
          color: "var(--surface)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "28px",
          boxShadow: "var(--shadow-md)",
          border: "1px solid rgba(255,255,255,0.08)",
          flexWrap: "wrap",
          gap: "16px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              background: "rgba(34, 160, 107, 0.2)",
              border: "1.5px solid var(--success)",
              color: "var(--success)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <ShieldCheck size={26} />
          </div>

          <div>
            <strong style={{ fontSize: "1.1rem", display: "block" }}>
              Active Tamper & Solenoid Surveillance
            </strong>
            <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>
              All door open/close transitions and verification attempts are recorded in real-time.
            </span>
          </div>
        </div>

        <div
          style={{
            background: "rgba(34, 160, 107, 0.18)",
            color: "#34D399",
            border: "1px solid rgba(34, 160, 107, 0.35)",
            padding: "6px 14px",
            borderRadius: "var(--radius-pill)",
            fontSize: "0.82rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--success)" }} />
          <span>System Guard Protected</span>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "14px 20px",
            background: "var(--error-light)",
            border: "1px solid var(--error-border)",
            borderRadius: "var(--radius-md)",
            color: "var(--error)",
            fontWeight: 600,
            marginBottom: "24px"
          }}
        >
          {error}
        </div>
      )}

      {/* Security Event Card */}
      <div className="activity-card" style={{ padding: "30px" }}>
        <div className="activity-card-header">
          <h3>Recent Security Events</h3>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--primary-orange)",
              background: "var(--orange-subtle)",
              padding: "4px 10px",
              borderRadius: "var(--radius-pill)"
            }}
          >
            Showing {visibleActivities.length} of {activities.length}
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div className="loading-spinner" style={{ margin: "0 auto 12px" }} />
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading security logs...</p>
          </div>
        ) : activities.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <ShieldCheck size={36} style={{ color: "var(--text-light)", margin: "0 auto 12px" }} />
            <h4 style={{ color: "var(--primary-navy)", marginBottom: "4px" }}>No Security Incidents</h4>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
              Your PETIGO box has no alerts or failed attempts.
            </p>
          </div>
        ) : (
          <>
            <div className="activity-list">
              {visibleActivities.map((activity, index) => {
                const Icon = getEventIcon(activity.title);
                const isWarning =
                  (activity.title || "").toUpperCase().includes("UNLOCK") ||
                  (activity.title || "").toUpperCase().includes("OPEN");

                return (
                  <div key={index} className="activity-item">
                    <div
                      className={`activity-icon-badge ${
                        isWarning ? "delivery" : "security"
                      }`}
                    >
                      <Icon size={18} />
                    </div>

                    <div className="activity-content">
                      <strong>{activity.title}</strong>
                      <p>{activity.description || "Chamber sensor triggered"}</p>
                    </div>

                    <span className="activity-time">
                      {activity.created_at
                        ? formatISTTime(activity.created_at, { includeSeconds: true })
                        : "Just now"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Show More / Show Less Toggle Button */}
            {activities.length > DEFAULT_LIMIT && (
              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <button
                  type="button"
                  onClick={() => setShowAll(!showAll)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 20px",
                    borderRadius: "var(--radius-pill)",
                    border: "1.5px solid var(--border)",
                    background: "var(--surface)",
                    color: "var(--primary-navy)",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "var(--shadow-xs)",
                    transition: "all var(--transition-fast)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--primary-orange)";
                    e.currentTarget.style.color = "var(--primary-orange)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--primary-navy)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {showAll ? (
                    <>
                      <span>Show Less</span>
                      <ChevronUp size={16} />
                    </>
                  ) : (
                    <>
                      <span>Show More ({activities.length - DEFAULT_LIMIT} more)</span>
                      <ChevronDown size={16} />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Security;