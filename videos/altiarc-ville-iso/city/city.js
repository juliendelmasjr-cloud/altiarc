// Altiarc — La ville isométrique (Three.js, orthographic iso camera).
// Every visual state is a pure function of HyperFrames time `t` (hf-seek).
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const W = 1920;
const H = 1080;
const gsap = window.gsap;
const ease = (name) => gsap.parseEase(name);
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const prog = (t, a, b) => clamp01((t - a) / (b - a));
const lerp = (a, b, p) => a + (b - a) * p;
const smooth = (t, a, b) => {
  const p = prog(t, a, b);
  return p * p * (3 - 2 * p);
};
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let r = Math.imul(a ^ (a >>> 15), 1 | a);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261008);

// ── Brand palette (frame.md) ────────────────────────────────────────────────
const C = {
  bg: 0x0c0c0c,
  slab: 0x17171f,
  wall: 0x2b2b3a,
  wall2: 0x33334a,
  roof: 0x3b3b52,
  trim: 0x46465f,
  dark: 0x1c1c28,
  indigo: 0x818cf8,
  violet: 0xc084fc,
  gold: 0xc9a84c,
  rose: 0xf472b6,
  white: 0xf2f2f7,
};
const hdr = (hex, k) => new THREE.Color(hex).multiplyScalar(k);

// ── Renderer / composer ─────────────────────────────────────────────────────
const canvas = document.getElementById("city-canvas");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.setClearColor(C.bg, 1);
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const HALF_H = 12;
const HALF_W = (HALF_H * W) / H;
const camera = new THREE.OrthographicCamera(-HALF_W, HALF_W, HALF_H, -HALF_H, -300, 600);

const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, rt);
composer.setPixelRatio(1);
composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.62, 0.18, 0.7);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ── Lights ──────────────────────────────────────────────────────────────────
scene.add(new THREE.HemisphereLight(0x9aa0ff, 0x0c0c14, 0.75));
const key = new THREE.DirectionalLight(0xfff3e2, 2.6);
key.position.set(-11, 24, 15);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -20;
key.shadow.camera.right = 20;
key.shadow.camera.top = 20;
key.shadow.camera.bottom = -20;
key.shadow.camera.near = 1;
key.shadow.camera.far = 80;
key.shadow.bias = -0.0004;
key.shadow.normalBias = 0.03;
scene.add(key);
const rim = new THREE.DirectionalLight(C.indigo, 0.7);
rim.position.set(12, 9, -14);
scene.add(rim);

// ── Canvas textures (drawn once, deterministic) ─────────────────────────────
function canvasTex(size, draw, srgb = true) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  draw(g, size);
  const tex = new THREE.CanvasTexture(c);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
