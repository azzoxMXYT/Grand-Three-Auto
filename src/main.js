import { createTouchInput, combineInput } from "./touch.js";
import { frameInterval } from "./quality.js";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import "./style.css";
import { createGamepadInput } from "./input.js";
import { createCombat } from "./combat.js";
import {
  setupGraphics,
  addCityDetails,
  optimizeStaticScene,
} from "./graphics.js";
const scene = new THREE.Scene();
scene.background = new THREE.Color("#accacd");
scene.fog = new THREE.Fog("#accacd", 100, 360);
const renderer = new THREE.WebGLRenderer({
  antialias: false,
  powerPreference: "low-power",
});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 0.85));
renderer.shadowMap.enabled = false;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
document.querySelector("#game").appendChild(renderer.domElement);
const camera = new THREE.PerspectiveCamera(
  53,
  innerWidth / innerHeight,
  0.1,
  650,
);
scene.add(new THREE.HemisphereLight("#e9f6ff", "#77765b", 2.5));
const sun = new THREE.DirectionalLight("#fff0c9", 3.3);
sun.position.set(-80, 130, 65);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, {
  left: -120,
  right: 120,
  top: 120,
  bottom: -120,
});
sun.shadow.bias = -0.0005;
scene.add(sun);
scene.add(sun.target);
const graphics = setupGraphics(scene, renderer, sun);
const materials = {};
function mat(c) {
  return (materials[c] ??= graphics.material(c));
}
function box(w, h, d, c, x = 0, y = 0, z = 0, parent = scene) {
  const o = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    typeof c === "string" ? mat(c) : c,
  );
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  parent.add(o);
  return o;
}
function cylinder(rt, rb, h, c, x, y, z, parent = scene, n = 8) {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, n), mat(c));
  o.position.set(x, y, z);
  o.castShadow = true;
  parent.add(o);
  return o;
}
box(1400, 1, 1400, "#9dba9b", 0, -0.65, 0);
box(400, 0.2, 1500, "#5eaaad", -410, -0.12, 0);
box(30, 0.3, 1500, "#d9c99e", -196, 0, 0);
const roads = [-160, -80, 0, 80, 160],
  buildings = [];
for (const x of roads) {
  box(20, 0.15, 420, "#586367", x, 0.02, 0);
  box(24, 0.1, 420, "#c8c8b4", x, -0.02, 0);
  for (let z = -205; z < 210; z += 10)
    box(0.18, 0.02, 4, "#e6d7a4", x, 0.11, z);
}
for (const z of roads) {
  box(420, 0.16, 20, "#586367", 0, 0.04, z);
  box(420, 0.1, 24, "#c8c8b4", 0, 0, z);
  for (let x = -205; x < 210; x += 10)
    if (!roads.some((r) => Math.abs(r - x) < 12))
      box(4, 0.02, 0.18, "#e6d7a4", x, 0.14, z);
}
for (const x of roads)
  for (const z of roads) {
    box(20, 0.02, 20, "#586367", x, 0.14, z);
    for (let i = -4; i <= 4; i++) {
      box(1, 0.025, 4, "#d8ddd0", x + i * 1.8, 0.16, z + 13);
      box(4, 0.025, 1, "#d8ddd0", x + 13, 0.16, z + i * 1.8);
    }
  }
