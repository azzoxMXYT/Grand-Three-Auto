import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  const errors = [];
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
  await page.mouse.click(720, 450);
  await page.waitForTimeout(300);
  assert.match(await page.locator("#weaponHud").textContent(), /11 \/ 120/);
  await page.locator("#graphicsSettings").click();
  await page.waitForTimeout(300);
  assert.match(
    await page.locator("#graphicsSettings").textContent(),
    /PERFORMANCE/,
  );
  await page.locator("#graphicsSettings").click();
  await page.screenshot({ path: "release/graphics-smoke.png" });
  assert.deepEqual(errors, [], "Browser or shader errors");
  console.log("Rendering, on-foot shooting and quality switch passed.");
} finally {
  await browser.close();
}
