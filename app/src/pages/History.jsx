import { useEffect, useState } from "react";
import {
  Package,
  CheckCircle2,
  Clock,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  Inbox,
  AlertTriangle
} from "lucide-react";

import { getDeliveries, deleteDelivery, clearDeliveries } from "../services/api";
import { formatISTDateTime } from "../utils/time";

function History() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Show past 2-3 by default, expand with Show More
  const [showAll, setShowAll] = useState(false);
  const DEFAULT_LIMIT = 3;

  async function loadHistory(showLoading = true) {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");
      const data = await getDeliveries();
      setDeliveries(data.deliveries || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to load delivery history.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadHistory();
    const interval = setInterval(() => {
      loadHistory(false);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  async function handleDeleteDelivery(id) {
    if (!window.confirm("Are you sure you want to remove this delivery record?")) {
      return;
    }

    try {
      // Optimistic update
      setDeliveries((prev) => prev.filter((item) => item.id !== id));
      await deleteDelivery(id);
      setNotice("Delivery record deleted successfully.");
      setTimeout(() => setNotice(""), 3500);
    } catch (err) {
      console.error("Failed to delete delivery:", err);
      setError("Failed to delete delivery record.");
      loadHistory(false);
    }
  }

  async function handleClearAll() {
    if (!window.confirm("Are you sure you want to clear all delivery history?")) {
      return;
    }

    try {
      setDeliveries([]);
      await clearDeliveries();
      setNotice("All delivery history cleared.");
      setTimeout(() => setNotice(""), 3500);
    } catch (err) {
      console.error("Failed to clear deliveries:", err);
      setError("Failed to clear delivery history.");
      loadHistory(false);
    }
  }

  function formatDate(date) {
    if (!date) return "Recent";
    return formatISTDateTime(date, { includeYear: true });
  }

  const visibleDeliveries = showAll
    ? deliveries
    : deliveries.slice(0, DEFAULT_LIMIT);

  return (
    <div className="history-page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">DELIVERY TIMELINE</span>
          <h1>Parcel History</h1>
          <p>Complete record of courier drop-offs, access authorizations, and deposits.</p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {deliveries.length > 0 && (
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
              onClick={handleClearAll}
              title="Clear all delivery records"
            >
              <Trash2 size={15} />
              <span>Clear History</span>
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
            onClick={() => loadHistory(false)}
            disabled={refreshing}
          >
            <RefreshCw size={15} className={refreshing ? "spin" : ""} />
            <span>{refreshing ? "Syncing..." : "Sync Deliveries"}</span>
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

      {/* Main Delivery Table / Card */}
      <div className="activity-card" style={{ padding: "30px" }}>
        <div className="activity-card-header">
          <h3>Completed Deliveries</h3>
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
            Showing {visibleDeliveries.length} of {deliveries.length}
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div className="loading-spinner" style={{ margin: "0 auto 12px" }} />
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading delivery archives...</p>
          </div>
        ) : deliveries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <Inbox size={42} style={{ color: "var(--text-light)", margin: "0 auto 12px" }} />
            <h4 style={{ color: "var(--primary-navy)", fontSize: "1.1rem", marginBottom: "6px" }}>
              No Recorded Deliveries Yet
            </h4>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", maxWidth: "340px", margin: "0 auto" }}>
              When a courier enters an OTP or a parcel is detected in the chamber, the delivery record will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="activity-list">
              {visibleDeliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="activity-item"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: 0 }}>
                    <div
                      className="activity-icon-badge"
                      style={{ background: "var(--success-light)", color: "var(--success)", flexShrink: 0 }}
                    >
                      <CheckCircle2 size={18} />
                    </div>

                    <div className="activity-content">
                      <strong style={{ fontSize: "0.95rem" }}>
                        Delivered to {delivery.box_code || "PETIGO Chamber"}
                      </strong>
                      <p style={{ marginTop: "2px" }}>
                        Status: <span style={{ color: "var(--success)", fontWeight: 700 }}>Deposited & Secured</span>
                        {delivery.carrier ? ` • Carrier: ${delivery.carrier}` : ""}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-light)", fontSize: "0.78rem" }}>
                      <Clock size={13} />
                      <span>{formatDate(delivery.created_at)}</span>
                    </div>

                    {/* Delete Option Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteDelivery(delivery.id)}
                      title="Delete this delivery record"
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--text-light)",
                        padding: "6px",
                        borderRadius: "var(--radius-xs)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all var(--transition-fast)"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "var(--error)";
                        e.currentTarget.style.background = "var(--error-light)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--text-light)";
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Show More / Show Less Toggle Button */}
            {deliveries.length > DEFAULT_LIMIT && (
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
                      <span>Show More ({deliveries.length - DEFAULT_LIMIT} more)</span>
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

export default History;