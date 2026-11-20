import * as THREE from "three";
import { renderScale } from "./quality.js";
import { Sky } from "three/addons/objects/Sky.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

// All scenery is procedural. No remote textures or downloads at runtime.
export function setupGraphics(scene, renderer, sun) {
  let environment;
  function prepareEnvironment() {
    if (environment) return;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    environment = pmrem.fromScene(room, 0.04);
    room.dispose();
    pmrem.dispose();
  }
  renderer.toneMappingExposure = 0.95;
  scene.fog = new THREE.FogExp2("#b9cbd0", 0.0037);
  const sky = new Sky();
  sky.scale.setScalar(2000);
  scene.add(sky);
  sky.visible = false;
  Object.assign(sky.material.uniforms.turbidity, { value: 3 });
  sky.material.uniforms.rayleigh.value = 1.4;
  sky.material.uniforms.mieCoefficient.value = 0.004;
  sky.material.uniforms.mieDirectionalG.value = 0.8;
  sky.material.uniforms.sunPosition.value.set(-0.65, 0.38, 0.5);
  sun.color.set("#ffe0ab");
  sun.intensity = 2.7;
  sun.shadow.normalBias = 0.035;
  sun.shadow.radius = 3;
  const hemi = scene.children.find((o) => o.isHemisphereLight);
  if (hemi) hemi.intensity = 1.5;

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const data = ctx.createImageData(256, 256);
  let seed = 41;
  for (let i = 0; i < data.data.length; i += 4) {
    seed = (seed * 16807) % 2147483647;
    const value = 120 + (seed % 45);
    data.data.set([value, value, value, 255], i);
  }
  ctx.putImageData(data, 0, 0);
  const asphalt = new THREE.CanvasTexture(canvas);
  asphalt.wrapS = asphalt.wrapT = THREE.RepeatWrapping;
  asphalt.repeat.set(2, 12);
  asphalt.colorSpace = THREE.SRGBColorSpace;
  asphalt.anisotropy = Math.min(2, renderer.capabilities.getMaxAnisotropy());

  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(398, 1498),
    new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `varying vec3 world;void main(){vec4 p=modelMatrix*vec4(position,1.);world=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}`,
      fragmentShader: `uniform float time;varying vec3 world;void main(){float wave=sin(world.x*.65+world.z*.24+time)*sin(world.z*.81-time*.8);float small=pow(max(0.,sin(world.x*1.2+world.z*.8+time*.4)),24.);float shimmer=pow(max(0.,sin(world.x*.06+world.z*.025)),12.)*small;float coast=smoothstep(-235.,-210.,world.x);vec3 c=mix(vec3(.035,.28,.34),vec3(.19,.52,.52),coast);c+=wave*.025+shimmer*.22;gl_FragColor=vec4(c,1.);#include <tonemapping_fragment>\n#include <colorspace_fragment>}`,
    }),
  );
  // Three.js shader chunks must start on their own line.
  water.material.fragmentShader = water.material.fragmentShader.replace(
    ";#include",
    ";\n#include",
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(-410, 0.02, 0);
  scene.add(water);
  const settings = document.createElement("button");
  settings.id = "graphicsSettings";
  settings.title = "Mode ÉCO recommandé pour Intel intégré / 8 Go de RAM";
  document.body.appendChild(settings);
  const animatedWater = water.material;
  const simpleWater = new THREE.MeshBasicMaterial({ color: "#397e88" });
  let high = false;
  function resize() {
    renderer.setPixelRatio(
      renderScale(innerWidth, innerHeight, devicePixelRatio, high),
    );
    renderer.setSize(innerWidth, innerHeight);
  }
  function apply() {
    if (high) prepareEnvironment();
    scene.environment = high ? environment.texture : null;
    sky.visible = high;
    water.material = high ? animatedWater : simpleWater;
    renderer.shadowMap.enabled = high;
    scene.fog.density = high ? 0.0037 : 0.006;
    scene.traverse((o) => {
      if (o.isMesh && o.material) o.material.needsUpdate = true;
    });
    settings.textContent = high
      ? "GRAPHISMES : ÉLEVÉS · 60 IPS MAX"
      : "GRAPHISMES : ÉCO · 30 IPS MAX";
    settings.dataset.mode = high ? "high" : "eco";
    resize();
  }
  settings.onclick = () => {
    high = !high;
    apply();
  };
  apply();
  return {
    material(color) {
      const m = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
      if (color === "#586367") {
        m.map = asphalt;
        m.roughness = 0.93;
      }
      if (
        [
          "#668b92",
          "#6b9299",
          "#64878c",
          "#8ab5bd",
          "#668f9c",
          "#263e44",
        ].includes(color)
      ) {
        m.metalness = 0.55;
        m.roughness = 0.18;
        m.envMapIntensity = 1.4;
      }
      return m;
    },
    update(dt) {
      if (high) animatedWater.uniforms.time.value += dt;
    },
    resize,
    get high() {
      return high;
    },
  };
}