function rrect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
// Icon strokes in a 100×100 box.
function drawIcon(g, type) {
  g.lineCap = "round";
  g.lineJoin = "round";
  switch (type) {
    case "email":
      rrect(g, 14, 26, 72, 50, 7);
      g.stroke();
      g.beginPath();
      g.moveTo(18, 32);
      g.lineTo(50, 56);
      g.lineTo(82, 32);
      g.stroke();
      break;
    case "form":
      rrect(g, 24, 12, 52, 76, 6);
      g.stroke();
      g.strokeRect(33, 26, 9, 9);
      g.strokeRect(33, 46, 9, 9);
      g.strokeRect(33, 66, 9, 9);
      g.beginPath();
      [30, 50, 70].forEach((y) => {
        g.moveTo(49, y);
        g.lineTo(67, y);
      });
      g.stroke();
      break;
    case "invoice":
      g.beginPath();
      g.moveTo(24, 12);
      g.lineTo(64, 12);
      g.lineTo(76, 24);
      g.lineTo(76, 88);
      g.lineTo(24, 88);
      g.closePath();
      g.stroke();
      g.beginPath();
      g.arc(52, 54, 15, Math.PI * 0.25, Math.PI * 1.75);
      g.moveTo(34, 50);
      g.lineTo(56, 50);
      g.moveTo(34, 59);
      g.lineTo(56, 59);
      g.stroke();
      break;
    case "chat":
      rrect(g, 12, 18, 76, 52, 14);
      g.stroke();
      g.beginPath();
      g.moveTo(30, 70);
      g.lineTo(24, 86);
      g.lineTo(44, 70);
      g.stroke();
      g.beginPath();
      [34, 50, 66].forEach((x) => {
        g.moveTo(x + 3, 44);
        g.arc(x, 44, 3, 0, Math.PI * 2);
      });
      g.stroke();
      break;
    case "gear": {
      g.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        g.moveTo(50 + Math.cos(a) * 26, 50 + Math.sin(a) * 26);
        g.lineTo(50 + Math.cos(a) * 38, 50 + Math.sin(a) * 38);
      }
      g.stroke();
      g.beginPath();
      g.arc(50, 50, 26, 0, Math.PI * 2);
      g.stroke();
      g.beginPath();
      g.arc(50, 50, 10, 0, Math.PI * 2);
      g.stroke();
      break;
    }
    case "headset":
      g.beginPath();
      g.arc(50, 52, 30, Math.PI, 0);
      g.stroke();
      rrect(g, 14, 50, 14, 26, 5);
      g.stroke();
      rrect(g, 72, 50, 14, 26, 5);
      g.stroke();
      g.beginPath();
      g.moveTo(79, 76);
      g.quadraticCurveTo(76, 90, 56, 88);
      g.stroke();
      break;
    case "bag":
      rrect(g, 18, 34, 64, 54, 8);
      g.stroke();
      g.beginPath();
      g.moveTo(36, 44);
      g.lineTo(36, 30);
      g.quadraticCurveTo(50, 8, 64, 30);
      g.lineTo(64, 44);
      g.stroke();
      break;
    case "crate":
      g.beginPath();
      g.moveTo(50, 12);
      g.lineTo(84, 30);
      g.lineTo(84, 70);
      g.lineTo(50, 88);
      g.lineTo(16, 70);
      g.lineTo(16, 30);
      g.closePath();
      g.moveTo(16, 30);
      g.lineTo(50, 48);
      g.lineTo(84, 30);
      g.moveTo(50, 48);
      g.lineTo(50, 88);
      g.stroke();
      break;
    case "tower":
      rrect(g, 28, 12, 44, 76, 4);
      g.stroke();
      g.beginPath();
      [26, 40, 54, 68].forEach((y) => {
        g.moveTo(38, y);
        g.lineTo(44, y);
        g.moveTo(56, y);
        g.lineTo(62, y);
      });
      g.stroke();
      break;
  }
}
const iconTexCache = {};
function signTex(type) {
  if (iconTexCache["s" + type]) return iconTexCache["s" + type];
  const tex = canvasTex(256, (g, s) => {
    g.fillStyle = "#16161f";
    rrect(g, 6, 6, s - 12, s - 12, 46);
    g.fill();
    g.strokeStyle = "#818CF8";
    g.lineWidth = 10;
    rrect(g, 10, 10, s - 20, s - 20, 42);
    g.stroke();
    g.save();
    g.translate(48, 48);
    g.scale(1.6, 1.6);
    g.strokeStyle = "#ffffff";
    g.lineWidth = 7;
    drawIcon(g, type);
    g.restore();
  });
  return (iconTexCache["s" + type] = tex);
}
function cardIconTex(type) {
  if (iconTexCache["c" + type]) return iconTexCache["c" + type];
  const tex = canvasTex(128, (g, s) => {
    g.clearRect(0, 0, s, s);
    g.save();
    g.translate(14, 14);
    g.scale(1.0, 1.0);
    g.strokeStyle = "#ffffff";
    g.lineWidth = 9;
    drawIcon(g, type);
    g.restore();
  });
  return (iconTexCache["c" + type] = tex);
}
const gridTex = canvasTex(1040, (g, s) => {
  g.fillStyle = "#17171f";
  g.fillRect(0, 0, s, s);
  g.strokeStyle = "#252538";
  g.lineWidth = 2;
  for (let i = 0; i <= 26; i++) {
    g.beginPath();
    g.moveTo(i * 40, 0);
    g.lineTo(i * 40, s);
    g.moveTo(0, i * 40);
    g.lineTo(s, i * 40);
    g.stroke();
  }
});
const glowTex = canvasTex(
  512,
  (g, s) => {
    const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    r.addColorStop(0, "rgba(255,255,255,0.55)");
    r.addColorStop(0.45, "rgba(255,255,255,0.18)");
    r.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, s, s);
  },
  false,
);
function stripeTex(a, b, n) {
  return canvasTex(256, (g, s) => {
    for (let i = 0; i < n; i++) {
      g.fillStyle = i % 2 ? b : a;
      g.fillRect((i * s) / n, 0, s / n + 1, s);
    }
  });
}
const doorTex = canvasTex(256, (g, s) => {
  g.fillStyle = "#2a2a3a";
  g.fillRect(0, 0, s, s);
  g.fillStyle = "#3a3a52";
  for (let y = 0; y < s; y += 24) g.fillRect(0, y, s, 10);
});
function chevronTex() {
  const tex = canvasTex(128, (g, s) => {
    g.fillStyle = "#1a1a26";
    g.fillRect(0, 0, s, s);
    g.strokeStyle = "#5c64c8";
    g.lineWidth = 12;
    g.beginPath();
    g.moveTo(84, 20);
    g.lineTo(44, 64);
    g.lineTo(84, 108);
    g.stroke();
  });
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ── Material / mesh helpers ─────────────────────────────────────────────────
const std = (color, o = {}) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: o.rough ?? 0.82,
    metalness: o.metal ?? 0.05,
    emissive: o.emissive ?? 0x000000,
    emissiveIntensity: o.ei ?? 1,
    map: o.map ?? null,
    emissiveMap: o.emissiveMap ?? null,
  });
function mesh(geo, mat, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}
const box = (w, h, d, mat, x, y, z, parent) =>
  mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent);
const rbox = (w, h, d, r, mat, x, y, z, parent) =>
  mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat, x, y, z, parent);
const glowMat = (hex, k) => new THREE.MeshBasicMaterial({ color: hdr(hex, k) });

