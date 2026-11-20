import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
let browserErrors = [];
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  });
  const errors = browserErrors;
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("http://localhost:5173/");
  await page.waitForSelector("#graphicsSettings");
  await page.waitForTimeout(2000);
  await page.keyboard.press("e");
  await page.waitForTimeout(300);
  assert.match(await page.locator("#weaponHud").textContent(), /PISTOLET/);
  await page.mouse.click(640, 400);
  await page.waitForFunction(
    () => document.querySelector("#weaponHud").textContent.includes("11 / 120"),
    {},
    { timeout: 15000 },
  );
  assert.match(await page.locator("#weaponHud").textContent(), /11 \/ 120/);
  await page.locator("#graphicsSettings").click();
  await page.waitForTimeout(300);
  assert.match(
    await page.locator("#graphicsSettings").textContent(),
    /PERFORMANCE/,
  );
  await page.locator("#graphicsSettings").click();
  await page.screenshot({ path: "release/graphics-smoke.png", timeout: 90000 });
  assert.deepEqual(errors, [], "Browser or shader errors");
  console.log("Rendering, on-foot shooting and quality switch passed.");
} catch (error) {
  const details = [error.stack, ...browserErrors]
    .join("\n")
    .replace(/%/g, "%25")
    .replace(/\r/g, "%0D")
    .replace(/\n/g, "%0A");
  console.error(`::error::${details}`);
  throw error;
} finally {
  await browser.close();
}