let seed = 73;
function rand() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}
const palette = [
  "#ded5b8",
  "#c3c9bc",
  "#bac9c6",
  "#ddc6ae",
  "#b2bec0",
  "#eee4ce",
];
for (let gx = -2; gx < 2; gx++)
  for (let gz = -2; gz < 2; gz++)
    for (let ix = 0; ix < 2; ix++)
      for (let iz = 0; iz < 2; iz++) {
        const x = gx * 80 + 25 + ix * 30,
          z = gz * 80 + 25 + iz * 30,
          w = 21 + rand() * 6,
          d = 20 + rand() * 6,
          h = 9 + rand() * 45;
        box(w + 4, 0.45, d + 4, "#c5c7b4", x, 0.2, z);
        box(w, h, d, palette[Math.floor(rand() * palette.length)], x, h / 2, z);
        buildings.push({ x, z, w: w / 2 + 1.7, d: d / 2 + 1.7 });
        box(w + 0.7, 0.65, d + 0.7, "#eee6d0", x, h, z);
        box(w * 0.5, 1.5, d * 0.4, "#9caaa5", x, h + 1, z);
        for (let floor = 3; floor < h - 1; floor += 3.4) {
          for (let off = -w / 2 + 2; off < w / 2 - 1; off += 3.7) {
            box(1.8, 1.8, 0.08, "#668b92", x + off, floor, z + d / 2 + 0.05);
            box(1.8, 1.8, 0.08, "#6b9299", x + off, floor, z - d / 2 - 0.05);
          }
          for (let off = -d / 2 + 2; off < d / 2 - 1; off += 3.7)
            box(0.08, 1.8, 1.8, "#64878c", x + w / 2 + 0.05, floor, z + off);
        }
        if (rand() > 0.5) {
          box(w + 1, 0.4, 3, "#769e8c", x, 3, z + d / 2 + 1);
          box(w * 0.7, 1.2, 0.12, "#354d4c", x, 2, z + d / 2 + 0.12);
        }
      }
addCityDetails({ scene, box, buildings });
const leafMaterials = ["#63894e", "#527d59"].map(
  (color) =>
    new THREE.MeshStandardMaterial({
      color,
      side: THREE.DoubleSide,
      roughness: 0.9,
    }),
);
function palm(x, z) {
  const h = 7 + rand() * 4;
  const trunk = cylinder(0.17, 0.35, h, "#a08a65", x, h / 2, z);
  trunk.rotation.z = 0.07;
  const g = new THREE.Group();
  g.position.set(x + 0.25, h, z);
  scene.add(g);
  for (let i = 0; i < 7; i++) {
    let a = (i * Math.PI * 2) / 7;
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.8, 1.2, 0, 4.8);
    shape.quadraticCurveTo(-0.65, 1.3, 0, 0);
    const leaf = new THREE.Mesh(
      new THREE.ShapeGeometry(shape, 8),
      leafMaterials[i % 2],
    );
    leaf.rotation.set(-Math.PI / 2 + 0.22, a, 0);
    leaf.rotation.z = a;
    leaf.castShadow = true;
    g.add(leaf);
  }
  cylinder(0.8, 0.3, 1, "#617b48", x + 0.25, h - 0.2, z);
}
for (let z = -190; z < 210; z += 17) palm(-177, z);
for (const r of roads)
  for (let p = -190; p < 200; p += 31)
    if (!roads.some((v) => Math.abs(v - p) < 17)) {
      palm(r + 14, p);
      cylinder(0.09, 0.13, 7, "#4b5a53", r - 13, 3.5, p);
      box(2, 0.18, 0.5, "#e4dfbb", r - 12.2, 7, p);
    }