// Window grid on the two camera-facing faces (+x, +z) → returns on/off materials.
function addWindows(parent, w, d, cols, rows, y0, dy, pane, seed) {
  const r = mulberry32(seed);
  const onMat = std(0x2a2416, { emissive: C.gold, ei: 0.8, rough: 0.4 });
  const offMat = std(0x1b1b27, { rough: 0.3, metal: 0.3 });
  const geo = new THREE.PlaneGeometry(pane[0], pane[1]);
  const on = [];
  const off = [];
  const faces = [
    { n: "z", span: w, off: d / 2 + 0.012 },
    { n: "x", span: d, off: w / 2 + 0.012 },
  ];
  faces.forEach((f) => {
    const step = f.span / cols;
    for (let c = 0; c < cols; c++) {
      for (let row = 0; row < rows; row++) {
        const u = -f.span / 2 + step * (c + 0.5);
        const y = y0 + row * dy;
        const m = new THREE.Matrix4();
        if (f.n === "z") m.makeTranslation(u, y, f.off);
        else m.makeRotationY(Math.PI / 2).setPosition(f.off, y, -u);
        (r() < 0.78 ? on : off).push(m);
      }
    }
  });
  const mk = (list, mat) => {
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((m, i) => im.setMatrixAt(i, m));
    parent.add(im);
  };
  mk(on, onMat);
  mk(off, offMat);
  return onMat;
}
function addSign(parent, type, x, y, z, size, faceX) {
  const tex = signTex(type);
  const mat = std(0xffffff, { map: tex, emissive: 0xffffff, emissiveMap: tex, ei: 0.75, rough: 0.5 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
  m.position.set(x, y, z);
  if (faceX) m.rotation.y = Math.PI / 2;
  parent.add(m);
  return m;
}

// ── World layout ────────────────────────────────────────────────────────────
const R = 9.5;
const CONV_SPEED = 2.2;
const CORE_H = 2.4;
const CORE_EDGE = 2.25;
const BLD = [
  { key: "bureau", phi: 225, w: 3.4, d: 3.4, top: 7.55, types: ["email", "invoice"] },
  { key: "appels", phi: 297, w: 3.4, d: 3.4, top: 4.75, types: ["chat", "email"] },
  { key: "entrepot", phi: 9, w: 5.2, d: 3.8, top: 3.45, types: ["form", "invoice"] },
  { key: "boutique", phi: 81, w: 3.4, d: 3.0, top: 2.75, types: ["chat", "invoice"] },
  { key: "atelier", phi: 153, w: 4.4, d: 3.4, top: 3.45, types: ["form", "email"] },
];
BLD.forEach((b, i) => {
  const a = (b.phi * Math.PI) / 180;
  b.i = i;
  b.v = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
  b.P = b.v.clone().multiplyScalar(R);
  const rb = (b.w / 2) * Math.abs(b.v.x) + (b.d / 2) * Math.abs(b.v.z) + 0.3;
  b.pileD = R - rb - 0.9;
  b.convStart = b.pileD - 0.55;
  b.convLen = b.convStart - CORE_EDGE;
  b.convDur = b.convLen / CONV_SPEED;
  b.pile = b.v.clone().multiplyScalar(b.pileD);
  b.roof = new THREE.Vector3(b.P.x, b.top, b.P.z);
});
const byKey = Object.fromEntries(BLD.map((b) => [b.key, b]));

// Island slab, rim, glow.
const slab = rbox(26, 1, 26, 0.35, std(0xffffff, { map: gridTex, rough: 0.95 }), 0, -0.5, 0, scene);
slab.castShadow = false;
const rimMat = glowMat(C.indigo, 2.4);
[
  [26, 0.07, 0.07, 0, 0.0, 12.97],
  [26, 0.07, 0.07, 0, 0.0, -12.97],
  [0.07, 0.07, 26, 12.97, 0.0, 0],
  [0.07, 0.07, 26, -12.97, 0.0, 0],
].forEach(([w, h, d, x, y, z]) => box(w, h, d, rimMat, x, y, z, scene).castShadow = false);
const under = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 60),
  new THREE.MeshBasicMaterial({
    map: glowTex,
    color: hdr(C.indigo, 0.1),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
);
under.rotation.x = -Math.PI / 2;
under.position.y = -2.2;
scene.add(under);

// Lamp posts along the rim.
const lampGlow = glowMat(C.gold, 3.2);
const postMat = std(0x2e2e40);
[
  [-11.6, 11.6],
  [0, 12.2],
  [11.6, 11.6],
  [12.2, 0],
  [11.6, -11.6],
  [-12.2, 0],
  [-6, 12.2],
  [12.2, 6],
  [12.2, -6],
  [6, 12.2],
].forEach(([x, z]) => {
  mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.3, 8), postMat, x, 0.65, z, scene);
  mesh(new THREE.SphereGeometry(0.13, 12, 8), lampGlow, x, 1.35, z, scene).castShadow = false;
});

// ── Buildings ───────────────────────────────────────────────────────────────
const bodies = {};
function building(b, build) {
  const g = new THREE.Group();
  g.position.copy(b.P);
  scene.add(g);
  const inner = new THREE.Group();
  g.add(inner);
  bodies[b.key] = { group: inner, ...build(inner, b) };
}
const wallM = std(C.wall);
const wall2M = std(C.wall2);
const roofM = std(C.roof);
const trimM = std(C.trim);
const darkM = std(C.dark);

