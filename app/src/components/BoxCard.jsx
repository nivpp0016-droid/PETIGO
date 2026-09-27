import {
  Lock,
  Unlock,
  KeyRound,
  DoorOpen,
  DoorClosed,
  Package,
  Wifi,
  RefreshCw
} from "lucide-react";
import { formatISTTime } from "../utils/time";

function BoxCard({
  box,
  onGenerateOTP,
  onRemoteUnlock,
  onRefresh,
  loading = false,
  unlocking = false,
  generatingOtp = false
}) {
  if (!box) {
    return (
      <div className="petigo-hero-card geometric-cover" style={{ textAlign: "center", padding: "48px 24px" }}>
        <RefreshCw size={26} className="spin" style={{ color: "var(--primary-orange)", margin: "0 auto 12px" }} />
        <h3 style={{ color: "var(--surface)", fontFamily: "var(--font-display)" }}>Connecting to PETIGO Chamber...</h3>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>Fetching live chamber status</p>
      </div>
    );
  }

  const isOnline = box.status === "online";
  const isLocked = box.lock_status === "locked";
  const isDoorClosed = box.door_status === "closed";
  const parcelDetected = box.parcel_status === "detected";

  return (
    <section className="petigo-hero-card geometric-cover">
      <div className="hero-glow-orb" />

      {/* Top Header Row */}
      <div className="petigo-hero-top">
        <div className="hero-box-tag">
          <div className="tag-icon">
            <Package size={20} />
          </div>
          <div>
            <span>SMART PARCEL CHAMBER</span>
            <h2>{box.box_code}</h2>
          </div>
        </div>

        <div className={`connection-pill ${isOnline ? "online" : "offline"}`}>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: isOnline ? "var(--success)" : "var(--error)",
              display: "inline-block",
              boxShadow: isOnline ? "0 0 8px var(--success)" : "none"
            }}
          />
          <Wifi size={14} />
          <span>{isOnline ? "Chamber Online" : "Offline"}</span>
        </div>
      </div>

      {/* Center Lock Status Display */}
      <div className="hero-status-center">
        <div className={`hero-lock-badge ${isLocked ? "locked" : "unlocked"}`}>
          {isLocked ? <Lock size={32} /> : <Unlock size={32} />}
        </div>

        <div className="hero-status-text">
          <span>HARDWARE SECURITY STATE</span>
          <h3>{isLocked ? "Chamber is Securely Locked" : "Chamber Unlocked & Accessible"}</h3>
          <p>
            {isLocked
              ? "Solenoid lock engaged. Door closed and protected."
              : "Lock release command executed. Door is free to open."}
          </p>
        </div>
      </div>

      {/* Door & Parcel Micro Indicators */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "14px",
          position: "relative",
          zIndex: 2,
          margin: "4px 0 16px"
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "var(--radius-md)",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}
        >
          {isDoorClosed ? (
            <DoorClosed size={22} style={{ color: "var(--success)" }} />
          ) : (
            <DoorOpen size={22} style={{ color: "var(--primary-orange)" }} />
          )}
          <div>
            <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: 700 }}>
              Door Sensor
            </span>
            <strong style={{ display: "block", color: "var(--surface)", fontSize: "0.95rem" }}>
              {isDoorClosed ? "Door Closed" : "Door Open"}
            </strong>
          </div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "var(--radius-md)",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}
        >
          <Package
            size={22}
            style={{
              color: parcelDetected ? "var(--primary-orange)" : "rgba(255,255,255,0.5)"
            }}
          />
          <div>
            <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: 700 }}>
              Chamber Contents
            </span>
            <strong style={{ display: "block", color: "var(--surface)", fontSize: "0.95rem" }}>
              {parcelDetected ? "Parcel Inside" : "Chamber Empty"}
            </strong>
          </div>
        </div>
      </div>

      {/* Geometrically Balanced Full-Width Action Buttons */}
      <div className="hero-actions-geometric">
        <button
          className="btn-primary-orange"
          onClick={onGenerateOTP}
          disabled={generatingOtp || loading}
          title="Generate a 6-digit one-time courier access code"
        >
          <KeyRound size={17} className={generatingOtp ? "spin" : ""} />
          <span>{generatingOtp ? "Generating..." : "Generate Delivery OTP"}</span>
        </button>

        {onRemoteUnlock && (
          <button
            className="btn-secondary-white"
            onClick={onRemoteUnlock}
            disabled={unlocking || loading || generatingOtp}
            title="Send remote unlock command to chamber"
          >
            <Unlock size={17} className={unlocking ? "spin" : ""} />
            <span>{unlocking ? "Unlocking..." : "Remote Unlock"}</span>
          </button>
        )}

        <button
          className="btn-icon-subtle"
          onClick={onRefresh}
          disabled={loading || unlocking || generatingOtp}
          aria-label="Refresh hardware status"
          title="Refresh box telemetry"
        >
          <RefreshCw size={17} className={loading ? "spin" : ""} />
        </button>
      </div>

      {box.updated_at && (
        <div
          style={{
            marginTop: "12px",
            fontSize: "0.74rem",
            color: "rgba(255,255,255,0.45)",
            position: "relative",
            zIndex: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <span>Chamber Ping: {formatISTTime(box.updated_at)}</span>
          <span>Optical Guard Active</span>
        </div>
      )}
    </section>
  );
}

export default BoxCard;