import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  KeyRound,
  ShieldCheck,
  X,
  Clock,
  Sparkles
} from "lucide-react";

function OTPModal({ otp, expiresAt, onClose }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft(0);
      return;
    }

    function updateTimer() {
      const remaining = Math.max(0, new Date(expiresAt).getTime() - Date.now());
      setTimeLeft(remaining);
    }

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  async function copyOTP() {
    try {
      const otpStr = String(otp || "");
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(otpStr);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = otpStr;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Unable to copy OTP:", error);
    }
  }

  if (!otp) return null;

  const totalSeconds = Math.floor(timeLeft / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const expired = timeLeft <= 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        <div className="modal-brand-badge">
          <Sparkles size={14} />
          <span>ONE-TIME COURIER CODE</span>
        </div>

        <h2>Chamber Access Code</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
          Share this 6-digit access code with the courier to authorize doorstep chamber entry.
        </p>

        {/* Large Code Display */}
        <div className="otp-box-large">
          <div className="otp-number-display">
            {expired ? "EXPIRED" : String(otp || "")}
          </div>

          <div className="otp-countdown">
            <Clock size={14} />
            <span>
              {expired
                ? "This code has expired"
                : `Valid for ${minutes}:${String(seconds).padStart(2, "0")}`}
            </span>
          </div>
        </div>

        {!expired && (
          <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
            <button
              className="btn-primary-orange"
              style={{ flex: 1 }}
              onClick={copyOTP}
            >
              {copied ? (
                <>
                  <Check size={18} />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy size={18} />
                  <span>Copy 6-Digit Code</span>
                </>
              )}
            </button>
          </div>
        )}

        <div
          style={{
            padding: "12px 14px",
            background: "var(--surface-subtle)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-light)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "0.82rem",
            color: "var(--text-muted)"
          }}
        >
          <ShieldCheck size={18} style={{ color: "var(--primary-orange)", flexShrink: 0 }} />
          <span>
            Single-use cryptographic validation. The code is instantly revoked upon door unlock.
          </span>
        </div>
      </div>
    </div>
  );
}

export default OTPModal;