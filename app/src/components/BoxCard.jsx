import {
  Lock,
  Unlock,
  KeyRound,
  DoorOpen,
  Package,
  Wifi,
  RefreshCw
} from "lucide-react";

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
      <div className="box-card box-card-loading">
        <RefreshCw size={22} className="spin" />
        <span>Loading parcel box...</span>
      </div>
    );
  }

  const isOnline = box.status === "online";
  const isLocked = box.lock_status === "locked";
  const isDoorClosed = box.door_status === "closed";
  const parcelDetected = box.parcel_status === "detected";

  return (
    <section className="box-card">
      <div className="box-card-header">
        <div className="box-identity">
          <div className="box-icon">
            <Package size={24} />
          </div>

          <div>
            <span className="box-label">
              PARCEL BOX
            </span>

            <h2>{box.box_code}</h2>
          </div>
        </div>

        <div
          className={`connection-badge ${
            isOnline
              ? "connection-online"
              : "connection-offline"
          }`}
        >
          <Wifi size={15} />

          <span>
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      <div className="box-security">
        <div
          className={`lock-visual ${
            isLocked ? "lock-secure" : "lock-open"
          }`}
        >
          {isLocked ? (
            <Lock size={38} />
          ) : (
            <Unlock size={38} />
          )}
        </div>

        <span className="security-label">
          SECURITY STATUS
        </span>

        <h3>
          {isLocked
            ? "Box is secured"
            : "Box is unlocked"}
        </h3>

        <p>
          {isLocked
            ? "Your parcel box is securely locked."
            : "The parcel box is currently unlocked."}
        </p>
      </div>

      <div className="box-status-row">
        <div className="box-mini-status">
          <div className="mini-status-icon">
            <DoorOpen size={18} />
          </div>

          <div>
            <span>Door</span>

            <strong>
              {isDoorClosed
                ? "Closed"
                : "Open"}
            </strong>
          </div>
        </div>

        <div className="box-mini-status">
          <div className="mini-status-icon">
            <Package size={18} />
          </div>

          <div>
            <span>Parcel</span>

            <strong>
              {parcelDetected
                ? "Detected"
                : "Empty"}
            </strong>
          </div>
        </div>
      </div>

      <div className="box-actions">
        <button
          className="primary-action"
          onClick={onGenerateOTP}
          disabled={generatingOtp || loading}
          title="Generate a 6-digit delivery access code"
        >
          <KeyRound size={18} className={generatingOtp ? "spin" : ""} />
          {generatingOtp ? "Generating OTP..." : "Generate Delivery OTP"}
        </button>

        {onRemoteUnlock && (
          <button
            className="secondary-action"
            onClick={onRemoteUnlock}
            disabled={unlocking || loading || generatingOtp}
            title="Remotely unlock the parcel box"
          >
            <Unlock size={18} className={unlocking ? "spin" : ""} />
            {unlocking ? "Unlocking..." : "Remote Unlock"}
          </button>
        )}

        <button
          className="icon-action"
          onClick={onRefresh}
          disabled={loading || unlocking || generatingOtp}
          aria-label="Refresh box status"
          title="Refresh box status"
        >
          <RefreshCw
            size={18}
            className={loading ? "spin" : ""}
          />
        </button>
      </div>

      {box.updated_at && (
        <p className="box-updated">
          Last updated{" "}
          {new Date(
            box.updated_at
          ).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })}
        </p>
      )}
    </section>
  );
}

export default BoxCard;