// Coastal hills beyond the city.
for (let i = 0; i < 20; i++) {
  const mountain = new THREE.Mesh(
    new THREE.ConeGeometry(35 + rand() * 50, 40 + rand() * 75, 5),
    mat("#96aaa0"),
  );
  mountain.position.set(-230 + i * 30, 15, -280 - rand() * 65);
  scene.add(mountain);
}
optimizeStaticScene(scene, mergeGeometries);
function car(color) {
  const g = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.45,
    roughness: 0.25,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
  });
  box(2.15, 0.58, 4.45, paint, 0, 0.7, 0, g);
  box(2.18, 0.22, 4.1, paint, 0, 0.48, 0.06, g);
  box(1.85, 0.6, 2.15, "#263e44", 0, 1.23, -0.17, g);
  box(1.87, 0.15, 1.65, paint, 0, 1.58, -0.28, g);
  const glass = box(1.74, 0.58, 0.08, "#8ab5bd", 0, 1.22, 1, g);
  glass.rotation.x = -0.35;
  box(1.72, 0.48, 0.08, "#668f9c", 0, 1.22, -1.25, g);
  box(0.08, 0.18, 2.1, color, 0, 1.47, -0.1, g);
  for (const x of [-1.06, 1.06])
    for (const z of [-1.4, 1.35]) {
      let wheel = cylinder(0.42, 0.42, 0.24, "#222d30", x, 0.44, z, g, 12);
      wheel.rotation.z = Math.PI / 2;
      let hub = cylinder(0.23, 0.23, 0.255, "#99a4a1", x, 0.44, z, g, 10);
      hub.rotation.z = Math.PI / 2;
    }
  for (const x of [-0.73, 0.73]) {
    box(0.55, 0.18, 0.08, "#ffedb9", x, 0.76, 2.25, g);
    box(0.55, 0.15, 0.08, "#b74637", x, 0.78, -2.25, g);
  }
  box(1.9, 0.12, 0.15, "#344548", 0, 0.4, -2.23, g);
  box(0.6, 0.2, 0.04, "#e6e3cf", 0, 0.55, -2.32, g);
  optimizeStaticScene(g, mergeGeometries);
  scene.add(g);
  return g;
}
const playerCar = car("#c9d99c");
playerCar.position.set(3, 0, 24);
let angle = Math.PI,
  velocity = 0,
  driving = true,
  camMode = 0,
  paused = false;
playerCar.rotation.y = angle;
const person = new THREE.Group();
box(0.55, 0.8, 0.3, "#eee4d3", 0, 1.15, 0, person);
box(0.42, 0.44, 0.4, "#a77d60", 0, 1.79, 0, person);
for (const x of [-0.17, 0.17])
  box(0.22, 0.75, 0.24, "#344b58", x, 0.4, 0, person);
for (const x of [-0.4, 0.4]) box(0.18, 0.7, 0.2, "#a77d60", x, 1.1, 0, person);
person.visible = false;
scene.add(person);
const traffic = [];
for (let i = 0; i < 9; i++) {
  const c = car(["#e1c7ab", "#647f85", "#c08063", "#dde0d0", "#738e77"][i % 5]);
  const vertical = i % 2 === 0,
    lane = roads[Math.floor(rand() * 5)] + (i % 3 === 0 ? -4 : 4);
  c.position.set(
    vertical ? lane : -190 + rand() * 380,
    0,
    vertical ? -190 + rand() * 380 : lane,
  );
  c.rotation.y = vertical ? 0 : Math.PI / 2;
  traffic.push({ c, vertical, lane, speed: 5 + rand() * 6 });
}
const targets = [
  new THREE.Vector3(4, 0, -112),
  new THREE.Vector3(151, 0, -76),
  new THREE.Vector3(-155, 0, 76),
];
let stage = 0,
  cash = 8450,
  route = true;
