import { useEffect, useState } from "react";
import {
  Lock,
  Unlock,
  DoorClosed,
  DoorOpen,
  Package,
  Wifi,
  Ruler,
  Camera,
  Video,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from "lucide-react";

import BoxCard from "../components/BoxCard";
import StatusCard from "../components/StatusCard";
import OTPModal from "../components/OTPModal";
import ChamberCamera from "../components/ChamberCamera";

import {
  getBoxes,
  generateOTP,
  unlockBox,
  updateBoxCamera
} from "../services/api";
import { formatISTDate, formatISTTime } from "../utils/time";

function Dashboard({ user, onNavigate }) {
  const [box, setBox] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [generatingOtp, setGeneratingOtp] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [otpData, setOtpData] = useState(null);

  async function handleUpdateBox(updates) {
    setBox((prev) => (prev ? { ...prev, ...updates } : prev));
    if (box?.id && updates.camera_url !== undefined) {
      try {
        await updateBoxCamera(box.id, updates.camera_url);
      } catch (err) {
        console.error("Failed to update camera URL in database:", err);
      }
    }
  }

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
        setError("No PETIGO smart parcel box found linked to this account.");
        setBox(null);
        return;
      }

      setBox(data.boxes[0]);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to retrieve parcel box diagnostics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadBox();

    const interval = setInterval(() => {
      loadBox(false);
    }, 4000);

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
      setError(err.message || "Unable to generate delivery OTP.");
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
      setSuccessMessage("Remote unlock signal dispatched! The parcel box will release.");
      setTimeout(() => setSuccessMessage(""), 5000);
      await loadBox(false);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to dispatch remote unlock command.");
    } finally {
      setUnlocking(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
          gap: "16px"
        }}
      >
        <div className="loading-spinner" />
        <p style={{ fontWeight: 600, color: "var(--primary-navy)" }}>
          Connecting to PETIGO Chamber...
        </p>
      </div>
    );
  }

  // Calculated status values
  const isLocked = box?.lock_status === "locked";
  const isDoorClosed = box?.door_status === "closed";
  const isOnline = box?.status === "online";
  const isParcelDetected = box?.parcel_status === "detected";
  const distanceVal =
    box?.distance_cm && box.distance_cm > 0
      ? box.distance_cm
      : isParcelDetected
      ? 8.5
      : 45.0;

  return (
    <div className="dashboard-page">
      {/* Top Page Heading */}
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">DASHBOARD</span>
          <h1>Welcome back, {user?.name || "Owner"}</h1>
          <p>Real-time status and delivery controls for your PETIGO box.</p>
        </div>

        <div className="page-badge">
          {formatISTDate(new Date(), {
            weekday: "long",
            month: "short",
            day: "numeric"
          })} • {formatISTTime(new Date(), { includeSeconds: false, includeZone: true })}
        </div>
      </div>

      {successMessage && (
        <div
          style={{
            padding: "14px 20px",
            background: "var(--success-light)",
            border: "1px solid var(--success-border)",
            borderRadius: "var(--radius-md)",
            color: "var(--success)",
            fontWeight: 600,
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
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

      {box && (
        <div className="dashboard-geometric-container">
          {/* TOP ROW: SMART PARCEL CHAMBER on Left, Live Chamber Camera on Right (Equal Height & Length) */}
          <div className="dashboard-row-top">
            <BoxCard
              box={box}
              onGenerateOTP={handleGenerateOTP}
              onRemoteUnlock={handleRemoteUnlock}
              unlocking={unlocking}
              generatingOtp={generatingOtp}
              onRefresh={() => loadBox(false)}
              loading={refreshing}
            />

            {/* LIVE CHAMBER CAMERA PREVIEW CARD (Equal height to BoxCard) */}
            <ChamberCamera box={box} onUpdateBox={handleUpdateBox} />
          </div>

          {/* BOTTOM ROW: Chamber Status on Left, Courier Access on Right (Equal Height) */}
          <div className="dashboard-row-bottom">
            {/* Left Column: Chamber Status (5 Streamlined Status Cards) */}
            <div className="chamber-status-container">
              <div className="section-header-row" style={{ marginBottom: "12px" }}>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 800 }}>Chamber Status</h2>
              </div>

              <div className="status-grid-geometric">
                {/* 1. Lock Status */}
                <StatusCard
                  icon={isLocked ? Lock : Unlock}
                  label="Lock"
                  value={isLocked ? "Locked" : "Unlocked"}
                  status={isLocked ? "secure" : "warning"}
                />

                {/* 2. Door Status */}
                <StatusCard
                  icon={isDoorClosed ? DoorClosed : DoorOpen}
                  label="Door"
                  value={isDoorClosed ? "Closed" : "Open"}
                  status={isDoorClosed ? "secure" : "warning"}
                />

                {/* 3. Chamber / Contents */}
                <StatusCard
                  icon={Package}
                  label="Chamber"
                  value={isParcelDetected ? "Parcel Inside" : "Empty"}
                  status={isParcelDetected ? "warning" : "neutral"}
                />

                {/* 4. Box Status */}
                <StatusCard
                  icon={Wifi}
                  label="Box Status"
                  value={isOnline ? "Online" : "Offline"}
                  status={isOnline ? "secure" : "danger"}
                />

                {/* 5. Ultrasonic Sensor */}
                <StatusCard
                  icon={Ruler}
                  label="Ultrasonic"
                  value={`${distanceVal.toFixed(1)} cm`}
                  status={isParcelDetected ? "warning" : "neutral"}
                />
              </div>
            </div>

            {/* Right Column: Courier Access Card (Equal Height to Chamber Status) */}
            <div className="courier-access-card">
              <div className="courier-access-header">
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.74rem",
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    color: "var(--primary-orange)",
                    textTransform: "uppercase"
                  }}
                >
                  <Sparkles size={13} />
                  <span>Courier Access</span>
                </div>

                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 800, color: "var(--primary-navy)" }}>
                  Need to Receive a Delivery?
                </h3>

                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.45 }}>
                  Generate a dynamic 6-digit one-time access code for your courier or test keypad authorization.
                </p>
              </div>

              {/* Interactive 6-slot preview graphic */}
              <div className="courier-access-preview-slots">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="courier-slot-mini">
                    •
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  className="btn-primary-orange"
                  style={{ width: "100%", padding: "13px 18px", fontSize: "0.92rem" }}
                  onClick={() => onNavigate("delivery")}
                >
                  <span>Open Delivery Access Portal</span>
                  <ArrowRight size={16} />
                </button>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    fontSize: "0.74rem",
                    color: "var(--text-light)"
                  }}
                >
                  <span>🔒 Single-use cryptographic verification</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OTP Modal Dialog */}
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