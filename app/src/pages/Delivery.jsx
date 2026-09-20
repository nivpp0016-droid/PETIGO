import {
  useEffect,
  useState
} from "react";

import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Package,
  ShieldCheck,
  XCircle
} from "lucide-react";

import {
  getBoxes,
  verifyOTP
} from "../services/api";

function Delivery({ onBack }) {
  const [box, setBox] = useState(null);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [accessGranted, setAccessGranted] =
    useState(false);
  const [error, setError] = useState("");

  async function loadBox() {
    try {
      const data = await getBoxes();

      if (
        data.boxes &&
        data.boxes.length > 0
      ) {
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
    setOtp((current) =>
      current.slice(0, -1)
    );
    setError("");
  }

  async function handleVerify() {
    if (otp.length !== 6) {
      setError(
        "Enter the complete 6-digit OTP."
      );
      return;
    }

    if (!box) {
      setError(
        "Unable to identify the parcel box."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await verifyOTP(
        box.id,
        otp
      );

      if (result.accessGranted) {
        setAccessGranted(true);
      }
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
        "Invalid or expired OTP."
      );
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
      <div className="delivery-page">

        <button
          className="back-button"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="delivery-success">

          <div className="success-icon">
            <CheckCircle2 size={42} />
          </div>

          <span className="delivery-eyebrow">
            ACCESS VERIFIED
          </span>

          <h1>
            Access granted
          </h1>

          <p>
            The delivery OTP has been verified
            successfully.
          </p>

          <div className="unlock-card">

            <div className="unlock-card-icon">
              <KeyRound size={22} />
            </div>

            <div>
              <strong>
                Unlock command created
              </strong>

              <span>
                The smart parcel box is ready
                for delivery access.
              </span>
            </div>

          </div>

          <div className="delivery-security">
            <ShieldCheck size={18} />

            <span>
              This OTP has been marked as used
              and cannot be reused.
            </span>
          </div>

          <button
            className="secondary-delivery-button"
            onClick={handleReset}
          >
            Verify another OTP
          </button>

        </div>

      </div>
    );
  }

  return (
    <div className="delivery-page">

      <button
        className="back-button"
        onClick={onBack}
      >
        <ArrowLeft size={18} />
        Back to dashboard
      </button>

      <div className="delivery-layout">

        <section className="delivery-info">

          <div className="delivery-icon">
            <Package size={27} />
          </div>

          <span className="delivery-eyebrow">
            DELIVERY ACCESS
          </span>

          <h1>
            Secure access to your parcel box.
          </h1>

          <p>
            Enter the one-time password provided
            by the parcel owner to authorize
            delivery access.
          </p>

          <div className="delivery-box-info">

            <div className="box-info-icon">
              <Package size={18} />
            </div>

            <div>
              <span>PARCEL BOX</span>

              <strong>
                {box?.box_code || "Loading..."}
              </strong>
            </div>

          </div>

          <div className="delivery-protection">

            <ShieldCheck size={19} />

            <div>
              <strong>
                Protected access
              </strong>

              <span>
                OTPs are single-use and
                automatically expire.
              </span>
            </div>

          </div>

        </section>

        <section className="otp-entry-card">

          <div className="otp-entry-heading">

            <div className="entry-icon">
              <KeyRound size={21} />
            </div>

            <div>
              <span>
                VERIFICATION
              </span>

              <h2>
                Enter access code
              </h2>
            </div>

          </div>

          <div className="otp-digits">

            {Array.from({
              length: 6
            }).map((_, index) => (
              <div
                key={index}
                className={`otp-digit ${
                  otp[index]
                    ? "otp-digit-filled"
                    : ""
                }`}
              >
                {otp[index]
                  ? "•"
                  : ""}
              </div>
            ))}

          </div>

          {error && (
            <div className="delivery-error">
              <XCircle size={17} />
              <span>{error}</span>
            </div>
          )}

          <div className="keypad">

            {[
              "1",
              "2",
              "3",
              "4",
              "5",
              "6",
              "7",
              "8",
              "9"
            ].map((digit) => (
              <button
                key={digit}
                onClick={() =>
                  handleDigit(digit)
                }
              >
                {digit}
              </button>
            ))}

            <button
              className="keypad-clear"
              onClick={() =>
                setOtp("")
              }
            >
              Clear
            </button>

            <button
              onClick={() =>
                handleDigit("0")
              }
            >
              0
            </button>

            <button
              className="keypad-delete"
              onClick={handleDelete}
            >
              Delete
            </button>

          </div>

          <button
            className="verify-access-button"
            onClick={handleVerify}
            disabled={
              loading ||
              otp.length !== 6
            }
          >
            {loading
              ? "Verifying..."
              : "Verify Access"}
          </button>

          <p className="otp-entry-footer">
            🔒 Secure one-time verification
          </p>

        </section>

      </div>

    </div>
  );
}

export default Delivery;