const beacon = new THREE.Group();
scene.add(beacon);
const ring = new THREE.Mesh(
  new THREE.TorusGeometry(3, 0.12, 8, 40),
  new THREE.MeshBasicMaterial({ color: "#e3ed8c" }),
);
ring.rotation.x = -Math.PI / 2;
ring.position.y = 0.2;
beacon.add(ring);
const beam = new THREE.Mesh(
  new THREE.CylinderGeometry(0.4, 3, 24, 24, 1, true),
  new THREE.MeshBasicMaterial({
    color: "#e6ee92",
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
    depthWrite: false,
  }),
);
beam.position.y = 12;
beacon.add(beam);
const diamond = new THREE.Mesh(
  new THREE.OctahedronGeometry(0.8),
  new THREE.MeshBasicMaterial({ color: "#e8ee9d" }),
);
diamond.position.y = 6;
beacon.add(diamond);
const keys = {};
let toastTimer;
function toast(t) {
  document.querySelector("#toast").textContent = t;
  document.querySelector("#toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(
    () => document.querySelector("#toast").classList.remove("show"),
    3300,
  );
}
function pause() {
  paused = !paused;
  document.querySelector("#pauseScreen").classList.toggle("hidden", !paused);
}
function interact() {
  if (paused) return;
  if (driving) {
    driving = false;
    viewYaw = angle;
    velocity = 0;
    person.position.copy(playerCar.position).add(new THREE.Vector3(3, 0, 0));
    person.visible = true;
    toast("À pied · E pour remonter dans votre voiture");
  } else if (person.position.distanceTo(playerCar.position) < 6) {
    driving = true;
    person.visible = false;
    toast("Vapor GT · Bonne route !");
  } else toast("Approchez-vous de votre véhicule");
  document.querySelector("#interactText").textContent = driving
    ? "Sortir du véhicule"
    : "Entrer dans le véhicule";
  document.querySelector("#vehicleLabel").textContent = driving
    ? "VAPOR GT"
    : "À PIED";
}
window.addEventListener("keydown", (e) => {
  if (
    ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
      e.code,
    )
  )
    e.preventDefault();
  keys[e.key.toLowerCase()] = true;
  if (e.repeat) return;
  if (e.key.toLowerCase() === "e") interact();
  if (e.key.toLowerCase() === "c") camMode = (camMode + 1) % 3;
  if (e.key === "Escape") pause();
  if (e.key.toLowerCase() === "f") combat.switchWeapon();
  if (e.key.toLowerCase() === "r" && !driving) combat.reload();
  if (e.key.toLowerCase() === "r" && driving) {
    playerCar.position.set(3, 0, 24);
    angle = Math.PI;
    velocity = 0;
    toast("Véhicule replacé à Downtown");
  }
});
window.addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));
window.addEventListener("blur", () => {
  Object.keys(keys).forEach((k) => (keys[k] = false));
  if (!paused) pause();
});
document.querySelector("#pause").onclick = pause;
document.querySelector("#resume").onclick = pause;
document.querySelector("#reset").onclick = () => location.reload();
document.querySelector("#missionBtn").onclick = () => {
  route = !route;
  document.querySelector("#missionBtn").innerHTML = route
    ? "ITINÉRAIRE ACTIVÉ <span>↗</span>"
    : "AFFICHER L’ITINÉRAIRE <span>↗</span>";
  toast(route ? "Itinéraire affiché sur la carte" : "Itinéraire masqué");
};
const map = document.querySelector("#map").getContext("2d");
function drawMap(pos) {
  map.fillStyle = "#203d3c";
  map.fillRect(0, 0, 230, 166);
  const s = 0.69;
  const mx = (x) => 115 + (x - pos.x) * s,
    mz = (z) => 83 + (z - pos.z) * s;
  map.fillStyle = "#497273";
  map.fillRect(mx(-700), 0, Math.max(0, mx(-205)), 166);
  for (const b of buildings) {
    map.fillStyle = "#3a5250";
    map.fillRect(mx(b.x - b.w), mz(b.z - b.d), b.w * 2 * s, b.d * 2 * s);
  }
  map.lineWidth = 9;
  map.strokeStyle = "#6a7970";
  for (const r of roads) {
    map.beginPath();
    map.moveTo(mx(r), 0);
    map.lineTo(mx(r), 166);
    map.stroke();
    map.beginPath();
    map.moveTo(0, mz(r));
    map.lineTo(230, mz(r));
    map.stroke();
  }
  const t = targets[stage % 3];
  if (route) {
    map.strokeStyle = "#dfe995";
    map.lineWidth = 2.5;
    map.setLineDash([4, 3]);
    map.beginPath();
    map.moveTo(115, 83);
    map.lineTo(mx(t.x), 83);
    map.lineTo(mx(t.x), mz(t.z));
    map.stroke();
    map.setLineDash([]);
  }
  map.fillStyle = "#eaf49c";
  map.beginPath();
  map.arc(
    Math.max(8, Math.min(222, mx(t.x))),
    Math.max(8, Math.min(158, mz(t.z))),
    4,
    0,
    7,
  );
  map.fill();
  map.save();
  map.translate(115, 83);
  map.rotate(-angle);
  map.fillStyle = "#fff";
  map.beginPath();
  map.moveTo(0, 8);
  map.lineTo(-5, -6);
  map.lineTo(0, -3);
  map.lineTo(5, -6);
  map.closePath();
  map.fill();
  map.restore();
}
let viewYaw = Math.PI,
  viewPitch = 0.1;
