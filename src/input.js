export function deadzone(value = 0, threshold = 0.18) {
  return Math.abs(value) <= threshold
    ? 0
    : (Math.sign(value) * (Math.abs(value) - threshold)) / (1 - threshold);
}
export function createGamepadInput(actions) {
  let previous = [],
    connected = false;
  const status = document.querySelector("#padStatus");
  return function poll(enabled) {
    const pad = Array.from(navigator.getGamepads?.() || []).find(
      (p) => p?.mapping === "standard",
    );
    if (Boolean(pad) !== connected) {
      connected = Boolean(pad);
      status.textContent = connected
        ? "● MANETTE CONNECTÉE"
        : "○ CLAVIER / SOURIS";
    }
    if (!pad) {
      previous = [];
      return {};
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
