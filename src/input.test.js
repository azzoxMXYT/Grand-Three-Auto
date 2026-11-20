import test from "node:test";
import assert from "node:assert/strict";
import { deadzone, createGamepadInput } from "./input.js";
test("deadzone rejects stick drift and preserves full analog range", () => {
  for (const v of [0, 0.1, -0.17, 0.18]) assert.equal(deadzone(v), 0);
  assert.equal(deadzone(1), 1);
  assert.equal(deadzone(-1), -1);
  assert.ok(deadzone(0.5) > 0 && deadzone(0.5) < 0.5);
});
test("gamepad input handles edges, pause, analog values and disconnection", () => {
  let pad = {
    mapping: "standard",
    axes: [0.5, 0, 0, 0],
    buttons: Array.from({ length: 16 }, () => ({ pressed: false, value: 0 })),
  };
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { getGamepads: () => [null, pad] },
  });
  globalThis.document = {
    querySelector: () => ({ textContent: "" }),
    hasFocus: () => true,
  };
  const calls = [];
  const poll = createGamepadInput(
    Object.fromEntries(
      ["pause", "interact", "reload", "switchWeapon", "camera"].map((k) => [
        k,
        () => calls.push(k),
      ]),
    ),
  );
  pad.buttons[3].pressed = true;
  pad.buttons[7].value = 0.6;
  assert.equal(poll(true).gas, 0.6);
  poll(true);
  assert.deepEqual(calls, ["interact"]);
  pad.buttons[9].pressed = true;
  poll(false);
  assert.deepEqual(calls, ["interact", "pause"]);
  pad = null;
  assert.deepEqual(poll(true), {});
});
