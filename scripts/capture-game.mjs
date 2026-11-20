import { chromium } from "@playwright/test";
import { mkdir, copyFile } from "node:fs/promises";
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
await mkdir("docs/screenshots", { recursive: true });
await mkdir("release", { recursive: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  await page.goto("http://localhost:5173/");
  await page.waitForSelector("#graphicsSettings");
  await page.locator("#graphicsSettings").click();
  await page.waitForTimeout(5500);
  await page.screenshot({
    path: "docs/screenshots/driving.png",
    timeout: 90000,
  });
  await page.keyboard.press("e");
  await page.waitForFunction(() =>
    document.querySelector("#weaponHud").textContent.includes("PISTOLET"),
  );
  await page.waitForTimeout(3500);
  await page.screenshot({
    path: "docs/screenshots/on-foot.png",
    timeout: 90000,
  });
  await page.close();
  const tablet = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 1,
  });
  await tablet.goto("http://localhost:5173/");
  await tablet.waitForSelector("#tabletControls", { state: "visible" });
  await tablet.waitForTimeout(5500);
  await tablet.screenshot({
    path: "docs/screenshots/tablet.png",
    timeout: 90000,
  });
  for (const name of ["driving", "on-foot", "tablet"])
    await copyFile(`docs/screenshots/${name}.png`, `release/game-${name}.png`);
} finally {
  await browser.close();
}
