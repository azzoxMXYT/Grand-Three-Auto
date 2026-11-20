import * as THREE from "three";
export function createCombat({
  scene,
  person,
  camera,
  canvas,
  box,
  toast,
  isActive,
  reward,
}) {
  const weapons = [
    { name: "PISTOLET", size: 12, rate: 0.26, damage: 1 },
    { name: "CARABINE", size: 30, rate: 0.1, damage: 1 },
  ];
  let selected = 0,
    ammo = 12,
    reserve = [120, 180],
    magazines = [12, 30],
    reloadTime = 0,
    cooldown = 0,
    queuedShot = false,
    mouseFire = false,
    mouseAim = false,
    hits = 0;
  const hud = document.querySelector("#weaponHud"),
    reticle = document.querySelector("#reticle");
  const gun = new THREE.Group();
  gun.position.set(0.35, 1.25, 0.5);
  person.add(gun);
  const barrel = box(0.13, 0.16, 0.65, "#293738", 0, 0, 0.1, gun);
  box(0.12, 0.27, 0.14, "#59645b", 0, -0.16, -0.1, gun);
  const flash = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.16),
    new THREE.MeshBasicMaterial({ color: "#fff2a0" }),
  );
  flash.position.z = 0.5;
  gun.add(flash);
  flash.visible = false;
  const targets = [];
  // Targets are on the open north/south avenue, close to the starting vehicle.
  for (const [x, z] of [
    [-7, 10],
    [-7, -2],
    [-7, -14],
    [8, -32],
  ]) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    scene.add(g);
    box(0.15, 1.4, 0.15, "#69766a", 0, 0.7, 0, g);
    const target = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.5, 0.3),
      new THREE.MeshStandardMaterial({ color: "#e7b96d" }),
    );
    target.position.y = 1.8;
    g.add(target);
    const bull = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.1, 8, 24),
      new THREE.MeshBasicMaterial({ color: "#9b4d36" }),
    );
    bull.position.set(0, 1.8, 0.17);
    g.add(bull);
    targets.push({ g, target, hp: 3, respawn: 0 });
  }
  const traces = [],
    ray = new THREE.Raycaster();
  function reload() {
    if (
      !isActive() ||
      reloadTime ||
      ammo === weapons[selected].size ||
      !reserve[selected]
    )
      return;
    reloadTime = 1.3;
  }
  function switchWeapon() {
    if (!isActive()) return;
    magazines[selected] = ammo;
    selected = 1 - selected;
    ammo = magazines[selected];
    reloadTime = 0;
    barrel.scale.z = selected ? 1.9 : 1;
    flash.position.z = selected ? 0.85 : 0.5;
  }
  canvas.addEventListener("pointerdown", (e) => {
    if (!isActive()) return;
    if (e.button === 0) {
      mouseFire = true;
      queuedShot = true;
    }
    if (e.button === 2) mouseAim = true;
  });
  window.addEventListener("pointerup", (e) => {
    if (e.button === 0) mouseFire = false;
    if (e.button === 2) mouseAim = false;
  });
  window.addEventListener("blur", () => {
    mouseFire = false;
    queuedShot = false;
    mouseAim = false;
  });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  function shoot() {
    if (cooldown || reloadTime) return;
    if (!ammo) {
      reload();
      return;
    }
    ammo--;
    cooldown = weapons[selected].rate;
    flash.visible = true;
    camera.updateMatrixWorld();
    scene.updateMatrixWorld(true);
    ray.setFromCamera(new THREE.Vector2(0, 0), camera);
    const excluded = new Set();
    person.traverse((o) => excluded.add(o));
    const meshes = [];
    scene.traverse((o) => {
      if (
        o.isMesh &&
        !excluded.has(o) &&
        o.material?.transparent !== true &&
        o.visible
      )
        meshes.push(o);
    });
    // Hidden targets must not intercept a shot while waiting to respawn.
    const visible = meshes.filter(
      (o) => !targets.some((t) => !t.g.visible && t.g.children.includes(o)),
    );
    const hit = ray.intersectObjects(visible, false)[0];
    const end = hit ? hit.point : ray.ray.at(180, new THREE.Vector3());
    const start = flash.getWorldPosition(new THREE.Vector3());
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([start, end]),
      new THREE.LineBasicMaterial({
        color: "#fff1ad",
        transparent: true,
        opacity: 0.9,
      }),
    );
    scene.add(line);
    traces.push({ line, life: 0.08 });
    const target = targets.find((t) => t.target === hit?.object && t.g.visible);
    if (target) {
      target.hp -= weapons[selected].damage;
      reticle.classList.add("hit");
      if (target.hp <= 0) {
        target.g.visible = false;
        target.respawn = 6;
        hits++;
        reward(150);
        toast("Cible détruite · + 150 $");
      }
    }
  }
  function update(dt, input, enabled) {
    hud.classList.toggle("hidden", !enabled);
    reticle.classList.toggle("hidden", !enabled);
    gun.visible = enabled;
    cooldown = Math.max(0, cooldown - dt);
    if (cooldown < weapons[selected].rate - 0.05) {
      flash.visible = false;
      reticle.classList.remove("hit");
    }
    if (reloadTime) {
      reloadTime = Math.max(0, reloadTime - dt);
      if (!reloadTime) {
        const count = Math.min(
          weapons[selected].size - ammo,
          reserve[selected],
        );
        ammo += count;
        reserve[selected] -= count;
      }
    }
    for (const t of targets)
      if (t.respawn) {
        t.respawn = Math.max(0, t.respawn - dt);
        if (!t.respawn) {
          t.hp = 3;
          t.g.visible = true;
        }
      }
    for (let i = traces.length - 1; i >= 0; i--) {
      const t = traces[i];
      t.life -= dt;
      if (t.life <= 0) {
        scene.remove(t.line);
        t.line.geometry.dispose();
        t.line.material.dispose();
        traces.splice(i, 1);
      }
    }
    if (enabled && (queuedShot || mouseFire || input.fire)) shoot();
    queuedShot = false;
    hud.textContent = `${weapons[selected].name}  ·  ${reloadTime ? "RECHARGEMENT…" : `${ammo} / ${reserve[selected]}`}  ·  CIBLES ${hits}`;
    return enabled && (mouseAim || input.aim);
  }
  return { update, reload, switchWeapon };
}
