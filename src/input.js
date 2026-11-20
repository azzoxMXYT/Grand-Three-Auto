export function deadzone(value = 0, threshold = 0.18) {
  return Math.abs(value) <= threshold
    ? 0
    : (Math.sign(value) * (Math.abs(value) - threshold)) / (1 - threshold);
}
export function nativeGamepad(detail) {
  if (
    !detail?.connected ||
    !Array.isArray(detail.axes) ||
    !Array.isArray(detail.buttons)
  )
    return null;
  const clamp = (value, min, max) =>
    Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : 0;
  return {
    mapping: "standard",
    index: `android-${detail.id}`,
    axes: Array.from({ length: 4 }, (_, i) => clamp(detail.axes[i], -1, 1)),
    buttons: Array.from({ length: 17 }, (_, i) => {
      const value = clamp(detail.buttons[i], 0, 1);
      return { value, pressed: value > 0.15 };
    }),
  };
}
export function createGamepadInput(actions) {
  let previous = [],
    connected = null;
  const status = document.querySelector("#padStatus");
  let native = null,
    activeId = null;
  globalThis.addEventListener?.("pacific-native-gamepad", (event) => {
    native = nativeGamepad(event.detail);
  });
  globalThis.addEventListener?.("blur", () => {
    native = null;
    previous = [];
  });
  return function poll(enabled) {
    const pad =
      native ||
      Array.from(navigator.getGamepads?.() || []).find(
        (p) => p?.mapping === "standard",
      );
    if (Boolean(pad) !== connected) {
      connected = Boolean(pad);
      status.textContent = connected
        ? "● MANETTE CONNECTÉE"
        : globalThis.matchMedia?.("(pointer:coarse)").matches
          ? "○ TACTILE · MANETTE : APPUYEZ SUR UN BOUTON"
          : "○ CLAVIER / SOURIS";
    }
    if (!pad) {
      previous = [];
      return {};
    }
    const id = pad.index ?? 0;
    if (id !== activeId) {
      previous = [];
      activeId = id;
    }
    const buttons = pad.buttons.map((b) => b.pressed);
    const press = (i) => buttons[i] && !previous[i];
    if (document.hasFocus()) {
      if (press(9)) actions.pause();
      if (enabled) {
        if (press(3)) actions.interact();
        if (press(2)) actions.reload();
        if (press(5)) actions.switchWeapon();
        if (press(8)) actions.camera();
      }
    }
    previous = buttons;
    if (!enabled || !document.hasFocus()) return {};
    return {
      x: deadzone(pad.axes[0]),
      y: deadzone(pad.axes[1]),
      lookX: deadzone(pad.axes[2]),
      lookY: deadzone(pad.axes[3]),
      gas: pad.buttons[7]?.value || 0,
      reverse: pad.buttons[6]?.value || 0,
      fire: buttons[7],
      aim: buttons[6],
      brake: buttons[0],
      sprint: buttons[0],
    };
  };
}
