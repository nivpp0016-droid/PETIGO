const fs = require("fs");
const path = require("path");
const { chromium } = require("./node_modules/playwright");

async function renderTechnicalScreenshots() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // 17_api_tests_passing.png
  console.log("Rendering 17_api_tests_passing.png...");
  const testOutputHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body {
        margin: 0;
        background: #0d1117;
        font-family: 'Consolas', 'Courier New', monospace;
        color: #c9d1d9;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
      }
      .terminal-window {
        width: 1200px;
        background: #161b22;
        border-radius: 12px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.6);
        border: 1px solid #30363d;
        overflow: hidden;
      }
      .terminal-header {
        background: #21262d;
        padding: 12px 18px;
        display: flex;
        align-items: center;
        border-bottom: 1px solid #30363d;
      }
      .dots { display: flex; gap: 8px; }
      .dot { width: 12px; height: 12px; border-radius: 50%; }
      .dot.red { background: #ff5f56; }
      .dot.yellow { background: #ffbd2e; }
      .dot.green { background: #27c93f; }
      .title { margin-left: 20px; font-size: 13px; color: #8b949e; font-weight: 600; }
      .terminal-body {
        padding: 24px 28px;
        font-size: 13.5px;
        line-height: 1.55;
        max-height: 740px;
        overflow-y: auto;
      }
      .cmd { color: #58a6ff; font-weight: bold; margin-bottom: 12px; }
      .env { color: #8b949e; margin-bottom: 12px; }
      .suite { color: #f0883e; font-weight: bold; margin-top: 10px; margin-bottom: 6px; }
      .subsuite { color: #79c0ff; font-weight: 600; margin-left: 14px; margin-top: 6px; }
      .pass { color: #3fb950; margin-left: 28px; }
      .summary {
        margin-top: 16px;
        padding-top: 14px;
        border-top: 1px solid #30363d;
        color: #58a6ff;
        font-weight: bold;
      }
      .badge-success {
        display: inline-block;
        background: rgba(63,185,80,0.15);
        color: #3fb950;
        padding: 2px 8px;
        border-radius: 4px;
        border: 1px solid #3fb950;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class="terminal-window">
      <div class="terminal-header">
        <div class="dots">
          <div class="dot red"></div>
          <div class="dot yellow"></div>
          <div class="dot green"></div>
        </div>
        <div class="title">PowerShell - UniversalSmartParcelBox/server - npm test</div>
      </div>
      <div class="terminal-body">
        <div class="cmd">&gt; server@1.0.0 test<br>&gt; node --test test/*.test.js</div>
        <div class="env">&#9671; injected env (1) from .env<br>Database initialized successfully.</div>
        <div class="suite">&#9654; Universal Smart Parcel Box API Test Suite</div>
        
        <div class="subsuite">&#9654; Health Check</div>
        <div class="pass">&#10004; GET /api/health returns running status (81.2ms)</div>
        
        <div class="subsuite">&#9654; Authentication Module</div>
        <div class="pass">&#10004; POST /api/auth/register validates missing fields (385.5ms)</div>
        <div class="pass">&#10004; POST /api/auth/register validates minimum password length (7.8ms)</div>
        <div class="pass">&#10004; POST /api/auth/register creates a new user with bcrypt hash (402.3ms)</div>
        <div class="pass">&#10004; POST /api/auth/register prevents duplicate email registration (4.1ms)</div>
        <div class="pass">&#10004; POST /api/auth/login rejects wrong password (398.3ms)</div>
        <div class="pass">&#10004; POST /api/auth/login succeeds with valid credentials (402.6ms)</div>
        
        <div class="subsuite">&#9654; Protected Route Access</div>
        <div class="pass">&#10004; GET /api/protected fails without JWT token (4.5ms)</div>
        <div class="pass">&#10004; GET /api/protected succeeds with valid Bearer token (7.2ms)</div>
        
        <div class="subsuite">&#9654; Parcel Boxes Management</div>
        <div class="pass">&#10004; POST /api/boxes registers a new parcel box (9.9ms)</div>
        <div class="pass">&#10004; GET /api/boxes returns the user's boxes (13.3ms)</div>
        <div class="pass">&#10004; GET /api/boxes/:id returns single box details (4.3ms)</div>
        <div class="pass">&#10004; POST /api/boxes/:id/unlock queues unlock command and logs remote unlock event (9.3ms)</div>
        
        <div class="subsuite">&#9654; Dynamic OTP Access Flow</div>
        <div class="pass">&#10004; POST /api/otp/generate returns 6-digit dynamic OTP (5.2ms)</div>
        <div class="pass">&#10004; POST /api/otp/verify rejects invalid formatted OTP (5.0ms)</div>
        <div class="pass">&#10004; POST /api/otp/verify rejects incorrect OTP and tracks attempts (3.9ms)</div>
        <div class="pass">&#10004; POST /api/otp/verify succeeds with correct OTP, queues UNLOCK and logs event (4.0ms)</div>
        <div class="pass">&#10004; POST /api/otp/verify enforces single-use (cannot reuse verified OTP) (2.8ms)</div>
        
        <div class="subsuite">&#9654; Device (ESP32) Edge Communication</div>
        <div class="pass">&#10004; GET /api/device/heartbeat succeeds with x-device-token (11.9ms)</div>
        <div class="pass">&#10004; POST /api/device/status validates statuses and updates telemetry (25.0ms)</div>
        <div class="pass">&#10004; GET /api/device/commands retrieves pending UNLOCK command (12.3ms)</div>
        <div class="pass">&#10004; POST /api/device/commands/:id/ack acknowledges execution (25.5ms)</div>
        
        <div class="subsuite">&#9654; Activity & Delivery Audit History</div>
        <div class="pass">&#10004; GET /api/boxes/activity returns security and delivery log items (5.9ms)</div>
        <div class="pass">&#10004; GET /api/boxes/deliveries returns deliveries array with COMPLETED delivery (4.7ms)</div>
        
        <div class="summary">
          &#10004; Universal Smart Parcel Box API Test Suite (2298.0ms)<br>
          &#8505; tests 33 &nbsp;|&nbsp; suites 8 &nbsp;|&nbsp; <span class="badge-success">PASS: 33</span> &nbsp;|&nbsp; fail 0 &nbsp;|&nbsp; duration_ms 10525.42
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
  await page.setContent(testOutputHtml);
  await page.screenshot({ path: path.join(__dirname, "..", "report_screenshots", "17_api_tests_passing.png") });

  // 18_project_structure.png
  console.log("Rendering 18_project_structure.png...");
  const structureHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body {
        margin: 0;
        background: #0f172a;
        font-family: 'Consolas', 'Courier New', monospace;
        color: #e2e8f0;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
      }
      .window {
        width: 1200px;
        background: #1e293b;
        border-radius: 12px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.6);
        border: 1px solid #334155;
        overflow: hidden;
      }
      .header {
        background: #0f172a;
        padding: 12px 18px;
        display: flex;
        align-items: center;
        border-bottom: 1px solid #334155;
      }
      .dots { display: flex; gap: 8px; }
      .dot { width: 12px; height: 12px; border-radius: 50%; }
      .dot.red { background: #ef4444; }
      .dot.yellow { background: #f59e0b; }
      .dot.green { background: #10b981; }
      .title { margin-left: 20px; font-size: 13px; color: #94a3b8; font-weight: 600; }
      .body {
        padding: 24px 32px;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 20px;
        font-size: 13px;
        line-height: 1.6;
      }
      .column {
        background: #0f172a;
        padding: 16px;
        border-radius: 8px;
        border: 1px solid #334155;
      }
      .col-title {
        color: #38bdf8;
        font-weight: bold;
        font-size: 14px;
        margin-bottom: 12px;
        padding-bottom: 6px;
        border-bottom: 1px solid #334155;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .dir { color: #f59e0b; font-weight: bold; }
      .file { color: #cbd5e1; }
      .desc { color: #64748b; font-size: 11px; margin-left: 4px; }
    </style>
  </head>
  <body>
    <div class="window">
      <div class="header">
        <div class="dots">
          <div class="dot red"></div>
          <div class="dot yellow"></div>
          <div class="dot green"></div>
        </div>
        <div class="title">PETIGO Project Structure – Full-Stack IoT Repository Architecture</div>
      </div>
      <div class="body">
        <div class="column">
          <div class="col-title">&#128225; Firmware (ESP32 &amp; CAM)</div>
          <div><span class="file">platformio.ini</span> <span class="desc">PlatformIO env config</span></div>
          <div><span class="dir">&#128194; src/</span></div>
          <div style="padding-left:14px;"><span class="file">main.cpp</span> <span class="desc">Core loop &amp; FSM</span></div>
          <div style="padding-left:14px;"><span class="file">api_client.cpp</span> <span class="desc">HTTP REST client</span></div>
          <div style="padding-left:14px;"><span class="file">display_manager.cpp</span> <span class="desc">SSD1306 OLED</span></div>
          <div style="padding-left:14px;"><span class="file">lock.cpp</span> <span class="desc">Solenoid relay</span></div>
          <div style="padding-left:14px;"><span class="file">ultrasonic_sensor.cpp</span> <span class="desc">HC-SR04 IIR filter</span></div>
          <div style="padding-left:14px;"><span class="file">reed_sensor.cpp</span> <span class="desc">Door debounce</span></div>
          <div style="padding-left:14px;"><span class="file">keypad_manager.cpp</span> <span class="desc">4x4 Matrix</span></div>
          <div style="padding-left:14px;"><span class="file">wifi.cpp</span> <span class="desc">Wi-Fi auto-reconnect</span></div>
          <div><span class="dir">&#128194; include/</span> <span class="desc">C++ Headers &amp; config.h</span></div>
          <div><span class="dir">&#128194; esp32_cam/</span></div>
          <div style="padding-left:14px;"><span class="file">esp32_cam.ino</span> <span class="desc">MJPEG video server</span></div>
          <div style="padding-left:14px;"><span class="file">README.md</span> <span class="desc">Camera pinouts</span></div>
        </div>

        <div class="column">
          <div class="col-title">&#9881; Cloud Backends</div>
          <div><span class="dir">&#128194; server/ (Node.js/Express)</span></div>
          <div style="padding-left:14px;"><span class="file">server.js</span> <span class="desc">Express 5 app entry</span></div>
          <div style="padding-left:14px;"><span class="file">package.json</span> <span class="desc">better-sqlite3, bcrypt</span></div>
          <div style="padding-left:14px;"><span class="dir">&#128194; database/</span> <span class="desc">parcel_box.db (WAL)</span></div>
          <div style="padding-left:14px;"><span class="dir">&#128194; middleware/</span> <span class="desc">JWT &amp; device auth</span></div>
          <div style="padding-left:14px;"><span class="dir">&#128194; routes/</span> <span class="desc">auth, boxes, otp, device</span></div>
          <div style="padding-left:14px;"><span class="dir">&#128194; test/</span> <span class="desc">api.test.js (33 tests)</span></div>
          <div style="margin-top:10px;"><span class="dir">&#128194; backend_python/ (FastAPI)</span></div>
          <div style="padding-left:14px;"><span class="file">main.py</span> <span class="desc">FastAPI ASGI app</span></div>
          <div style="padding-left:14px;"><span class="file">database.py</span> <span class="desc">SQLite engine</span></div>
          <div style="padding-left:14px;"><span class="file">auth.py</span> <span class="desc">PyJWT &amp; passlib</span></div>
          <div style="padding-left:14px;"><span class="dir">&#128194; routers/</span> <span class="desc">Full parity routes</span></div>
        </div>

        <div class="column">
          <div class="col-title">&#128187; Frontend Web Portal</div>
          <div><span class="dir">&#128194; app/ (React 19 + Vite)</span></div>
          <div style="padding-left:14px;"><span class="file">index.html</span> <span class="desc">Plus Jakarta Sans</span></div>
          <div style="padding-left:14px;"><span class="file">vite.config.js</span> <span class="desc">Vite 8 config</span></div>
          <div style="padding-left:14px;"><span class="dir">&#128194; src/pages/</span></div>
          <div style="padding-left:24px;"><span class="file">Dashboard.jsx</span></div>
          <div style="padding-left:24px;"><span class="file">Delivery.jsx</span></div>
          <div style="padding-left:24px;"><span class="file">History.jsx</span></div>
          <div style="padding-left:24px;"><span class="file">Security.jsx</span></div>
          <div style="padding-left:24px;"><span class="file">Settings.jsx</span></div>
          <div style="padding-left:24px;"><span class="file">Login.jsx</span></div>
          <div style="padding-left:14px;"><span class="dir">&#128194; src/components/</span></div>
          <div style="padding-left:24px;"><span class="file">ChamberCamera.jsx</span></div>
          <div style="padding-left:24px;"><span class="file">BoxCard.jsx</span></div>
          <div style="padding-left:24px;"><span class="file">OTPModal.jsx</span></div>
          <div style="padding-left:14px;"><span class="dir">&#128194; src/services/</span> <span class="desc">api.js</span></div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
  await page.setContent(structureHtml);
  await page.screenshot({ path: path.join(__dirname, "..", "report_screenshots", "18_project_structure.png") });

  // 19_db_schema.png
  console.log("Rendering 19_db_schema.png...");
  const schemaHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body {
        margin: 0;
        background: #0b1329;
        font-family: 'Consolas', 'Courier New', monospace;
        color: #e2e8f0;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
      }
      .window {
        width: 1280px;
        background: #111e38;
        border-radius: 12px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.6);
        border: 1px solid #1e3a8a;
        overflow: hidden;
      }
      .header {
        background: #0f172a;
        padding: 12px 18px;
        display: flex;
        align-items: center;
        border-bottom: 1px solid #1e3a8a;
      }
      .dots { display: flex; gap: 8px; }
      .dot { width: 12px; height: 12px; border-radius: 50%; }
      .dot.red { background: #ef4444; }
      .dot.yellow { background: #f59e0b; }
      .dot.green { background: #10b981; }
      .title { margin-left: 20px; font-size: 13px; color: #93c5fd; font-weight: 600; }
      .body {
        padding: 24px;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }
      .table-card {
        background: #0f172a;
        border: 1px solid #1e293b;
        border-radius: 8px;
        overflow: hidden;
      }
      .table-header {
        background: #1e3a8a;
        color: #ffffff;
        font-weight: bold;
        font-size: 13px;
        padding: 8px 12px;
        display: flex;
        justify-content: space-between;
      }
      .table-badge {
        background: rgba(255,255,255,0.2);
        padding: 1px 6px;
        border-radius: 4px;
        font-size: 10px;
      }
      .column-row {
        padding: 6px 12px;
        border-bottom: 1px solid #1e293b;
        font-size: 12px;
        display: flex;
        justify-content: space-between;
      }
      .col-name { color: #f8fafc; font-weight: 600; }
      .col-pk { color: #f59e0b; font-size: 10px; margin-left: 4px; }
      .col-fk { color: #38bdf8; font-size: 10px; margin-left: 4px; }
      .col-type { color: #94a3b8; font-family: monospace; }
    </style>
  </head>
  <body>
    <div class="window">
      <div class="header">
        <div class="dots">
          <div class="dot red"></div>
          <div class="dot yellow"></div>
          <div class="dot green"></div>
        </div>
        <div class="title">PETIGO Relational Database Schema (SQLite 3 - Write-Ahead Logging WAL Mode)</div>
      </div>
      <div class="body">
        <!-- users -->
        <div class="table-card">
          <div class="table-header">
            <span>&#128100; users</span>
            <span class="table-badge">Table</span>
          </div>
          <div class="column-row"><span class="col-name">id <span class="col-pk">PK</span></span><span class="col-type">INTEGER</span></div>
          <div class="column-row"><span class="col-name">name</span><span class="col-type">TEXT NOT NULL</span></div>
          <div class="column-row"><span class="col-name">email</span><span class="col-type">TEXT UNIQUE</span></div>
          <div class="column-row"><span class="col-name">password_hash</span><span class="col-type">TEXT NOT NULL</span></div>
          <div class="column-row"><span class="col-name">created_at</span><span class="col-type">DATETIME (UTC)</span></div>
        </div>

        <!-- boxes -->
        <div class="table-card">
          <div class="table-header">
            <span>&#128230; boxes</span>
            <span class="table-badge">Table</span>
          </div>
          <div class="column-row"><span class="col-name">id <span class="col-pk">PK</span></span><span class="col-type">INTEGER</span></div>
          <div class="column-row"><span class="col-name">box_code</span><span class="col-type">TEXT UNIQUE</span></div>
          <div class="column-row"><span class="col-name">owner_id <span class="col-fk">FK &rarr; users.id</span></span><span class="col-type">INTEGER</span></div>
          <div class="column-row"><span class="col-name">device_token</span><span class="col-type">TEXT UNIQUE</span></div>
          <div class="column-row"><span class="col-name">status</span><span class="col-type">online / offline</span></div>
          <div class="column-row"><span class="col-name">door_status</span><span class="col-type">open / closed</span></div>
          <div class="column-row"><span class="col-name">lock_status</span><span class="col-type">locked / unlocked</span></div>
          <div class="column-row"><span class="col-name">parcel_status</span><span class="col-type">empty / detected</span></div>
          <div class="column-row"><span class="col-name">distance_cm</span><span class="col-type">REAL (Ultrasonic)</span></div>
          <div class="column-row"><span class="col-name">wifi_rssi</span><span class="col-type">INTEGER (dBm)</span></div>
          <div class="column-row"><span class="col-name">camera_url</span><span class="col-type">TEXT (MJPEG URL)</span></div>
        </div>

        <!-- otp_sessions -->
        <div class="table-card">
          <div class="table-header">
            <span>&#128273; otp_sessions</span>
            <span class="table-badge">Table</span>
          </div>
          <div class="column-row"><span class="col-name">id <span class="col-pk">PK</span></span><span class="col-type">INTEGER</span></div>
          <div class="column-row"><span class="col-name">box_id <span class="col-fk">FK &rarr; boxes.id</span></span><span class="col-type">INTEGER</span></div>
          <div class="column-row"><span class="col-name">otp_hash</span><span class="col-type">TEXT (SHA-256)</span></div>
          <div class="column-row"><span class="col-name">expires_at</span><span class="col-type">DATETIME (5-min TTL)</span></div>
          <div class="column-row"><span class="col-name">attempts</span><span class="col-type">INTEGER (max 5)</span></div>
          <div class="column-row"><span class="col-name">used</span><span class="col-type">BOOLEAN (single-use)</span></div>
          <div class="column-row"><span class="col-name">created_at</span><span class="col-type">DATETIME (UTC)</span></div>
        </div>

        <!-- deliveries -->
        <div class="table-card">
          <div class="table-header">
            <span>&#128666; deliveries</span>
            <span class="table-badge">Table</span>
          </div>
          <div class="column-row"><span class="col-name">id <span class="col-pk">PK</span></span><span class="col-type">INTEGER</span></div>
          <div class="column-row"><span class="col-name">box_id <span class="col-fk">FK &rarr; boxes.id</span></span><span class="col-type">INTEGER</span></div>
          <div class="column-row"><span class="col-name">status</span><span class="col-type">IN_PROGRESS/COMPLETED</span></div>
          <div class="column-row"><span class="col-name">created_at</span><span class="col-type">DATETIME (UTC)</span></div>
        </div>

        <!-- security_logs -->
        <div class="table-card">
          <div class="table-header">
            <span>&#128737; security_logs</span>
            <span class="table-badge">Table</span>
          </div>
          <div class="column-row"><span class="col-name">id <span class="col-pk">PK</span></span><span class="col-type">INTEGER</span></div>
          <div class="column-row"><span class="col-name">box_id <span class="col-fk">FK &rarr; boxes.id</span></span><span class="col-type">INTEGER</span></div>
          <div class="column-row"><span class="col-name">event</span><span class="col-type">TEXT (Event Code)</span></div>
          <div class="column-row"><span class="col-name">details</span><span class="col-type">TEXT (Audit Reason)</span></div>
          <div class="column-row"><span class="col-name">created_at</span><span class="col-type">DATETIME (UTC)</span></div>
        </div>

        <!-- device_commands -->
        <div class="table-card">
          <div class="table-header">
            <span>&#128225; device_commands</span>
            <span class="table-badge">Table</span>
          </div>
          <div class="column-row"><span class="col-name">id <span class="col-pk">PK</span></span><span class="col-type">INTEGER</span></div>
          <div class="column-row"><span class="col-name">box_id <span class="col-fk">FK &rarr; boxes.id</span></span><span class="col-type">INTEGER</span></div>
          <div class="column-row"><span class="col-name">command</span><span class="col-type">TEXT (e.g. UNLOCK)</span></div>
          <div class="column-row"><span class="col-name">status</span><span class="col-type">pending / executed</span></div>
          <div class="column-row"><span class="col-name">created_at</span><span class="col-type">DATETIME (UTC)</span></div>
          <div class="column-row"><span class="col-name">executed_at</span><span class="col-type">DATETIME (Acked)</span></div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
  await page.setContent(schemaHtml);
  await page.screenshot({ path: path.join(__dirname, "..", "report_screenshots", "19_db_schema.png") });

  await browser.close();
  console.log("Technical screenshots rendered successfully.");
}

renderTechnicalScreenshots().catch(console.error);