building(byKey.bureau, (g, b) => {
  box(4.0, 0.3, 4.0, trimM, 0, 0.15, 0, g);
  box(3.4, 7, 3.4, wallM, 0, 3.8, 0, g);
  const win = addWindows(g, 3.4, 3.4, 4, 10, 0.95, 0.62, [0.46, 0.42], 11);
  box(3.6, 0.25, 3.6, trimM, 0, 7.4, 0, g);
  box(1.4, 0.55, 1.0, wall2M, -0.6, 7.8, -0.6, g);
  mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.7, 8), trimM, 0.9, 8.35, 0.9, g);
  const tip = mesh(new THREE.SphereGeometry(0.12, 12, 8), glowMat(C.gold, 3), 0.9, 9.25, 0.9, g);
  box(1.6, 0.12, 0.9, trimM, 0, 0.95, 1.95, g);
  return { win, tip };
});
building(byKey.appels, (g, b) => {
  box(3.8, 0.3, 3.8, trimM, 0, 0.15, 0, g);
  box(3.4, 4.2, 3.4, wall2M, 0, 2.4, 0, g);
  const win = addWindows(g, 3.4, 3.4, 5, 3, 1.05, 0.85, [0.42, 0.5], 23);
  box(3.6, 0.22, 3.6, trimM, 0, 4.55, 0, g);
  const dishG = new THREE.Group();
  dishG.position.set(-0.6, 4.95, -0.5);
  g.add(dishG);
  mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.6, 8), trimM, 0, 0, 0, dishG);
  const dish = mesh(
    new THREE.SphereGeometry(0.85, 24, 12, 0, Math.PI * 2, 0, Math.PI / 3),
    std(0xd9dbe8, { rough: 0.5 }),
    0,
    0.55,
    0,
    dishG,
  );
  dish.rotation.x = Math.PI * 0.78;
  mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.0, 8), trimM, 1.0, 5.6, 1.0, g);
  const tip = mesh(new THREE.SphereGeometry(0.11, 12, 8), glowMat(C.indigo, 3), 1.0, 6.65, 1.0, g);
  addSign(g, "headset", 0, 3.95, 1.71, 0.95, false);
  return { win, tip, dishG };
});
building(byKey.entrepot, (g, b) => {
  box(5.6, 0.3, 4.2, trimM, 0, 0.15, 0, g);
  box(5.2, 2.4, 3.8, wallM, 0, 1.5, 0, g);
  const vault = mesh(
    new THREE.CylinderGeometry(1.9, 1.9, 5.2, 28, 1, false, 0, Math.PI),
    roofM,
    0,
    2.7,
    0,
    g,
  );
  vault.rotation.set(0, 0, Math.PI / 2);
  vault.scale.set(0.42, 1, 1);
  const doorM = std(0xffffff, { map: doorTex });
  [-1.3, 1.3].forEach((x) => box(1.6, 1.7, 0.06, doorM, x, 1.15, 1.92, g));
  box(5.4, 0.12, 0.7, trimM, 0, 0.36, 2.2, g);
  const crateM = std(0x5b4b2a, { rough: 0.9 });
  [
    [3.25, 0.55, 1.35],
    [3.25, 0.55, 0.55],
    [3.25, 1.25, 0.95],
  ].forEach(([x, y, z]) => rbox(0.7, 0.7, 0.7, 0.06, crateM, x, y, z, g));
  const win = addWindows(g, 5.2, 3.8, 6, 1, 2.35, 0, [0.5, 0.22], 37);
  addSign(g, "crate", 2.61, 1.55, -1.0, 0.9, true);
  return { win };
});
building(byKey.boutique, (g, b) => {
  box(3.8, 0.3, 3.4, trimM, 0, 0.15, 0, g);
  box(3.4, 2.3, 3.0, wall2M, 0, 1.45, 0, g);
  box(3.6, 0.2, 3.2, trimM, 0, 2.7, 0, g);
  const shopM = std(0x2a2416, { emissive: C.gold, ei: 1.1, rough: 0.3 });
  box(2.6, 1.15, 0.05, shopM, 0, 1.0, 1.51, g);
  box(0.05, 0.9, 1.6, shopM, 1.71, 1.1, 0, g);
  const awning = mesh(new THREE.BoxGeometry(3.2, 0.08, 1.0), std(0xffffff, { map: stripeTex("#c9a84c", "#efe9da", 10) }), 0, 1.95, 1.85, g);
  awning.rotation.x = 0.38;
  const sign = new THREE.Group();
  sign.position.set(0.2, 2.8, 0.2);
  g.add(sign);
  mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8), trimM, 0, 0.25, 0, sign);
  addSign(sign, "bag", 0, 0.95, 0, 0.9, false);
  const win = shopM;
  return { win };
});
building(byKey.atelier, (g, b) => {
  box(4.8, 0.3, 3.8, trimM, 0, 0.15, 0, g);
  box(4.4, 2.2, 3.4, wallM, 0, 1.4, 0, g);
  const glassM = std(0x1a1d36, { emissive: C.indigo, ei: 0.9, rough: 0.25 });
  const L = 4.4 / 3;
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(L, 0);
    s.lineTo(L, 1.0);
    s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: 3.4, bevelEnabled: false });
    const tooth = mesh(geo, roofM, -2.2 + i * L, 2.5, -1.7, g);
    const glass = mesh(new THREE.PlaneGeometry(3.2, 0.8), glassM, -2.2 + (i + 1) * L + 0.01, 3.0, 0, g);
    glass.rotation.y = Math.PI / 2;
    glass.castShadow = false;
    void tooth;
  }
  box(1.7, 1.5, 0.06, std(0xffffff, { map: doorTex }), -0.9, 1.05, 1.72, g);
  const gear = addSign(g, "gear", 1.2, 1.55, 1.72, 1.0, false);
  mesh(new THREE.CylinderGeometry(0.22, 0.26, 1.4, 12), trimM, -1.6, 3.4, -1.2, g);
  const win = addWindows(g, 4.4, 3.4, 4, 1, 2.05, 0, [0.4, 0.18], 51);
  return { win, gear };
});

