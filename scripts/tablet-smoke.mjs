import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
let errors = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 1,
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("http://localhost:5173/");
  await page.waitForSelector("#tabletControls", { state: "visible" });
  assert.equal(
    await page.locator("#graphicsSettings").getAttribute("data-mode"),
    "eco",
  );
  const session = await page.context().newCDPSession(page);
  const move = await page.locator("#moveStick").boundingBox(),
    look = await page.locator("#lookStick").boundingBox();
  const points = [
    { x: move.x + move.width / 2, y: move.y + move.height / 2, id: 1 },
    { x: look.x + look.width / 2, y: look.y + look.height / 2, id: 2 },
  ];
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: points,
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: points.map((p) => ({ ...p, x: p.x + 20, y: p.y - 15 })),
  });
  assert.notEqual(
    await page.locator("#moveStick span").evaluate((e) => e.style.transform),
    "",
  );
  assert.notEqual(
    await page.locator("#lookStick span").evaluate((e) => e.style.transform),
    "",
  );
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  assert.equal(
    await page.locator("#moveStick span").evaluate((e) => e.style.transform),
    "",
  );
  await page.locator('[data-action="interact"]').tap();
  await page.waitForFunction(() =>
    document.querySelector("#weaponHud").textContent.includes("PISTOLET"),
  );
  await page.locator('[data-hold="fire"]').tap();
  await page.waitForFunction(() =>
    document.querySelector("#weaponHud").textContent.includes("11 / 120"),
  );
  await page.locator('[data-action="switchWeapon"]').tap();
  await page.waitForFunction(() =>
    document.querySelector("#weaponHud").textContent.includes("CARABINE"),
  );
  await page.locator('[data-action="reload"]').tap();
  await page.locator("#pause").tap();
  assert.equal(await page.locator("#pauseScreen").isVisible(), true);
  await page.locator("#resume").tap();
  await page.evaluate(() => {
    const buttons = Array(17).fill(0);
    buttons[7] = 1;
    window.dispatchEvent(
      new CustomEvent("pacific-native-gamepad", {
        detail: { connected: true, id: 7, axes: [0, 0, 0, 0], buttons },
      }),
    );
  });
  await page.waitForFunction(() =>
    document
      .querySelector("#padStatus")
      .textContent.includes("● MANETTE CONNECTÉE"),
  );
  await page.waitForFunction(
    () =>
      !document.querySelector("#weaponHud").textContent.includes("30 / 180"),
  );
  await page.evaluate(() =>
    window.dispatchEvent(
      new CustomEvent("pacific-native-gamepad", {
        detail: { connected: false },
      }),
    ),
  );
  await page.waitForFunction(() =>
    document.querySelector("#padStatus").textContent.includes("○ TACTILE"),
  );
  await page.screenshot({ path: "release/tablet-smoke.png", timeout: 90000 });
  assert.deepEqual(errors, []);
  console.log("Tablet multi-touch, fire, weapon and pause passed.");
} catch (e) {
  console.error(
    "::error::" +
      [e.stack, ...errors]
        .join("\n")
        .replace(/%/g, "%25")
        .replace(/\n/g, "%0A"),
  );
  throw e;
} finally {
  await browser.close();
}
