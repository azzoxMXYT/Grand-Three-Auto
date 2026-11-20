import test from "node:test";
import assert from "node:assert/strict";
import { renderScale, frameInterval } from "./quality.js";
test("Eco caps the buffer at 720p even on high DPI and 4K monitors", () => {
  for (const [w, h, dpr] of [
    [1366, 768, 1],
    [1920, 1080, 2],
    [3840, 2160, 2],
    [800, 600, 1],
  ]) {
    const scale = renderScale(w, h, dpr);
    assert.ok(w * scale <= 1280 && h * scale <= 720);
    assert.ok(scale <= 0.85);
  }
});
test("frame budget and high quality cap are explicit", () => {
  assert.equal(frameInterval(false, false), 1000 / 30);
  assert.equal(frameInterval(true, false), 1000 / 60);
  assert.equal(frameInterval(true, true), 100);
  assert.equal(renderScale(1920, 1080, 2, true), 1.5);
});
