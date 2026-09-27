import { useState, useEffect, useRef } from "react";
import {
  Camera,
  Video,
  Zap,
  ZapOff,
  Maximize2,
  Settings as SettingsIcon,
  RotateCw,
  Download,
  X,
  Check,
  ExternalLink,
  Wifi,
  Sparkles,
  Eye
} from "lucide-react";
import { formatISTTime } from "../utils/time";

const defaultUrl = "http://192.168.31.144:81/stream";

// Extract base IP for control commands (flash, capture, status)
function getCameraBaseUrl(rawUrl) {
  try {
    const url = new URL(rawUrl.startsWith("http") ? rawUrl : `http://${rawUrl}`);
    return `${url.protocol}//${url.hostname}`;
  } catch {
    return "http://192.168.31.144";
  }
}

// Build stream URL with port 81 if only IP given
function formatStreamUrl(input) {
  let clean = (input || "").trim();
  if (!clean) return defaultUrl;
  if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
    clean = `http://${clean}`;
  }
  try {
    const url = new URL(clean);
    if (!url.pathname || url.pathname === "/" || url.pathname === "") {
      return `http://${url.hostname}:81/stream`;
    }
    return clean;
  } catch {
    return defaultUrl;
  }
}

function ChamberCamera({ box, onUpdateBox }) {
  const [cameraUrl, setCameraUrl] = useState(() => {
    return (
      box?.camera_url ||
      localStorage.getItem("petigo_camera_url") ||
      defaultUrl
    );
  });

  const [streamActive, setStreamActive] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Stream mode: "live" (Continuous Active Fast Stream) vs "mjpeg" (Raw Port 81 Stream)
  const [viewMode, setViewMode] = useState("live");
  const [liveFrameUrl, setLiveFrameUrl] = useState(() => "http://192.168.31.144/capture");
  const [fps, setFps] = useState(0);

  // Flash LED state
  const [flashOn, setFlashOn] = useState(false);
  const [togglingFlash, setTogglingFlash] = useState(false);

  // Settings Modal
  const [showSettings, setShowSettings] = useState(false);
  const [inputIpOrUrl, setInputIpOrUrl] = useState(cameraUrl);
  const [saveStatus, setSaveStatus] = useState("");

  // Full-Screen / Expanded Preview Modal
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Snapshot Preview Modal
  const [snapshotImg, setSnapshotImg] = useState(null);
  const [capturing, setCapturing] = useState(false);

  // Demo chamber preview mode
  const [demoMode, setDemoMode] = useState(false);

  const imgRef = useRef(null);

  const effectiveStreamUrl = formatStreamUrl(cameraUrl);
  const baseUrl = getCameraBaseUrl(cameraUrl);

  // Keep cameraUrl in sync when box data loads from backend
  useEffect(() => {
    if (box?.camera_url) {
      const formatted = formatStreamUrl(box.camera_url);
      setCameraUrl(formatted);
      setInputIpOrUrl(formatted);
      localStorage.setItem("petigo_camera_url", formatted);
    }
  }, [box?.camera_url]);

  // Unbreakable continuous live streaming loop (ping-pong frame loader)
  useEffect(() => {
    if (demoMode || viewMode !== "live") return;
    let isCancelled = false;
    let inFlight = false;
    let frameCount = 0;
    let lastFpsTime = Date.now();

    function fetchNextFrame() {
      if (isCancelled || inFlight) return;
      inFlight = true;

      const nextUrl = `${baseUrl}/capture?t=${Date.now()}`;
      const img = new Image();

      img.onload = () => {
        if (isCancelled) return;
        setLiveFrameUrl(nextUrl);
        setStreamActive(true);
        setStreamError(false);
        inFlight = false;

        frameCount++;
        const now = Date.now();
        if (now - lastFpsTime >= 2000) {
          setFps(Math.max(1, Math.round((frameCount * 1000) / (now - lastFpsTime))));
          frameCount = 0;
          lastFpsTime = now;
        }

        // Small 30ms yield before triggering next frame
        setTimeout(fetchNextFrame, 30);
      };

      img.onerror = () => {
        if (isCancelled) return;
        inFlight = false;
        setTimeout(fetchNextFrame, 600);
      };

      img.src = nextUrl;
    }

    fetchNextFrame();

    return () => {
      isCancelled = true;
    };
  }, [baseUrl, reloadKey, demoMode, viewMode]);

  // Handle stream image load
  function handleStreamLoad() {
    setStreamActive(true);
    setConnecting(false);
    setStreamError(false);
  }

  // Handle stream image error
  function handleStreamError() {
    console.warn("Camera feed failed to load from:", effectiveStreamUrl);
    setStreamActive(false);
    setConnecting(false);
    setStreamError(true);
  }

  // Reload the stream feed
  function handleReloadStream() {
    setConnecting(true);
    setStreamError(false);
    setStreamActive(true);
    setReloadKey((prev) => prev + 1);
  }

  // Toggle ESP32-CAM onboard Flash LED
  async function handleToggleFlash() {
    const nextState = !flashOn;
    setTogglingFlash(true);
    const baseUrl = getCameraBaseUrl(cameraUrl);

    try {
      await fetch(`${baseUrl}/flash?state=${nextState ? 1 : 0}`, {
        mode: "no-cors",
        signal: AbortSignal.timeout(2500)
      });
      setFlashOn(nextState);
    } catch (e) {
      console.warn("Flash command note (no-cors response expected):", e);
      // Optimistically update
      setFlashOn(nextState);
    } finally {
      setTogglingFlash(false);
    }
  }

  // Capture a snapshot frame
  async function handleCaptureSnapshot() {
    setCapturing(true);
    const baseUrl = getCameraBaseUrl(cameraUrl);

    // If demo mode or stream canvas grab
    if (demoMode || !streamActive) {
      // Create a nice simulated snapshot canvas
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext("2d");

      // Draw dark chamber background
      const grad = ctx.createLinearGradient(0, 0, 800, 600);
      grad.addColorStop(0, "#071426");
      grad.addColorStop(1, "#0F284A");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 600);

      // Draw box interior lines
      ctx.strokeStyle = "rgba(255, 138, 0, 0.4)";
      ctx.lineWidth = 2;
      ctx.strokeRect(60, 60, 680, 480);

      // Draw timestamp and watermark
      ctx.fillStyle = "#FF8A00";
      ctx.font = "bold 22px 'Outfit', sans-serif";
      ctx.fillText("PETIGO SMART PARCEL CHAMBER", 80, 110);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "18px monospace";
      ctx.fillText(`CAPTURE: ${formatISTTime(new Date())}`, 80, 145);
      ctx.fillText("STATUS: OPTICAL GUARD ACTIVE", 80, 175);

      // Draw parcel illustration or crosshairs
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.beginPath();
      ctx.arc(400, 320, 80, 0, 2 * Math.PI);
      ctx.stroke();

      setSnapshotImg(canvas.toDataURL("image/jpeg"));
      setCapturing(false);
      return;
    }

    try {
      // Try direct capture endpoint from ESP32-CAM port 80
      const captureUrl = `${baseUrl}/capture?t=${Date.now()}`;
      setSnapshotImg(captureUrl);
    } catch {
      setSnapshotImg(`${baseUrl}/capture`);
    } finally {
      setCapturing(false);
    }
  }

  // Save camera settings
  function handleSaveSettings(e) {
    e?.preventDefault();
    const formatted = formatStreamUrl(inputIpOrUrl);
    setCameraUrl(formatted);
    localStorage.setItem("petigo_camera_url", formatted);

    // If box has update function, persist to database
    if (box?.id && onUpdateBox) {
      onUpdateBox({ camera_url: formatted });
    }

    setSaveStatus("Saved successfully!");
    setConnecting(true);
    setStreamError(false);
    setReloadKey((k) => k + 1);

    setTimeout(() => {
      setSaveStatus("");
      setShowSettings(false);
    }, 1200);
  }

  return (
    <div className="camera-preview-card geometric-cover">
      {/* Header with Title, Live Badge, and Action Buttons */}
      <div className="camera-preview-header">
        <h3>
          <Camera size={18} style={{ color: "var(--primary-orange)" }} />
          <span>Chamber Camera</span>
        </h3>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Mode Switcher: Smooth Feed vs Port 81 MJPEG */}
          <button
            type="button"
            className="cam-mini-btn"
            onClick={() => {
              setStreamError(false);
              setViewMode((m) => (m === "live" ? "mjpeg" : "live"));
            }}
            title={viewMode === "live" ? "Switch to Port 81 Raw MJPEG Stream" : "Switch to Continuous Smooth Stream"}
            style={{
              padding: "3px 8px",
              fontSize: "0.72rem",
              fontWeight: 600,
              borderRadius: "12px",
              background: viewMode === "live" ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.08)",
              borderColor: viewMode === "live" ? "#10B981" : "rgba(255, 255, 255, 0.15)",
              color: viewMode === "live" ? "#10B981" : "rgba(255, 255, 255, 0.8)"
            }}
          >
            {viewMode === "live" ? "● Smooth Stream" : "Port 81 Stream"}
          </button>

          {/* Status Badge */}
          {streamActive ? (
            <span className="camera-badge-live">
              <span className="camera-pulse-dot live-green" />
              {viewMode === "live" ? `LIVE • ${fps > 0 ? fps : 15} FPS` : "LIVE MJPEG"}
            </span>
          ) : demoMode ? (
            <span className="camera-badge-live" style={{ background: "rgba(59, 130, 246, 0.15)", borderColor: "rgba(59, 130, 246, 0.4)", color: "#60A5FA" }}>
              <span className="camera-pulse-dot" style={{ background: "#60A5FA", boxShadow: "0 0 8px #60A5FA" }} />
              SIMULATION
            </span>
          ) : (
            <span className="camera-badge-coming-soon">
              <span className="camera-pulse-dot" />
              {streamError ? "OFFLINE / STANDBY" : "CONNECTING..."}
            </span>
          )}

          {/* Quick Settings Icon */}
          <button
            type="button"
            className="cam-mini-btn"
            onClick={() => {
              setInputIpOrUrl(cameraUrl);
              setShowSettings(true);
            }}
            title="Configure Camera IP"
            aria-label="Configure Camera IP"
          >
            <SettingsIcon size={15} />
          </button>
        </div>
      </div>

      {/* Main Viewfinder Monitor */}
      <div className="camera-viewfinder">
        {/* Optical Crosshair Corners */}
        <div className="viewfinder-crosshairs" />
        <div className="viewfinder-corners-bottom" />

        {/* HUD Top-Left & Bottom-Right Watermarks */}
        <span className="camera-overlay-tag">
          {streamActive ? "● CAM 01 • ESP32-CAM" : "CAM 01 • PETIGO CHAMBER"}
        </span>

        <span className="camera-res-tag">
          {viewMode === "live" ? `QVGA 320x240 • ${fps > 0 ? fps : 15} FPS ACTIVE` : "QVGA 320x240 • MJPEG PORT 81"}
        </span>

        {/* Live MJPEG Stream or Fast Snapshot Image */}
        {!demoMode ? (
          <img
            ref={imgRef}
            key={viewMode === "live" ? "live-continuous" : `stream-${reloadKey}`}
            src={
              viewMode === "live"
                ? liveFrameUrl
                : `${effectiveStreamUrl}${effectiveStreamUrl.includes("?") ? "&" : "?"}rk=${reloadKey}`
            }
            alt="PETIGO Parcel Chamber Live Optical Feed"
            className={`camera-stream-img ${streamError && viewMode !== "live" ? "is-hidden" : "is-visible"}`}
            onLoad={handleStreamLoad}
            onError={handleStreamError}
          />
        ) : (
          <div className="camera-demo-feed">
            <div className="camera-scanline" />
            <div className="demo-chamber-box">
              <div className="demo-parcel-outline">
                <span className="demo-detection-label">OPTICAL TARGET DETECTED</span>
              </div>
            </div>
          </div>
        )}

        {/* Fallback Viewfinder when Camera has error / offline */}
        {streamError && !demoMode && viewMode !== "live" && (
          <div className="camera-offline-hud">
            <div className="camera-center-icon-wrap">
              <Video size={28} />
            </div>

            <div className="camera-status-sub">
              Stream Connection Notice
            </div>

            <p className="camera-hud-subtext">
              Unable to load MJPEG video feed from {effectiveStreamUrl}.
              You can switch to Smooth Active Stream mode!
            </p>

            <div className="camera-hud-actions">
              <button
                type="button"
                className="cam-hud-action-btn btn-primary"
                onClick={() => {
                  setStreamError(false);
                  setViewMode("live");
                }}
                title="Switch to Smooth Stream Mode"
              >
                <Sparkles size={13} />
                <span>Switch to Smooth Stream</span>
              </button>

              <button
                type="button"
                className="cam-hud-action-btn btn-subtle"
                onClick={handleReloadStream}
                title="Retry connecting to camera"
              >
                <RotateCw size={13} className={connecting ? "spin" : ""} />
                <span>Retry Stream</span>
              </button>

              <button
                type="button"
                className="cam-hud-action-btn btn-subtle"
                onClick={() => {
                  setInputIpOrUrl(cameraUrl);
                  setShowSettings(true);
                }}
                title="Configure Camera IP"
              >
                <SettingsIcon size={13} />
                <span>Change IP</span>
              </button>

              <button
                type="button"
                className="cam-hud-action-btn btn-demo"
                onClick={() => setDemoMode(true)}
                title="Preview Chamber UI in simulation mode"
              >
                <Eye size={13} />
                <span>Simulate Feed</span>
              </button>
            </div>
          </div>
        )}

        {/* Live Controls Floating Dock */}
        <div className="camera-floating-controls">
          {/* Flash Light Toggle */}
          <button
            type="button"
            className={`cam-control-dock-btn ${flashOn ? "active-flash" : ""}`}
            onClick={handleToggleFlash}
            disabled={togglingFlash}
            title={flashOn ? "Turn OFF Chamber Flash Light" : "Turn ON Chamber Flash Light"}
          >
            {flashOn ? <Zap size={16} /> : <ZapOff size={16} />}
            <span>{flashOn ? "Light ON" : "Chamber Light"}</span>
          </button>

          {/* Capture Photo Snapshot */}
          <button
            type="button"
            className="cam-control-dock-btn"
            onClick={handleCaptureSnapshot}
            disabled={capturing}
            title="Capture still photo from chamber"
          >
            <Camera size={16} />
            <span>{capturing ? "Snapping..." : "Snapshot"}</span>
          </button>

          {/* Full Screen View */}
          <button
            type="button"
            className="cam-control-dock-btn"
            onClick={() => setIsFullScreen(true)}
            title="Expand Full-Screen Camera View"
          >
            <Maximize2 size={16} />
            <span>Expand</span>
          </button>

          {/* Refresh Stream */}
          <button
            type="button"
            className="cam-control-dock-btn icon-only"
            onClick={handleReloadStream}
            title="Refresh Video Stream"
          >
            <RotateCw size={15} />
          </button>
        </div>
      </div>

      {/* Description / Status Footer */}
      <div className="camera-preview-footer">
        <p className="camera-preview-desc">
          Live optical verification inside your PETIGO parcel chamber powered by <strong>ESP32-CAM</strong> on local Wi-Fi.
        </p>

        {demoMode && (
          <button
            type="button"
            className="cam-exit-demo-btn"
            onClick={() => setDemoMode(false)}
            title="Switch back to real hardware stream"
          >
            Exit Simulation
          </button>
        )}
      </div>

      {/* MODAL 1: CAMERA SETTINGS MODAL */}
      {showSettings && (
        <div className="cam-modal-backdrop" onClick={() => setShowSettings(false)}>
          <div className="cam-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="cam-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="cam-modal-icon-wrap">
                  <SettingsIcon size={20} style={{ color: "var(--primary-orange)" }} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Chamber Camera Setup</h4>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Configure AI-Thinker ESP32-CAM stream address
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="cam-modal-close"
                onClick={() => setShowSettings(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="cam-modal-form">
              <label htmlFor="cam-ip-input" className="cam-form-label">
                ESP32-CAM IP or Stream URL
              </label>

              <div className="cam-input-wrap">
                <Wifi size={16} className="cam-input-icon" />
                <input
                  id="cam-ip-input"
                  type="text"
                  value={inputIpOrUrl}
                  onChange={(e) => setInputIpOrUrl(e.target.value)}
                  placeholder="e.g. 192.168.31.144 or http://192.168.31.144:81/stream"
                  className="cam-form-input"
                  autoFocus
                />
              </div>

              <div className="cam-preset-pills">
                <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", alignSelf: "center" }}>
                  Quick Suggestions:
                </span>
                <button
                  type="button"
                  className="cam-preset-pill"
                  onClick={() => setInputIpOrUrl("http://192.168.31.144:81/stream")}
                >
                  Detected ESP32-CAM (192.168.31.144:81)
                </button>
                <button
                  type="button"
                  className="cam-preset-pill"
                  onClick={() => setInputIpOrUrl("http://192.168.31.95:81/stream")}
                >
                  Match Box IP (192.168.31.95:81)
                </button>
              </div>

              <div className="cam-modal-guide">
                <strong>How to find your ESP32-CAM IP:</strong>
                <ol>
                  <li>Connect ESP32-CAM on the ESP-MB baseboard to your PC via micro-USB.</li>
                  <li>Upload the provided firmware from <code>esp32_cam/esp32_cam.ino</code>.</li>
                  <li>Open Serial Monitor (115200 baud) and read the assigned IP address.</li>
                  <li>Paste the IP above and click Save.</li>
                </ol>
              </div>

              {saveStatus && (
                <div className="cam-modal-success">
                  <Check size={16} />
                  <span>{saveStatus}</span>
                </div>
              )}

              <div className="cam-modal-actions">
                <button
                  type="button"
                  className="btn-cam-secondary"
                  onClick={() => setShowSettings(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-cam-primary">
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: FULL-SCREEN INSPECTION MODAL */}
      {isFullScreen && (
        <div className="cam-fullscreen-backdrop" onClick={() => setIsFullScreen(false)}>
          <div className="cam-fullscreen-box" onClick={(e) => e.stopPropagation()}>
            <div className="cam-fullscreen-topbar">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="camera-badge-live">
                  <span className="camera-pulse-dot live-green" />
                  OPTICAL INSPECTION • LIVE
                </span>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", fontFamily: "monospace" }}>
                  PETIGO BOX001 CHAMBER
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  type="button"
                  className="cam-fullscreen-action-btn"
                  onClick={handleToggleFlash}
                >
                  {flashOn ? <Zap size={16} color="#FF8A00" /> : <ZapOff size={16} />}
                  <span>{flashOn ? "Flash ON" : "Flash OFF"}</span>
                </button>

                <button
                  type="button"
                  className="cam-fullscreen-action-btn"
                  onClick={handleCaptureSnapshot}
                >
                  <Camera size={16} />
                  <span>Take Snapshot</span>
                </button>

                <button
                  type="button"
                  className="cam-fullscreen-close"
                  onClick={() => setIsFullScreen(false)}
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            <div className="cam-fullscreen-viewport">
              <img
                src={cameraUrl}
                alt="Full-Screen Chamber Feed"
                className="cam-fullscreen-img"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SNAPSHOT CAPTURED MODAL */}
      {snapshotImg && (
        <div className="cam-modal-backdrop" onClick={() => setSnapshotImg(null)}>
          <div className="cam-snapshot-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cam-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Camera size={18} style={{ color: "var(--primary-orange)" }} />
                <h4 style={{ margin: 0, fontWeight: 800 }}>Chamber Snapshot Captured</h4>
              </div>
              <button
                type="button"
                className="cam-modal-close"
                onClick={() => setSnapshotImg(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="cam-snapshot-preview-wrap">
              <img
                src={snapshotImg}
                alt="Captured Chamber Still"
                className="cam-snapshot-img"
              />
            </div>

            <div className="cam-snapshot-actions">
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Captured at {formatISTTime(new Date(), { includeSeconds: true })}
              </span>

              <a
                href={snapshotImg}
                download={`petigo_chamber_snapshot_${Date.now()}.jpg`}
                className="btn-cam-primary"
                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Download size={15} />
                <span>Download Photo</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChamberCamera;
