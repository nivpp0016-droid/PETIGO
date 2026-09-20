import { useEffect, useState } from "react";
import {
  Package,
  CheckCircle2,
  Clock,
  RefreshCw
} from "lucide-react";

import { getDeliveries } from "../services/api";

function History() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

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

      setError(
        err.message ||
          "Unable to load delivery history."
      );
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

    return () => {
      clearInterval(interval);
    };
  }, []);

  function formatDate(date) {
    if (!date) {
      return "Unknown";
    }

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

  function getStatusLabel(status) {
    if (!status) {
      return "Unknown";
    }

    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  return (
    <div className="history-page">

      <div className="page-heading">
        <div>
          <span className="page-eyebrow">
            DELIVERY HISTORY
          </span>

          <h1>
            Your deliveries.
          </h1>

          <p>
            View the history of activity
            involving your parcel box.
          </p>
        </div>

        <button
          className="history-refresh-button"
          onClick={() => loadHistory(false)}
          disabled={refreshing}
        >
          <RefreshCw
            size={15}
            className={refreshing ? "spin" : ""}
          />

          {refreshing
            ? "Refreshing"
            : "Refresh"}
        </button>
      </div>

      <div className="history-summary">

        <div className="history-summary-icon">
          <Package size={21} />
        </div>

        <div>
          <strong>
            Delivery activity
          </strong>

          <span>
            Your completed and active
            deliveries will appear here.
          </span>
        </div>

      </div>

      {error && (
        <div className="history-error">
          {error}
        </div>
      )}

      <div className="history-section-heading">

        <div>
          <h2>
            Delivery timeline
          </h2>

          <p>
            Recent parcel activity
          </p>
        </div>

        <span>
          {deliveries.length} delivery
          {deliveries.length !== 1
            ? "ies"
            : ""}
        </span>

      </div>

      <div className="history-card">

        {loading ? (
          <div className="history-loading">

            <div className="loading-spinner" />

            <span>
              Loading delivery history...
            </span>

          </div>
        ) : deliveries.length === 0 ? (
          <div className="history-empty">

            <div className="history-empty-icon">
              <Package size={24} />
            </div>

            <h3>
              No deliveries yet
            </h3>

            <p>
              Once a delivery is recorded,
              it will appear here.
            </p>

          </div>
        ) : (
          <div className="history-list">

            {deliveries.map((delivery) => (
              <div
                className="history-item"
                key={delivery.id}
              >

                <div className="history-item-icon">
                  <CheckCircle2 size={19} />
                </div>

                <div className="history-item-content">

                  <strong>
                    {getStatusLabel(
                      delivery.status
                    )}
                  </strong>

                  <span>
                    {delivery.box_code}
                  </span>

                </div>

                <div className="history-item-time">

                  <Clock size={13} />

                  {formatDate(
                    delivery.created_at
                  )}

                </div>

              </div>
            ))}

          </div>
        )}

      </div>

    </div>
  );
}

export default History;