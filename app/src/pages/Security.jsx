import { useEffect, useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Lock,
  Unlock,
  Clock,
  RefreshCw
} from "lucide-react";

import { getActivities } from "../services/api";

function Security() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

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
        (activity) => activity.type === "security"
      );

      setActivities(securityEvents);
    } catch (err) {
      console.error(err);

      setError(
        err.message || "Unable to load security activity."
      );
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

  function getEventIcon(event = "") {
    const normalized = event.toUpperCase();

    if (normalized.includes("UNLOCK")) {
      return Unlock;
    }

    if (normalized.includes("LOCK")) {
      return Lock;
    }

    if (normalized.includes("OTP")) {
      return KeyRound;
    }

    if (
      normalized.includes("FAILED") ||
      normalized.includes("INVALID")
    ) {
      return ShieldAlert;
    }

    return ShieldCheck;
  }

  function getEventClass(event = "") {
    const normalized = event.toUpperCase();

    if (
      normalized.includes("FAILED") ||
      normalized.includes("INVALID")
    ) {
      return "security-event-danger";
    }

    if (normalized.includes("UNLOCK")) {
      return "security-event-warning";
    }

    return "security-event-success";
  }

  function formatEvent(event = "") {
    return event
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function formatDate(date) {
    if (!date) return "Unknown";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  return (
    <div className="security-page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">SECURITY CENTER</span>
          <h1>Your box is protected.</h1>
          <p>
            Monitor security events and access activity for your parcel box.
          </p>
        </div>

        <button
          className="security-refresh-button"
          onClick={() => loadSecurityLogs(false)}
          disabled={refreshing}
        >
          <RefreshCw
            size={15}
            className={refreshing ? "spin" : ""}
          />
          {refreshing ? "Refreshing" : "Refresh"}
        </button>
      </div>

      <div className="security-status-banner">
        <div className="security-status-large-icon">
          <ShieldCheck size={25} />
        </div>

        <div>
          <strong>Security monitoring active</strong>
          <span>
            Your parcel box security events are being recorded.
          </span>
        </div>

        <div className="security-protected-badge">
          <span />
          Protected
        </div>
      </div>

      {error && (
        <div className="security-error">
          <ShieldAlert size={17} />
          {error}
        </div>
      )}

      <div className="security-section-heading">
        <div>
          <h2>Security activity</h2>
          <p>Recent authentication and access events</p>
        </div>

        <div className="security-event-count">
          {activities.length} event
          {activities.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="security-events-card">
        {loading ? (
          <div className="security-loading">
            <div className="loading-spinner" />
            <span>Loading security activity...</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="security-empty">
            <div className="security-empty-icon">
              <ShieldCheck size={23} />
            </div>
            <h3>No security events yet</h3>
            <p>
              Security events from your parcel box will appear here.
            </p>
          </div>
        ) : (
          <div className="security-event-list">
            {activities.map((activity, index) => {
              const Icon = getEventIcon(activity.title);
              const eventClass = getEventClass(activity.title);

              return (
                <div
                  className="security-event"
                  key={`sec-${activity.id}-${index}`}
                >
                  <div
                    className={`security-event-icon ${eventClass}`}
                  >
                    <Icon size={18} />
                  </div>

                  <div className="security-event-content">
                    <strong>{formatEvent(activity.title)}</strong>
                    <span>
                      {activity.description ||
                        "Security event recorded"}
                    </span>
                  </div>

                  <div className="security-event-time">
                    <Clock size={13} />
                    {formatDate(activity.created_at)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Security;