export function addCityDetails({ scene, box, buildings }) {
  // Signs face the avenue; their textures are included in GPU memory only.
  const labels = [
    "PALM HOTEL",
    "OCEAN CLUB",
    "PACIFIC MOTORS",
    "COAST CAFÉ",
    "SUNSET MARKET",
    "STUDIO 73",
  ];
  buildings.forEach((b, i) => {
    if (i % 5 !== 0) return;
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 96;
    const ctx = c.getContext("2d");
    ctx.fillStyle = i % 2 ? "#1d4446" : "#ad674a";
    ctx.fillRect(0, 0, 512, 96);
    ctx.strokeStyle = "#e5d9af";
    ctx.strokeRect(7, 7, 498, 82);
    ctx.fillStyle = "#fff1c9";
    ctx.textAlign = "center";
    ctx.font = "bold 34px sans-serif";
    ctx.fillText(labels[i % labels.length], 256, 61);
    const texture = new THREE.CanvasTexture(c);
    texture.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.MeshStandardMaterial({
      map: texture,
      emissive: "#e7d7ab",
      emissiveMap: texture,
      emissiveIntensity: 0.15,
    });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(b.w * 1.4, 2.2), m);
    sign.position.set(b.x, 4.5, b.z + b.d - 1.61);
    scene.add(sign);
  });
  for (let z = -185; z < 200; z += 23) {
    // Beach boardwalk benches and planters, outside the drivable road.
    box(1.2, 0.15, 3, "#a08059", -184, 0.8, z);
    box(0.15, 0.75, 3, "#a08059", -184.5, 1.1, z);
    for (const dz of [-1, 1])
      box(0.8, 0.7, 0.13, "#435953", -184, 0.35, z + dz);
    box(2, 0.7, 2, "#d4c8ab", -174, 0.35, z + 8);
    const shrub = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.1, 1),
      new THREE.MeshStandardMaterial({ color: "#65825b", roughness: 1 }),
    );
    shrub.position.set(-174, 1.2, z + 8);
    scene.add(shrub);
  }
}

// Collapse thousands of static window/road/foliage meshes into material batches.
// Vehicles, player, targets, sky and animated water remain independent.
export function optimizeStaticScene(scene, mergeGeometries) {
  scene.updateMatrixWorld(true);
  const groups = new Map();
  scene.traverse((object) => {
    if (!object.isMesh || !object.material.isMeshStandardMaterial) return;
    const list = groups.get(object.material) || [];
    list.push(object);
    groups.set(object.material, list);
  });
  for (const [material, objects] of groups) {
    if (objects.length < 2) continue;
    const geometries = objects.map((object) => {
      const geometry = object.geometry.index
        ? object.geometry.toNonIndexed()
        : object.geometry.clone();
      return geometry.applyMatrix4(object.matrixWorld);
    });
    const merged = mergeGeometries(geometries, false);
    geometries.forEach((g) => g.dispose());
    if (!merged) continue;
    const batch = new THREE.Mesh(merged, material);
    batch.castShadow = objects.some((o) => o.castShadow);
    batch.receiveShadow = true;
    objects.forEach((object) => {
      object.removeFromParent();
      object.geometry.dispose();
    });
    scene.add(batch);
  }
}