const combat = createCombat({
  scene,
  person,
  camera,
  canvas: renderer.domElement,
  box,
  toast,
  isActive: () => !paused && !driving,
  reward: (amount) => {
    cash += amount;
    document.querySelector("#money").innerHTML =
      cash.toLocaleString("fr-FR") + " <span>$</span>";
  },
});
const pollPad = createGamepadInput({
  pause,
  interact,
  reload: combat.reload,
  switchWeapon: combat.switchWeapon,
  camera: () => (camMode = (camMode + 1) % 3),
});
const pollTouch = createTouchInput({
  interact,
  reload: combat.reload,
  switchWeapon: combat.switchWeapon,
  camera: () => (camMode = (camMode + 1) % 3),
});
renderer.domElement.addEventListener("pointermove", (e) => {
  if (!paused && !driving && e.buttons & 2) {
    viewYaw -= e.movementX * 0.006;
    viewPitch = THREE.MathUtils.clamp(
      viewPitch + e.movementY * 0.004,
      -0.5,
      0.8,
    );
  }
});
const clock = new THREE.Clock(),
  desired = new THREE.Vector3(),
  look = new THREE.Vector3();
camera.position.set(26, 13, 2);
function blocked(x, z) {
  return (
    Math.abs(x) > 204 ||
    Math.abs(z) > 204 ||
    buildings.some((b) => Math.abs(x - b.x) < b.w && Math.abs(z - b.z) < b.d)
  );
}
let lastFrame = 0;
function frame(now = performance.now()) {
  requestAnimationFrame(frame);
  const interval = frameInterval(graphics.high, paused);
  if (now - lastFrame < interval - 1) return;
  lastFrame = now - ((now - lastFrame) % interval);
  const dt = Math.min(clock.getDelta(), 0.05);
  const pad = combineInput(pollPad(!paused), pollTouch(!paused));
  if (!paused) {
    graphics.update(dt);
    const up = keys.z || keys.w || keys.arrowup,
      down = keys.s || keys.arrowdown,
      left = keys.q || keys.a || keys.arrowleft,
      right = keys.d || keys.arrowright;
    if (driving) {
      velocity +=
        ((up ? 19 : down ? -14 : 0) +
          (pad.gas || 0) * 19 -
          (pad.reverse || 0) * 14) *
        dt;
      velocity *= Math.pow(keys[" "] || pad.brake ? 0.07 : 0.982, dt * 60);
      velocity = THREE.MathUtils.clamp(velocity, -12, 46);
      if (Math.abs(velocity) > 0.2)
        angle +=
          ((left ? 1 : 0) - (right ? 1 : 0) - (pad.x || 0)) *
          dt *
          1.7 *
          Math.min(Math.abs(velocity) / 8, 1) *
          Math.sign(velocity);
      const nx = playerCar.position.x + Math.sin(angle) * velocity * dt,
        nz = playerCar.position.z + Math.cos(angle) * velocity * dt;
      if (!blocked(nx, nz)) {
        playerCar.position.set(nx, 0, nz);
      } else {
        velocity *= -0.3;
      }
      playerCar.rotation.y = angle;
      for (const { c } of traffic)
        if (
          c.position.distanceTo(playerCar.position) < 3.1 &&
          Math.abs(velocity) > 4
        ) {
          velocity *= -0.4;
          toast("Attention à la circulation !");
        }
    } else {
      viewYaw -= (pad.lookX || 0) * dt * 2.4;
      viewPitch = THREE.MathUtils.clamp(
        viewPitch + (pad.lookY || 0) * dt * 1.6,
        -0.5,
        0.8,
      );
      const x = (right ? 1 : 0) - (left ? 1 : 0) + (pad.x || 0),
        y = (down ? 1 : 0) - (up ? 1 : 0) + (pad.y || 0);
      const v = new THREE.Vector3(
        -Math.cos(viewYaw) * x - Math.sin(viewYaw) * y,
        0,
        Math.sin(viewYaw) * x - Math.cos(viewYaw) * y,
      );
      if (v.length() > 1) v.normalize();
      v.multiplyScalar(dt * (keys.shift || pad.sprint ? 9 : 5));
      if (!blocked(person.position.x + v.x, person.position.z + v.z))
        person.position.add(v);
      person.rotation.y = viewYaw;
    }
    const aiming = combat.update(dt, pad, !driving);
    for (const t of traffic) {
      t.c.position[t.vertical ? "z" : "x"] += t.speed * dt;
      if (t.c.position[t.vertical ? "z" : "x"] > 205)
        t.c.position[t.vertical ? "z" : "x"] = -205;
    }
    diamond.rotation.y += dt;
    ring.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2) * 0.05);
    const pos = driving ? playerCar.position : person.position,
      target = targets[stage % 3];
    beacon.position.copy(target);
    const distance = pos.distanceTo(target);
    document.querySelector("#distance").textContent = Math.round(distance);
    if (distance < 7) {
      cash += 2500;
      stage++;
      document.querySelector("#money").innerHTML =
        cash.toLocaleString("fr-FR") + " <span>$</span>";
      document.querySelector("#missionTitle").textContent = [
        "Un nouveau départ",
        "Le long de la côte",
        "La grande traversée",
      ][stage % 3];
      document.querySelector("#missionText").textContent = [
        "Rejoignez le point de rendez-vous sur Ocean Boulevard.",
        "Votre prochain contact vous attend à Eastside.",
        "Retrouvez le point de livraison près de la côte.",
      ][stage % 3];
      toast(
        "Rendez-vous atteint ! + 2 500 $ · Prochaine destination débloquée",
      );
    }
    const a = driving ? angle : viewYaw;
    const offsets =
      camMode === 0 ? [8, 5.7, -12] : camMode === 1 ? [0, 8, -18] : [0, 34, -4];
    desired.set(
      pos.x + Math.sin(a) * offsets[2] + Math.cos(a) * offsets[0],
      pos.y + offsets[1],
      pos.z + Math.cos(a) * offsets[2] - Math.sin(a) * offsets[0],
    );
    if (!driving) {
      const back = aiming ? 3.5 : 6;
      desired.set(
        pos.x - Math.sin(a) * back + Math.cos(a) * 0.55,
        2.7 + viewPitch * 3,
        pos.z - Math.cos(a) * back - Math.sin(a) * 0.55,
      );
    }
    camera.position.lerp(desired, 1 - Math.exp(-dt * (driving ? 3 : 12)));
    look.copy(pos).add(new THREE.Vector3(0, 1.5, 0));
    if (!driving)
      look.set(
        camera.position.x + Math.sin(a) * 30,
        camera.position.y - viewPitch * 25 - 2,
        camera.position.z + Math.cos(a) * 30,
      );
    camera.lookAt(look);
    sun.position.set(pos.x - 80, 130, pos.z + 65);
    sun.target.position.copy(pos);
    sun.target.updateMatrixWorld();
    document.querySelector("#speed").textContent = String(
      Math.round(Math.abs(driving ? velocity * 3.6 : 0)),
    ).padStart(3, "0");
    document.querySelector("#gear").textContent =
      velocity < -1
        ? "R"
        : Math.abs(velocity) < 1
          ? "N"
          : String(Math.min(6, Math.floor(velocity / 9) + 1));
    drawMap(pos);
    const screen = target
      .clone()
      .add(new THREE.Vector3(0, 8, 0))
      .project(camera);
    const label = document.querySelector("#worldLabel");
    label.style.display =
      screen.z < 1 && Math.abs(screen.x) < 0.8 && Math.abs(screen.y) < 0.8
        ? "block"
        : "none";
    label.style.left = (screen.x * 0.5 + 0.5) * innerWidth + "px";
    label.style.top = (-screen.y * 0.5 + 0.5) * innerHeight + "px";
  }
  renderer.render(scene, camera);
}
frame();
window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  graphics.resize();
});
setTimeout(
  () => toast("ZQSD pour conduire · E pour sortir · C pour changer de vue"),
  1500,
);
