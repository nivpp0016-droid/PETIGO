import { useEffect, useState } from "react";
import {
  Lock,
  DoorOpen,
  Package,
  Wifi
} from "lucide-react";

import BoxCard from "../components/BoxCard";
import StatusCard from "../components/StatusCard";
import ActivityList from "../components/ActivityList";
import OTPModal from "../components/OTPModal";

import {
  getBoxes,
  generateOTP,
  getActivities,
  unlockBox
} from "../services/api";

function Dashboard({ user, onNavigate }) {
  const [box, setBox] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [generatingOtp, setGeneratingOtp] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [otpData, setOtpData] = useState(null);
  const [activities, setActivities] = useState([]);

  async function loadBox(showLoading = true) {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const data = await getBoxes();

      if (!data.boxes || data.boxes.length === 0) {
        setError("No parcel box found.");
        setBox(null);
        return;
      }

      setBox(data.boxes[0]);

      const activityData = await getActivities();

setActivities(
  activityData.activities || []
);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
        "Unable to load parcel box."
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

    return () => clearInterval(interval);
  }, []);

  async function handleGenerateOTP() {
    if (!box) return;

    try {
      setGeneratingOtp(true);
      setError("");

      const data = await generateOTP(box.id);

      setOtpData({
        otp: data.otp,
        expiresAt: data.expiresAt
      });
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
        "Unable to generate delivery OTP."
      );
    } finally {
      setGeneratingOtp(false);
    }
  }

  async function handleRemoteUnlock() {
    if (!box) return;

    try {
      setUnlocking(true);
      setError("");
      await unlockBox(box.id);
      setSuccessMessage("Remote unlock command queued! The parcel box will unlock shortly.");
      setTimeout(() => setSuccessMessage(""), 5000);
      await loadBox(false);
    } catch (err) {
      console.error(err);
      setError(
        err.message || "Failed to issue remote unlock command."
      );
    } finally {
      setUnlocking(false);
    }
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <p>Loading your parcel box...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">

      <div className="page-heading">
        <div>
          <span className="page-eyebrow">
            OVERVIEW
          </span>

          <h1>
            Welcome back, {user?.name || "User"}
          </h1>

          <p>
            Monitor and manage your smart parcel box.
          </p>
        </div>

        <div className="page-date">
          {new Date().toLocaleDateString(
            undefined,
            {
              weekday: "long",
              month: "long",
              day: "numeric"
            }
          )}
        </div>
      </div>

      {successMessage && (
        <div className="dashboard-success">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}

      {box && (
        <div className="dashboard-grid">

          <div className="dashboard-main">

            <BoxCard
              box={box}
              onGenerateOTP={handleGenerateOTP}
              onRemoteUnlock={handleRemoteUnlock}
              unlocking={unlocking}
              generatingOtp={generatingOtp}
              onRefresh={() =>
                loadBox(false)
              }
              loading={refreshing}
            />

            <div className="section-heading">
              <div>
                <h2>Box status</h2>

                <p>
                  Current condition of{" "}
                  {box.box_code}
                </p>
              </div>
            </div>

            <div className="status-grid">

              <StatusCard
                icon={Lock}
                label="Lock"
                value={
                  box.lock_status === "locked"
                    ? "Locked"
                    : "Unlocked"
                }
                status={
                  box.lock_status === "locked"
                    ? "secure"
                    : "warning"
                }
                description={
                  box.lock_status === "locked"
                    ? "Box secured"
                    : "Box unlocked"
                }
              />

              <StatusCard
                icon={DoorOpen}
                label="Door"
                value={
                  box.door_status === "closed"
                    ? "Closed"
                    : "Open"
                }
                status={
                  box.door_status === "closed"
                    ? "secure"
                    : "warning"
                }
                description={
                  box.door_status === "closed"
                    ? "Door secured"
                    : "Door is open"
                }
              />

              <StatusCard
                icon={Package}
                label="Parcel"
                value={
                  box.parcel_status === "detected"
                    ? "Detected"
                    : "Empty"
                }
                status={
                  box.parcel_status === "detected"
                    ? "secure"
                    : "neutral"
                }
                description={
                  box.parcel_status === "detected"
                    ? "Parcel detected"
                    : "No parcel detected"
                }
              />

              <StatusCard
                icon={Wifi}
                label="Connection"
                value={
                  box.status === "online"
                    ? "Online"
                    : "Offline"
                }
                status={
                  box.status === "online"
                    ? "secure"
                    : "warning"
                }
                description={
                  box.status === "online"
                    ? "Device connected"
                    : "Device offline"
                }
              />

            </div>
          </div>

          <aside className="dashboard-side">

            <div className="activity-card">

              <div className="section-heading">
                <div>
                  <h2>Recent activity</h2>

                  <p>
                    Latest box events
                  </p>
                </div>
              </div>

              <ActivityList
               activities={activities}
              />

            </div>

            <div className="quick-action-card">

              <span>
                DELIVERY ACCESS
              </span>

              <h3>
                Need to receive a delivery?
              </h3>

              <p>
                Generate a secure one-time access
                code for your delivery person.
              </p>

              <button
                onClick={() =>
                  onNavigate("delivery")
                }
              >
                Open Delivery Access
              </button>

            </div>

          </aside>

        </div>
      )}

      {otpData && (
        <OTPModal
          otp={otpData.otp}
          expiresAt={otpData.expiresAt}
          onClose={() => setOtpData(null)}
        />
      )}

    </div>
  );
}

export default Dashboard;