// ── The Altiarc core (rises at 6.2s) ────────────────────────────────────────
const corePad = mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.1, 6), std(0x1d1d2b, { emissive: C.indigo, ei: 0.05 }), 0, 0.05, 0, scene);
corePad.rotation.y = Math.PI / 6;
const coreG = new THREE.Group();
scene.add(coreG);
const coreBody = mesh(new THREE.CylinderGeometry(2.0, 2.15, CORE_H, 6), std(0x1f1f2e, { rough: 0.32, metal: 0.45 }), 0, CORE_H / 2, 0, coreG);
coreBody.rotation.y = Math.PI / 6;
const bandMat = glowMat(C.indigo, 3.0);
[0.75, 1.55].forEach((y) => {
  const band = mesh(new THREE.CylinderGeometry(2.09, 2.11, 0.09, 6, 1, true), bandMat, 0, y, 0, coreG);
  band.rotation.y = Math.PI / 6;
  band.castShadow = false;
});
const coreCap = mesh(new THREE.CylinderGeometry(2.05, 2.0, 0.16, 6), trimM, 0, CORE_H + 0.08, 0, coreG);
coreCap.rotation.y = Math.PI / 6;

// Heart: the hero module (indigo seed → gold at the end).
const heartG = new THREE.Group();
scene.add(heartG);
const heartMat = std(0x101018, { emissive: C.indigo, ei: 2.6, rough: 0.3 });
const heart = mesh(new RoundedBoxGeometry(0.85, 0.85, 0.85, 3, 0.08), heartMat, 0, 0, 0, heartG);
heart.castShadow = false;
const heartEdges = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1.25, 1.25, 1.25)),
  new THREE.LineBasicMaterial({ color: hdr(C.violet, 1.6), transparent: true, opacity: 0.85 }),
);
heartG.add(heartEdges);
const haloMat = new THREE.MeshBasicMaterial({ color: hdr(C.violet, 2.0), transparent: true, opacity: 0 });
const halo = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.05, 8, 64), haloMat);
heartG.add(halo);
const heartLight = new THREE.PointLight(C.indigo, 3.2, 7, 1.8);
const HEART_LIGHT = 3.2;
heartG.add(heartLight);

const shockMat = new THREE.MeshBasicMaterial({ color: hdr(C.indigo, 2.2), transparent: true, opacity: 0, depthWrite: false });
const shock = new THREE.Mesh(new THREE.RingGeometry(0.985, 1.0, 160), shockMat);
shock.rotation.x = -Math.PI / 2;
shock.position.y = 0.06;
scene.add(shock);

// ── Conveyors, scanner gates, ribbons ───────────────────────────────────────
const railMat = glowMat(C.indigo, 2.4);
BLD.forEach((b) => {
  const g = new THREE.Group();
  g.position.copy(b.v.clone().multiplyScalar(CORE_EDGE));
  g.rotation.y = Math.atan2(-b.v.z, b.v.x);
  scene.add(g);
  const L = b.convLen;
  box(L, 0.14, 0.78, darkM, L / 2, 0.07, 0, g);
  const tex = chevronTex();
  tex.repeat.set(L / 0.78, 1);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(L, 0.66), new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.6, roughness: 0.6 }));
  top.rotation.x = -Math.PI / 2;
  top.position.set(L / 2, 0.145, 0);
  top.receiveShadow = true;
  g.add(top);
  [-0.4, 0.4].forEach((z) => (box(L, 0.05, 0.04, railMat, L / 2, 0.17, z, g).castShadow = false));
  // Scanner gate, 0.65 units out from the core.
  const gateMat = new THREE.MeshBasicMaterial({ color: hdr(C.indigo, 1.4) });
  const gate = new THREE.Group();
  gate.position.set(0.65, 0, 0);
  g.add(gate);
  box(0.09, 1.0, 0.09, gateMat, 0, 0.5, -0.5, gate);
  box(0.09, 1.0, 0.09, gateMat, 0, 0.5, 0.5, gate);
  box(0.09, 0.09, 1.09, gateMat, 0, 1.0, 0, gate);
  b.conv = { g, tex, speed: CONV_SPEED, gateMat };

  // Ribbon: core top → roof, drawn progressively.
  const start = new THREE.Vector3(0, CORE_H + 0.35, 0);
  const end = b.roof.clone().add(new THREE.Vector3(0, -0.15, 0));
  const ctrl = new THREE.Vector3(b.P.x * 0.5, Math.max(CORE_H, b.top) + 3.4, b.P.z * 0.5);
  const curve = new THREE.QuadraticBezierCurve3(start, ctrl, end);
  const geo = new THREE.TubeGeometry(curve, 90, 0.055, 6, false);
  const rib = new THREE.Mesh(geo, glowMat(C.indigo, 3.0));
  rib.geometry.setDrawRange(0, 0);
  scene.add(rib);
  b.ribbon = { curve, mesh: rib, total: geo.index.count };
});

