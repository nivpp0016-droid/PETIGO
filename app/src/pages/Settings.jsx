import { useEffect, useState } from "react";
import {
  User,
  Box,
  ShieldCheck,
  Wifi,
  Lock,
  DoorClosed,
  Package,
  RefreshCw
} from "lucide-react";

import { getBoxes } from "../services/api";

function Settings({ user }) {
  const [box, setBox] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadBox(showLoading = true) {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const data = await getBoxes();

      const firstBox =
        data.boxes && data.boxes.length > 0
          ? data.boxes[0]
          : null;

      setBox(firstBox);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to load parcel box status."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadBox();

    const interval = setInterval(() => {
      loadBox(false);
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  function getStatusLabel(value) {
    if (!value) {
      return "Unknown";
    }

    return value
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  function isOnline() {
    return box?.status === "online";
  }

  return (
    <div className="settings-page">

      <div className="page-heading">

        <div>
          <span className="page-eyebrow">
            SETTINGS
          </span>

          <h1>
            System settings.
          </h1>

          <p>
            View your account and live parcel
            box configuration.
          </p>
        </div>

        <button
          className="settings-refresh-button"
          onClick={() => loadBox(false)}
          disabled={refreshing}
        >
          <RefreshCw
            size={15}
            className={
              refreshing ? "spin" : ""
            }
          />

          {refreshing
            ? "Refreshing"
            : "Refresh"}
        </button>

      </div>

      {error && (
        <div className="settings-error">
          {error}
        </div>
      )}

      <div className="settings-grid">

        {/* Account */}

        <section className="settings-card">

          <div className="settings-card-heading">

            <div className="settings-heading-icon">
              <User size={19} />
            </div>

            <div>
              <h2>Account</h2>

              <p>
                Your authenticated account
              </p>
            </div>

          </div>

          <div className="account-profile">

            <div className="account-avatar">
              {(user?.name || "U")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {user?.name || "User"}
              </strong>

              <span>
                {user?.email || "No email"}
              </span>
            </div>

          </div>

          <div className="settings-status-row">

            <span>
              Authentication
            </span>

            <strong className="status-active">
              Active
            </strong>

          </div>

        </section>

        {/* Parcel Box */}

        <section className="settings-card">

          <div className="settings-card-heading">

            <div className="settings-heading-icon">
              <Box size={19} />
            </div>

            <div>
              <h2>Parcel box</h2>

              <p>
                Live device configuration
              </p>
            </div>

          </div>

          {loading ? (
            <div className="settings-loading">
              <div className="loading-spinner" />

              <span>
                Loading parcel box...
              </span>
            </div>
          ) : !box ? (
            <div className="settings-empty">
              <Box size={22} />

              <strong>
                No parcel box found
              </strong>

              <span>
                Connect a parcel box to
                continue.
              </span>
            </div>
          ) : (
            <>
              <div className="settings-device">

                <div className="settings-device-icon">
                  <Box size={23} />
                </div>

                <div>
                  <strong>
                    {box.box_code}
                  </strong>

                  <span>
                    Smart Parcel Box
                  </span>
                </div>

                <span
                  className={
                    `settings-online ${
                      !isOnline()
                        ? "settings-offline"
                        : ""
                    }`
                  }
                >
                  <span />

                  {getStatusLabel(
                    box.status
                  )}
                </span>

              </div>

              <div className="settings-values">

                <div className="settings-value">

                  <Wifi size={16} />

                  <div>
                    <span>
                      Connection
                    </span>

                    <strong>
                      {getStatusLabel(
                        box.status
                      )}
                    </strong>
                  </div>

                </div>

                <div className="settings-value">

                  <Lock size={16} />

                  <div>
                    <span>
                      Lock
                    </span>

                    <strong>
                      {getStatusLabel(
                        box.lock_status
                      )}
                    </strong>
                  </div>

                </div>

                <div className="settings-value">

                  <DoorClosed size={16} />

                  <div>
                    <span>
                      Door
                    </span>

                    <strong>
                      {getStatusLabel(
                        box.door_status
                      )}
                    </strong>
                  </div>

                </div>

                <div className="settings-value">

                  <Package size={16} />

                  <div>
                    <span>
                      Parcel
                    </span>

                    <strong>
                      {getStatusLabel(
                        box.parcel_status
                      )}
                    </strong>
                  </div>

                </div>

              </div>
            </>
          )}

        </section>

        {/* Security */}

        <section className="settings-card settings-card-wide">

          <div className="settings-card-heading">

            <div className="settings-heading-icon">
              <ShieldCheck size={19} />
            </div>

            <div>
              <h2>Security</h2>

              <p>
                Security features currently
                enabled
              </p>
            </div>

          </div>

          <div className="security-settings-list">

            <div className="security-setting">

              <div className="security-setting-icon">
                <ShieldCheck size={17} />
              </div>

              <div>
                <strong>
                  JWT authentication
                </strong>

                <span>
                  API requests are protected
                  by authentication tokens.
                </span>
              </div>

              <span className="settings-enabled">
                Enabled
              </span>

            </div>

            <div className="security-setting">

              <div className="security-setting-icon">
                <Lock size={17} />
              </div>

              <div>
                <strong>
                  One-time passwords
                </strong>

                <span>
                  Delivery access uses
                  single-use OTP verification.
                </span>
              </div>

              <span className="settings-enabled">
                Enabled
              </span>

            </div>

            <div className="security-setting">

              <div className="security-setting-icon">
                <ShieldCheck size={17} />
              </div>

              <div>
                <strong>
                  Security logging
                </strong>

                <span>
                  Authentication and access
                  events are recorded.
                </span>
              </div>

              <span className="settings-enabled">
                Enabled
              </span>

            </div>

          </div>

        </section>

      </div>

    </div>
  );
}

export default Settings;