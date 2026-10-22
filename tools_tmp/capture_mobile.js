const path = require("path");
const { chromium } = require("./node_modules/playwright");

const SCREENSHOTS_DIR = path.join(__dirname, "..", "report_screenshots");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function captureMobile() {
  console.log("Capturing 16_mobile_dashboard.png at 390x844...");
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1
  });

  const page = await context.newPage();
  await page.goto("http://localhost:5173/");
  await page.waitForSelector("#login-email");
  await page.fill("#login-email", "demo@petigo.com");
  await page.fill("#login-password", "Password123!");
  await page.click(".login-submit-btn");

  await page.waitForSelector(".petigo-hero-card");
  await sleep(4000); // allow telemetry and responsive layout to settle

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "16_mobile_dashboard.png") });
  await browser.close();
  console.log("16_mobile_dashboard.png captured successfully!");
}

captureMobile().catch(console.error);