// ── Tasks: raw cards (rose) → processed cubes (gold) ────────────────────────
const cardGeo = new RoundedBoxGeometry(1.0, 0.18, 0.72, 2, 0.05);
const cardMat = std(C.rose, { emissive: C.rose, ei: 0.35, rough: 0.55 });
const iconGeo = new THREE.PlaneGeometry(0.55, 0.55);
const cubeGeo = new RoundedBoxGeometry(0.44, 0.44, 0.44, 2, 0.05);
const cubeMat = std(0x2a2210, { emissive: C.gold, ei: 2.4, rough: 0.35 });
const ARC_DUR = 1.15;
const tasks = [];
function addTask(b, type, o) {
  const card = new THREE.Group();
  const body = new THREE.Mesh(cardGeo, cardMat);
  body.castShadow = true;
  card.add(body);
  const icon = new THREE.Mesh(iconGeo, new THREE.MeshBasicMaterial({ map: cardIconTex(type), transparent: true, depthWrite: false }));
  icon.rotation.x = -Math.PI / 2;
  icon.position.y = 0.095;
  card.add(icon);
  card.visible = false;
  scene.add(card);
  const cube = new THREE.Mesh(cubeGeo, cubeMat);
  cube.visible = false;
  scene.add(cube);
  const task = { b, type, card, cube, jx: (rand() - 0.5) * 0.12, jz: (rand() - 0.5) * 0.12, rot: (rand() - 0.5) * 0.9, spin: rand() * 6, ...o };
  task.onConv = task.leave + (task.mode === "pile" ? 0.32 : 0.55);
  task.atCore = task.onConv + b.convDur;
  task.out = task.atCore + 0.22;
  task.land = task.out + ARC_DUR;
  tasks.push(task);
  return task;
}
// Act 2: piles of 7 per building. Act 3: piles drain; then a steady stream.
BLD.forEach((b) => {
  for (let k = 0; k < 7; k++) {
    addTask(b, b.types[k % 2], {
      mode: "pile",
      k,
      spawn: 3.7 + b.i * 0.11 + k * 0.33,
      leave: 7.35 + b.i * 0.09 + (6 - k) * 0.34,
    });
  }
  for (let n = 0, s = 9.9 + b.i * 0.19; s < 21.4; n++, s = 9.9 + b.i * 0.19 + n * 1.1) {
    addTask(b, b.types[(n + 1) % 2], { mode: "stream", spawn: s, leave: s });
  }
});
const TRACK = tasks.find((x) => x.b.key === "boutique" && x.mode === "pile" && x.k === 6);

