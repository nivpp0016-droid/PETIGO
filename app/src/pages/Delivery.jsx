import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Package,
  ShieldCheck,
  XCircle,
  Lock,
  Unlock,
  Sparkles,
  Delete
} from "lucide-react";

import { getBoxes, verifyOTP } from "../services/api";

function Delivery({ onBack }) {
  const [box, setBox] = useState(null);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [error, setError] = useState("");

  async function loadBox() {
    try {
      const data = await getBoxes();
      if (data.boxes && data.boxes.length > 0) {
        setBox(data.boxes[0]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadBox();
  }, []);

  function handleDigit(digit) {
    if (otp.length >= 6) return;
    setError("");
    setOtp((current) => current + digit);
  }

  function handleDelete() {
    setOtp((current) => current.slice(0, -1));
    setError("");
  }

  async function handleVerify() {
    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    if (!box) {
      setError("Unable to identify the parcel box.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await verifyOTP(box.id, otp);

      if (result.accessGranted) {
        setAccessGranted(true);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Invalid or expired access code.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setOtp("");
    setError("");
    setAccessGranted(false);
  }

  if (accessGranted) {
    return (
      <div className="delivery-container" style={{ animation: "fadeIn 250ms ease-out" }}>
        <button
          className="btn-secondary-white"
          style={{
            background: "var(--surface)",
            color: "var(--primary-navy)",
            border: "1px solid var(--border)",
            marginBottom: "20px"
          }}
          onClick={onBack}
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>

        <div className="delivery-card">
          <div className="delivery-success-icon">
            <CheckCircle2 size={36} />
          </div>

          <div className="courier-badge">
            <Sparkles size={14} />
            <span>AUTHORIZATION CONFIRMED</span>
          </div>

          <h2>Chamber Unlocked!</h2>
          <p>
            The solenoid lock has been triggered. Please pull open the door, place the parcel
            inside, and firmly close the door.
          </p>

          <div
            style={{
              background: "var(--surface-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "20px",
              border: "1px solid var(--border-light)",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "24px",
              textAlign: "left"
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "var(--radius-md)",
                background: "var(--orange-subtle)",
                color: "var(--primary-orange)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              <Unlock size={24} />
            </div>
            <div>
              <strong style={{ color: "var(--primary-navy)", fontSize: "0.95rem", display: "block" }}>
                Auto-Relock Active
              </strong>
              <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                The box will automatically secure itself once the door is shut.
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontSize: "0.82rem",
              color: "var(--text-muted)",
              marginBottom: "24px"
            }}
          >
            <ShieldCheck size={16} style={{ color: "var(--success)" }} />
            <span>Single-use code burned and invalidated.</span>
          </div>

          <button
            className="btn-primary-orange"
            style={{ width: "100%" }}
            onClick={handleReset}
          >
            Verify Another Code
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="delivery-container" style={{ animation: "fadeIn 250ms ease-out" }}>
      <button
        className="btn-secondary-white"
        style={{
          background: "var(--surface)",
          color: "var(--primary-navy)",
          border: "1px solid var(--border)",
          marginBottom: "20px"
        }}
        onClick={onBack}
      >
        <ArrowLeft size={16} />
        <span>Back to Dashboard</span>
      </button>

      <div className="delivery-card">
        <div className="courier-badge">
          <Package size={14} />
          <span>COURIER ACCESS TERMINAL</span>
        </div>

        <h2>Enter Delivery Access Code</h2>
        <p>Type the 6-digit one-time code provided by the parcel recipient.</p>

        {/* 6 Digit Display Slots */}
        <div className="otp-display-slots">
          {Array.from({ length: 6 }).map((_, index) => {
            const hasDigit = Boolean(otp[index]);
            const isActive = index === otp.length;

            return (
              <div
                key={index}
                className={`otp-slot ${hasDigit ? "filled" : ""} ${isActive ? "active" : ""}`}
              >
                {hasDigit ? otp[index] : ""}
              </div>
            );
          })}
        </div>

        {error && (
          <div
            style={{
              padding: "12px 16px",
              background: "var(--error-light)",
              border: "1px solid var(--error-border)",
              borderRadius: "var(--radius-md)",
              color: "var(--error)",
              fontSize: "0.88rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "20px"
            }}
          >
            <XCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Virtual Tactile 3x4 Keypad */}
        <div className="virtual-keypad">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button
              key={digit}
              type="button"
              className="keypad-btn"
              onClick={() => handleDigit(digit)}
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            className="keypad-btn action-btn"
            onClick={() => setOtp("")}
            title="Clear code"
          >
            CLR
          </button>

          <button
            type="button"
            className="keypad-btn"
            onClick={() => handleDigit("0")}
          >
            0
          </button>

          <button
            type="button"
            className="keypad-btn action-btn"
            onClick={handleDelete}
            title="Delete last digit"
          >
            <Delete size={20} />
          </button>
        </div>

        {/* Verification Action */}
        <button
          className="btn-primary-orange"
          style={{ width: "100%", padding: "16px", fontSize: "1.05rem" }}
          onClick={handleVerify}
          disabled={loading || otp.length !== 6}
        >
          {loading ? (
            <span>Validating Code...</span>
          ) : (
            <>
              <KeyRound size={20} />
              <span>Verify & Unlock Chamber</span>
            </>
          )}
        </button>

        <div
          style={{
            marginTop: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontSize: "0.78rem",
            color: "var(--text-muted)"
          }}
        >
          <ShieldCheck size={15} style={{ color: "var(--primary-orange)" }} />
          <span>Encrypted with PETIGO hardware token authentication</span>
        </div>
      </div>
    </div>
  );
}

export default Delivery;