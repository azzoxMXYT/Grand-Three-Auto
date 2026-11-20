import test from "node:test";
import assert from "node:assert/strict";
import { stickVector, combineInput } from "./touch.js";
test("virtual stick clamps diagonal movement and returns neutral", () => {
  assert.deepEqual(stickVector(0, 0), { x: 0, y: 0 });
  const v = stickVector(100, -100);
  assert.ok(Math.abs(Math.hypot(v.x, v.y) - 1) < 1e-10);
  assert.ok(v.x > 0 && v.y < 0);
});
test("touch and physical gamepad coexist without amplifying input", () => {
  assert.deepEqual(
    combineInput({ x: 0.5, fire: false }, { x: -1, fire: true }),
    { x: -1, fire: true },
  );
  assert.equal(combineInput({ gas: 1 }, { gas: 0 }).gas, 1);
});
