const http = require("http");
const fs = require("fs");
const path = require("path");

const API_HOST = "localhost";
const API_PORT = 3000;
const DEVICE_TOKEN = "0002dd345005e1bcc1a016bdb9855d55b7d6a0522f6a49c99013145aca8b5228";
const STATE_FILE = path.join(__dirname, "device_state.json");

// Default state
let currentState = {
  doorStatus: "closed",
  lockStatus: "locked",
  parcelStatus: "empty",
  distanceCm: 45.2,
  wifiRssi: -58
};

function readCustomState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
      currentState = { ...currentState, ...data };
    }
  } catch (e) {
    // ignore
  }
}

function sendTelemetry() {
  readCustomState();
  const payload = JSON.stringify(currentState);

  const req = http.request(
    {
      hostname: API_HOST,
      port: API_PORT,
      path: "/api/device/status",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        "x-device-token": DEVICE_TOKEN
      }
    },
    (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        // console.log(`[SIMULATOR] Telemetry sent: ${payload} -> ${res.statusCode}`);
      });
    }
  );

  req.on("error", (err) => {
    // console.error(`[SIMULATOR] Telemetry error: ${err.message}`);
  });
  req.write(payload);
  req.end();
}

function pollCommands() {
  const req = http.request(
    {
      hostname: API_HOST,
      port: API_PORT,
      path: "/api/device/commands",
      method: "GET",
      headers: {
        "x-device-token": DEVICE_TOKEN
      }
    },
    (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          if (json.command === "UNLOCK" && json.commandId) {
            console.log(`[SIMULATOR] Received UNLOCK command (ID: ${json.commandId}), executing and acknowledging...`);
            acknowledgeCommand(json.commandId);
            // Temporarily set lock to unlocked for 5 seconds
            currentState.lockStatus = "unlocked";
            setTimeout(() => {
              currentState.lockStatus = "locked";
            }, 5000);
          }
        } catch (e) {
          // ignore
        }
      });
    }
  );

  req.on("error", () => {});
  req.end();
}

function acknowledgeCommand(commandId) {
  const req = http.request(
    {
      hostname: API_HOST,
      port: API_PORT,
      path: `/api/device/commands/${commandId}/ack`,
      method: "POST",
      headers: {
        "x-device-token": DEVICE_TOKEN
      }
    },
    (res) => {
      console.log(`[SIMULATOR] Acknowledged command ${commandId} with status ${res.statusCode}`);
    }
  );
  req.on("error", () => {});
  req.write("");
  req.end();
}

console.log("[SIMULATOR] ESP32 Simulator running...");
console.log(`[SIMULATOR] Device token: ${DEVICE_TOKEN}`);
console.log(`[SIMULATOR] State file: ${STATE_FILE}`);

// Loop telemetry every 3 seconds, poll commands every 2 seconds
setInterval(sendTelemetry, 3000);
setInterval(pollCommands, 2000);

// Run initial
sendTelemetry();
pollCommands();