const v3 = () => new THREE.Vector3();
const tmpA = v3();
const tmpB = v3();
function arc(from, to, p, h, out) {
  out.lerpVectors(from, to, p);
  out.y += 4 * h * p * (1 - p);
  return out;
}
function slotPos(task, out) {
  const b = task.b;
  return out.set(b.pile.x + task.jx, 0.17 + task.k * 0.19, b.pile.z + task.jz);
}
function convPoint(b, d, out) {
  return out.copy(b.v).multiplyScalar(d).setY(0.3);
}
// Card pose at time t → returns false when hidden.
function cardPose(task, t, pos) {
  const b = task.b;
  if (t < task.spawn || t >= task.atCore + 0.14) return false;
  let scale = 1;
  let rotY = task.rot;
  if (task.mode === "pile") {
    if (t < task.spawn + 0.5) {
      const p = ease("power1.inOut")(prog(t, task.spawn, task.spawn + 0.5));
      arc(tmpA.copy(b.roof), slotPos(task, tmpB), p, 1.4, pos);
      scale = Math.min(1, prog(t, task.spawn, task.spawn + 0.12) * 1.0 + 0.0001);
      rotY = task.rot + (1 - p) * 2.4;
    } else if (t < task.leave) {
      slotPos(task, pos);
      // Wobble once the pile is high (friction).
      const wob = Math.sin(t * 5.3 + task.k) * 0.025 * task.k * smooth(t, 5.0, 6.0) * (1 - smooth(t, 6.8, 7.2));
      pos.x += wob;
    } else if (t < task.onConv) {
      const p = ease("power2.inOut")(prog(t, task.leave, task.onConv));
      arc(slotPos(task, tmpA), convPoint(b, b.convStart, tmpB), p, 0.5, pos);
      rotY = lerp(task.rot, Math.PI / 2, p);
    }
  } else if (t < task.onConv) {
    const p = ease("power1.inOut")(prog(t, task.spawn, task.onConv));
    arc(tmpA.copy(b.roof), convPoint(b, b.convStart, tmpB), p, 1.1, pos);
    scale = Math.min(1, prog(t, task.spawn, task.spawn + 0.12) + 0.0001);
    rotY = lerp(2.0, Math.PI / 2, p);
  }
  if (t >= task.onConv) {
    const p = prog(t, task.onConv, task.atCore);
    convPoint(b, lerp(b.convStart, CORE_EDGE, p), pos);
    rotY = Math.PI / 2;
    if (t >= task.atCore) {
      const q = prog(t, task.atCore, task.atCore + 0.14);
      convPoint(b, lerp(CORE_EDGE, 1.7, q), pos);
      scale = 1 - q;
    }
  }
  task.card.position.copy(pos);
  task.card.rotation.set(0, Math.atan2(-b.v.z, b.v.x) + rotY, 0);
  task.card.scale.setScalar(Math.max(0.0001, scale));
  return true;
}
function cubePose(task, t) {
  if (t < task.out || t >= task.land + 0.16) return false;
  const p = ease("power1.inOut")(prog(t, task.out, task.land));
  task.b.ribbon.curve.getPoint(p, task.cube.position);
  let s = smooth(t, task.out, task.out + 0.14);
  if (t > task.land) s = 1 - prog(t, task.land, task.land + 0.16);
  task.cube.scale.setScalar(Math.max(0.0001, s));
  task.cube.rotation.set(t * 2.1 + task.spin, t * 1.6 + task.spin, 0);
  return true;
}

// ── Camera journey ──────────────────────────────────────────────────────────
const EL = (35.264 * Math.PI) / 180;
const HEART_UP = CORE_H + 1.15;
const P = (x, y, z) => new THREE.Vector3(x, y, z);
const KEYS = [
  { t: 0.0, tg: P(0, 1.0, 0), z: 7.0, az: 45 },
  { t: 0.35, tg: P(0, 1.0, 0), z: 7.0, az: 45 },
  { t: 2.7, tg: P(0, 1.3, 0), z: 1.0, az: 45, e: "power4.out" },
  { t: 6.9, tg: P(0, 2.1, 0), z: 1.12, az: 40, e: "sine.inOut" },
  { t: 7.75, tg: convPoint(byKey.boutique, byKey.boutique.convStart, v3()), z: 2.5, az: 37, e: "power3.inOut" },
  { t: 9.6, tg: convPoint(byKey.boutique, CORE_EDGE, v3()), z: 2.6, az: 35, e: "none" },
  { t: 10.6, tg: P(0, 1.8, 0), z: 1.35, az: 48, e: "power2.inOut" },
  { t: 11.45, tg: byKey.appels.roof.clone(), z: 3.3, az: 50, e: "power3.inOut" },
  { t: 14.45, tg: byKey.appels.roof.clone(), z: 3.45, az: 51, e: "sine.inOut" },
  { t: 15.4, tg: byKey.bureau.roof.clone(), z: 2.75, az: 47, e: "power2.inOut" },
  { t: 18.2, tg: byKey.bureau.roof.clone(), z: 2.9, az: 46, e: "sine.inOut" },
  { t: 19.35, tg: P(0, 2.4, 0), z: 0.98, az: 45, e: "power3.inOut" },
  { t: 21.6, tg: P(0, 2.2, 0), z: 1.04, az: 53, e: "sine.inOut" },
  { t: 23.3, tg: P(0, HEART_UP, 0), z: 0.07, az: 62, e: "power2.in" },
];
const camTarget = v3();
const trackPos = v3();
function cameraAt(t) {
  let i = 0;
  while (i < KEYS.length - 1 && t >= KEYS[i + 1].t) i++;
  const a = KEYS[i];
  const b = KEYS[Math.min(i + 1, KEYS.length - 1)];
  const p = b === a ? 0 : ease(b.e || "none")(prog(t, a.t, b.t));
  camTarget.lerpVectors(a.tg, b.tg, p);
  let zoom = lerp(a.z, b.z, p);
  const az = lerp(a.az, b.az, p);
  // Act 3 tracking shot: lock onto the boutique card as it rides the conveyor.
  const w = smooth(t, 7.55, 8.05) * (1 - smooth(t, 9.4, 9.8));
  if (w > 0 && cardPose(TRACK, Math.min(t, TRACK.atCore), trackPos)) camTarget.lerp(trackPos, w);
  // Micro drift so holds never die (screen-constant amplitude).
  const dAmp = 0.11 / zoom;
  camTarget.x += Math.sin(t * 0.71) * dAmp;
  camTarget.z += Math.cos(t * 0.53) * dAmp;
  zoom *= 1 + Math.sin(t * 0.37) * 0.006;
  const azr = (az * Math.PI) / 180;
  const dir = tmpA.set(Math.cos(EL) * Math.sin(azr), Math.sin(EL), Math.cos(EL) * Math.cos(azr));
  camera.position.copy(camTarget).addScaledVector(dir, 120);
  camera.up.set(0, 1, 0);
  camera.lookAt(camTarget);
  camera.zoom = zoom;
  camera.updateProjectionMatrix();
}

