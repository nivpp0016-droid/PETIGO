const fs = require("fs");
const path = require("path");
const { chromium } = require("./node_modules/playwright");

const SCREENSHOTS_DIR = path.join(__dirname, "..", "report_screenshots");
const STATE_FILE = path.join(__dirname, "device_state.json");

function setDeviceState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log("=== PETIGO Automated Screenshot Capture Suite ===");

  // Ensure clean idle state
  setDeviceState({
    doorStatus: "closed",
    lockStatus: "locked",
    parcelStatus: "empty",
    distanceCm: 45.2,
    wifiRssi: -58
  });

  const browser = await chromium.launch({
    channel: "msedge",
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });

  const page = await context.newPage();

  // 1. 01_login.png
  console.log("1. Capturing 01_login.png...");
  await page.goto("http://localhost:5173/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector("#login-email");
  await page.fill("#login-email", "demo@petigo.com");
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "01_login.png") });

  // 2. 02_register.png
  console.log("2. Skipping 02_register.png (no registration page in React app; documented in INDEX.md)");

  // Log in
  console.log("Logging into dashboard as demo@petigo.com...");
  await page.fill("#login-password", "Password123!");
  await page.click(".login-submit-btn");
  await page.waitForSelector(".petigo-hero-card");
  await sleep(4000); // allow telemetry to populate

  // 3. 03_dashboard_idle.png
  console.log("3. Capturing 03_dashboard_idle.png...");
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "03_dashboard_idle.png") });

  // 4. 04_dashboard_telemetry.png
  console.log("4. Capturing 04_dashboard_telemetry.png...");
  await page.evaluate(() => window.scrollTo(0, 180));
  await sleep(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "04_dashboard_telemetry.png") });
  await page.evaluate(() => window.scrollTo(0, 0));

  // 5. 05_chamber_camera.png
  console.log("5. Capturing 05_chamber_camera.png...");
  const cameraCard = await page.$(".camera-feed-card");
  if (cameraCard) {
    await cameraCard.scrollIntoViewIfNeeded();
    await sleep(1000);
    await cameraCard.screenshot({ path: path.join(SCREENSHOTS_DIR, "05_chamber_camera.png") });
  }
  await page.evaluate(() => window.scrollTo(0, 0));

  // 6. 06_otp_modal.png
  console.log("6. Capturing 06_otp_modal.png...");
  const genOtpBtn = page.getByRole("button", { name: /Generate Delivery OTP/i });
  await genOtpBtn.first().click();
  await page.waitForSelector(".modal-backdrop", { timeout: 6000 });
  await sleep(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "06_otp_modal.png") });
  
  // Close modal
  const modalCloseBtn = await page.$(".modal-close-btn");
  if (modalCloseBtn) await modalCloseBtn.click();
  await sleep(1000);

  // 7. 07_delivery_page.png
  console.log("7. Capturing 07_delivery_page.png...");
  const deliveryLink = page.locator("button.sidebar-link").filter({ hasText: "Delivery Access" });
  await deliveryLink.first().click();
  await page.waitForSelector(".virtual-keypad", { timeout: 6000 });
  await sleep(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "07_delivery_page.png") });

  // 8. 08_otp_verified.png
  console.log("8. Capturing 08_otp_verified.png...");
  const activeOtp = await page.evaluate(async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:3000/api/otp/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ boxId: 1 })
    });
    const data = await res.json();
    return data.otp;
  });
  console.log(`Generated active OTP: ${activeOtp}`);

  // Clear keypad slots first
  const clrBtn = page.locator(".keypad-btn").filter({ hasText: /CLR/i });
  await clrBtn.first().click();
  await sleep(100);

  for (const digit of activeOtp) {
    const digitBtn = page.locator(".keypad-btn").filter({ hasText: new RegExp(`^${digit}$`) });
    await digitBtn.first().click();
    await sleep(120);
  }
  await sleep(400);
  await page.getByRole("button", { name: /Verify & Unlock Chamber/i }).click();
  await page.waitForSelector(".delivery-success-icon", { timeout: 6000 });
  await sleep(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "08_otp_verified.png") });

  // 9. 09_otp_invalid.png
  console.log("9. Capturing 09_otp_invalid.png...");
  await page.getByRole("button", { name: /Verify Another Code/i }).click();
  await page.waitForSelector(".virtual-keypad");
  await sleep(600);

  // Generate another active OTP so session exists
  await page.evaluate(async () => {
    const token = localStorage.getItem("token");
    await fetch("http://localhost:3000/api/otp/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ boxId: 1 })
    });
  });

  // Enter invalid code 000000
  for (let i = 0; i < 6; i++) {
    const zeroBtn = page.locator(".keypad-btn").filter({ hasText: /^0$/ });
    await zeroBtn.first().click();
    await sleep(100);
  }
  await page.getByRole("button", { name: /Verify & Unlock Chamber/i }).click();
  await sleep(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "09_otp_invalid.png") });

  // 10. 10_otp_lockout.png
  console.log("10. Capturing 10_otp_lockout.png...");
  for (let attempt = 0; attempt < 4; attempt++) {
    await clrBtn.first().click();
    await sleep(100);
    for (let i = 0; i < 6; i++) {
      const zeroBtn = page.locator(".keypad-btn").filter({ hasText: /^0$/ });
      await zeroBtn.first().click();
      await sleep(60);
    }
    await page.getByRole("button", { name: /Verify & Unlock Chamber/i }).click();
    await sleep(1200);
  }
  await sleep(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "10_otp_lockout.png") });

  // 11. 11_remote_unlock.png
  console.log("11. Capturing 11_remote_unlock.png...");
  const dashLink = page.locator("button.sidebar-link").filter({ hasText: "Dashboard" });
  await dashLink.first().click();
  await page.waitForSelector(".petigo-hero-card");

  setDeviceState({
    doorStatus: "closed",
    lockStatus: "unlocked",
    parcelStatus: "empty",
    distanceCm: 45.2,
    wifiRssi: -58
  });
  await sleep(4500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "11_remote_unlock.png") });

  // 12. 12_dashboard_parcel_detected.png
  console.log("12. Capturing 12_dashboard_parcel_detected.png...");
  setDeviceState({
    doorStatus: "open",
    lockStatus: "unlocked",
    parcelStatus: "detected",
    distanceCm: 14.5,
    wifiRssi: -58
  });
  await sleep(4500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "12_dashboard_parcel_detected.png") });

  // Reset device state to idle
  setDeviceState({
    doorStatus: "closed",
    lockStatus: "locked",
    parcelStatus: "empty",
    distanceCm: 45.2,
    wifiRssi: -58
  });

  // 13. 13_history.png
  console.log("13. Capturing 13_history.png...");
  const historyLink = page.locator("button.sidebar-link").filter({ hasText: "Delivery History" });
  await historyLink.first().click();
  await page.waitForSelector(".history-page", { timeout: 6000 });
  await sleep(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "13_history.png") });

  // 14. 14_security_log.png
  console.log("14. Capturing 14_security_log.png...");
  const securityLink = page.locator("button.sidebar-link").filter({ hasText: "Security & Logs" });
  await securityLink.first().click();
  await page.waitForSelector(".security-page", { timeout: 6000 });
  await sleep(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "14_security_log.png") });

  // 15. 15_settings.png
  console.log("15. Capturing 15_settings.png...");
  const settingsLink = page.locator("button.sidebar-link").filter({ hasText: "Settings" });
  await settingsLink.first().click();
  await page.waitForSelector(".settings-page", { timeout: 6000 });
  await sleep(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "15_settings.png") });

  // 16. 16_mobile_dashboard.png
  console.log("16. Capturing 16_mobile_dashboard.png...");
  await page.setViewportSize({ width: 390, height: 844 });
  await dashLink.first().click();
  await page.waitForSelector(".petigo-hero-card");
  await sleep(4000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "16_mobile_dashboard.png") });

  await browser.close();
  console.log("=== All UI screenshots captured successfully! ===");
}

main().catch(console.error);
