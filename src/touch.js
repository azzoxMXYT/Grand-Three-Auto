export function stickVector(dx, dy, radius = 44) {
  const length = Math.hypot(dx, dy);
  const factor = length > radius ? radius / length : 1;
  return { x: (dx * factor) / radius, y: (dy * factor) / radius };
}
export function createTouchInput(actions) {
  const panel = document.createElement("section");
  panel.id = "tabletControls";
  panel.setAttribute("aria-label", "Commandes tactiles");
  panel.innerHTML = `<div class="virtual-stick" id="moveStick" aria-label="Déplacement"><span></span><small>BOUGER / CONDUIRE</small></div><div class="virtual-stick" id="lookStick" aria-label="Visée"><span></span><small>CAMÉRA / VISÉE</small></div><div class="tablet-actions"><button data-action="interact">VÉHICULE</button><button data-action="reload">RECHARGER</button><button data-action="switchWeapon">ARME</button><button data-action="camera">VUE</button><button data-hold="aim">VISER</button><button data-hold="fire">TIRER</button><button data-hold="sprint">COURIR / FREIN</button><button data-action="fullscreen">PLEIN ÉCRAN</button></div><div class="rotate-tip">Tournez la tablette en paysage pour jouer confortablement.</div>`;
  document.body.appendChild(panel);
  const state = {
    x: 0,
    y: 0,
    lookX: 0,
    lookY: 0,
    fire: false,
    aim: false,
    sprint: false,
  };
  let queuedFire = false;
  const resets = [];
  for (const [id, x, y] of [
    ["moveStick", "x", "y"],
    ["lookStick", "lookX", "lookY"],
  ]) {
    const element = panel.querySelector("#" + id),
      thumb = element.querySelector("span");
    let pointer = null;
    const move = (e) => {
      if (e.pointerId !== pointer) return;
      const r = element.getBoundingClientRect();
      const v = stickVector(
        e.clientX - r.left - r.width / 2,
        e.clientY - r.top - r.height / 2,
      );
      state[x] = v.x;
      state[y] = v.y;
      thumb.style.transform = `translate(${v.x * 44}px,${v.y * 44}px)`;
    };
    element.onpointerdown = (e) => {
      if (pointer !== null) return;
      e.preventDefault();
      pointer = e.pointerId;
      element.setPointerCapture(e.pointerId);
      move(e);
    };
    element.onpointermove = move;
    const reset = () => {
      pointer = null;
      state[x] = state[y] = 0;
      thumb.style.transform = "";
    };
    resets.push(reset);
    element.onpointerup =
      element.onpointercancel =
      element.onlostpointercapture =
        (e) => {
          if (e.pointerId === pointer) reset();
        };
  }
  panel.querySelectorAll("[data-action]").forEach(
    (b) =>
      (b.onclick = async () => {
        if (b.dataset.action === "fullscreen") {
          try {
            if (!document.fullscreenElement)
              await document.documentElement.requestFullscreen();
            else await document.exitFullscreen();
          } catch {
            /* Android app is already fullscreen-capable; browser may deny this. */
          }
          return;
        }
        actions[b.dataset.action]();
      }),
  );
  panel.querySelectorAll("[data-hold]").forEach((b) => {
    const key = b.dataset.hold;
    const pointers = new Set();
    b.onpointerdown = (e) => {
      e.preventDefault();
      pointers.add(e.pointerId);
      b.setPointerCapture(e.pointerId);
      state[key] = true;
      if (key === "fire") queuedFire = true;
    };
    b.onpointerup =
      b.onpointercancel =
      b.onlostpointercapture =
        (e) => {
          pointers.delete(e.pointerId);
          state[key] = pointers.size > 0;
        };
    resets.push(() => {
      pointers.clear();
      state[key] = false;
    });
  });
  function reset() {
    resets.forEach((fn) => fn());
    queuedFire = false;
  }
  window.addEventListener("blur", reset);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) reset();
  });
  return (enabled) => {
    if (!enabled) {
      reset();
      return {};
    }
    const result = {
      ...state,
      gas: Math.max(0, -state.y),
      reverse: Math.max(0, state.y),
      brake: state.sprint,
      fire: state.fire || queuedFire,
    };
    queuedFire = false;
    return result;
  };
}
export function combineInput(pad, touch) {
  const result = { ...pad };
  for (const [key, value] of Object.entries(touch))
    result[key] =
      typeof value === "number"
        ? Math.abs(value) > Math.abs(result[key] || 0)
          ? value
          : result[key] || 0
        : Boolean(result[key] || value);
  return result;
}