// ── Scene state at time t ───────────────────────────────────────────────────
const RISE = { bureau: 0.75, atelier: 1.0, appels: 1.2, boutique: 1.4, entrepot: 1.6 };
const backOut = ease("back.out(1.6)");
const pos = v3();
const gold = new THREE.Color(C.gold);
const indigo = new THREE.Color(C.indigo);
const heartCol = new THREE.Color();
function renderAt(t) {
  // Buildings rise out of the ground during the pull-back.
  for (const b of BLD) {
    const body = bodies[b.key];
    const s = backOut(prog(t, RISE[b.key], RISE[b.key] + 0.75));
    body.group.scale.set(1, Math.max(0.001, s), 1);
    // Windows: dim and overworked before the system, then lit + pulses on each delivery.
    let pulse = 0;
    for (const task of tasks) {
      if (task.b === b && t >= task.land) pulse += Math.exp(-(t - task.land) * 3.2);
    }
    body.win.emissiveIntensity = lerp(0.45, 0.85, smooth(t, 7.2, 9.5)) + Math.min(pulse, 1) * 0.85;
    if (body.tip) body.tip.material.color.copy(b.key === "appels" ? indigo : gold).multiplyScalar(1.2 + 2.4 * (0.5 + 0.5 * Math.sin(t * 5.5)));
    if (body.dishG) body.dishG.rotation.y = 0.6 + Math.sin(t * 0.6) * 0.5;
    if (body.gear) body.gear.rotation.z = -t * 1.4;
  }

  // Core rises at 6.2s; heart rides up with it.
  const cr = ease("back.out(1.3)")(prog(t, 6.2, 6.95));
  coreG.scale.set(1, Math.max(0.001, cr), 1);
  coreG.visible = t >= 6.2;
  const bob = Math.sin(t * 1.9) * 0.12;
  heartG.position.set(0, lerp(1.0, HEART_UP, cr) + bob, 0);
  heart.rotation.set(0.62, t * 0.9, 0.25);
  heartEdges.rotation.set(-0.3, -t * 0.6, 0.4);
  halo.rotation.set(Math.PI / 2 + Math.sin(t * 0.8) * 0.25, 0, t * 0.7);
  haloMat.opacity = smooth(t, 6.7, 7.2) * 0.9;
  const goldMix = smooth(t, 21.7, 22.5);
  heartCol.copy(indigo).lerp(gold, goldMix);
  heartMat.emissive.copy(heartCol);
  heartMat.emissiveIntensity = 2.6 + 1.6 * smooth(t, 6.85, 7.0) * (1 - smooth(t, 7.0, 7.8)) + goldMix * 1.2;
  heartLight.color.copy(heartCol);
  heartLight.intensity = lerp(0.7, HEART_LIGHT, cr);
  const hs = 1 + goldMix * 1.6;
  heartG.scale.setScalar(hs);
  corePad.material.emissiveIntensity = 0.03 + 0.06 * (0.5 + 0.5 * Math.sin(t * 3.0)) * (1 - smooth(t, 6.2, 6.6));

  // Shockwave as the core lands.
  const sp = prog(t, 6.88, 7.75);
  shock.scale.setScalar(2.2 + ease("power2.out")(sp) * 13);
  shockMat.opacity = sp > 0 && sp < 1 ? 0.75 * (1 - sp) : 0;

  // Conveyors grow from the core; ribbons draw core → roof.
  for (const b of BLD) {
    const c = b.conv;
    const g = ease("power3.out")(prog(t, 6.95 + b.i * 0.06, 7.5 + b.i * 0.06));
    c.g.scale.set(Math.max(0.001, g), 1, 1);
    c.g.visible = t >= 6.95;
    c.tex.offset.x = (t * c.speed) / 0.78;
    const rp = ease("power2.inOut")(prog(t, 7.05 + b.i * 0.1, 7.95 + b.i * 0.1));
    const cnt = Math.floor((rp * b.ribbon.total) / 3) * 3;
    b.ribbon.mesh.geometry.setDrawRange(0, cnt);
    b.ribbon.mesh.visible = cnt > 0;
    let flash = 0;
    for (const task of tasks) {
      if (task.b !== b) continue;
      const gateT = task.onConv + b.convDur * (1 - 0.65 / b.convLen);
      const d = t - gateT;
      if (d > 0 && d < 0.5) flash += Math.exp(-d * 9);
    }
    c.gateMat.color.copy(indigo).multiplyScalar(1.3 + Math.min(flash, 1.2) * 3.2);
  }

  // Tasks.
  for (const task of tasks) {
    task.card.visible = cardPose(task, t, pos);
    task.cube.visible = cubePose(task, t);
  }

  cameraAt(t);
  composer.render();
}

window.__altiarcCity = { renderAt, BLD };
window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(window.__hfThreeTime || 0);
if (window.__altiarcCityReady) window.__altiarcCityReady();
