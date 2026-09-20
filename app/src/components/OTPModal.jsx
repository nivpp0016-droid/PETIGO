import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  KeyRound,
  ShieldCheck,
  X
} from "lucide-react";

function OTPModal({
  otp,
  expiresAt,
  onClose
}) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft(0);
      return;
    }

    function updateTimer() {
      const remaining = Math.max(
        0,
        new Date(expiresAt).getTime() -
          Date.now()
      );

      setTimeLeft(remaining);
    }

    updateTimer();

    const timer = setInterval(
      updateTimer,
      1000
    );

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

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error(
        "Unable to copy OTP:",
        error
      );
    }
  }

  if (!otp) {
    return null;
  }

  const totalSeconds = Math.floor(
    timeLeft / 1000
  );

  const minutes = Math.floor(
    totalSeconds / 60
  );

  const seconds = totalSeconds % 60;

  const expired = timeLeft <= 0;

  return (
    <div
      className="otp-overlay"
      onClick={onClose}
    >
      <div
        className="otp-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <button
          className="otp-close-button"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="otp-icon">
          <KeyRound size={25} />
        </div>

        <div className="otp-heading">
          <span className="otp-eyebrow">
            DELIVERY ACCESS
          </span>

          <h2>One-Time Password</h2>

          <p>
            Give this code to your delivery
            person to authorize access.
          </p>
        </div>

        <div
          className={`otp-code-box ${
            expired ? "otp-expired" : ""
          }`}
        >
          {expired ? (
            <span>EXPIRED</span>
          ) : (
            String(otp || "")
              .split("")
              .map((digit, index) => (
                <span
                  key={`${digit}-${index}`}
                >
                  {digit}
                </span>
              ))
          )}
        </div>

        {!expired && (
          <>
            <button
              className="copy-otp-button"
              onClick={copyOTP}
            >
              {copied ? (
                <>
                  <Check size={17} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={17} />
                  Copy OTP
                </>
              )}
            </button>

            <div className="otp-timer">
              <span>Expires in</span>

              <strong>
                {minutes}:
                {String(seconds).padStart(
                  2,
                  "0"
                )}
              </strong>
            </div>
          </>
        )}

        <div className="otp-security-note">
          <ShieldCheck size={18} />

          <div>
            <strong>Security protected</strong>

            <span>
              This code can only be used once
              and automatically expires.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OTPModal;