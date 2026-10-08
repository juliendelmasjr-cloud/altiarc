// Altiarc — La boutique 24/7 (Three.js, orthographic iso camera, full day/night cycle).
// Every visual state (3D + HTML overlays + HUD) is a pure function of HyperFrames time `t`.
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
const bell = (t, a, m, b) => (t < m ? smooth(t, a, m) : 1 - smooth(t, m, b));
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let r = Math.imul(a ^ (a >>> 15), 1 | a);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
// Piecewise-linear lookup over [[t, v], …].
function pw(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) return lerp(keys[i - 1][1], keys[i][1], prog(t, keys[i - 1][0], keys[i][0]));
  }
  return keys[keys.length - 1][1];
}

// ── Brand palette (frame.md) ────────────────────────────────────────────────
const C = {
  bg: 0x0c0c0c,
  indigo: 0x818cf8,
  violet: 0xc084fc,
  gold: 0xc9a84c,
  rose: 0xf472b6,
  white: 0xf2f2f7,
  slab: 0x1b1b24,
  wallOut: 0x34344a,
  wallIn: 0x4a4a64,
  trim: 0x5a5a78,
  floor: 0x2f2b3a,
  dark: 0x1c1c28,
  sage: 0x56635d,
};
const hdr = (hex, k) => new THREE.Color(hex).multiplyScalar(k);
const col = (hex) => new THREE.Color(hex);

// ── Renderer / composer ─────────────────────────────────────────────────────
const canvas = document.getElementById("shop-canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.setClearColor(C.bg, 1);
renderer.toneMapping = THREE.NeutralToneMapping;
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
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.6, 0.2, 0.72);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ── Lights (driven by the day/night cycle) ──────────────────────────────────
const hemi = new THREE.HemisphereLight(0xcdd3ff, 0x0c0c14, 1.0);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1dc, 2.4);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 90 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.03;
scene.add(sun);
scene.add(sun.target);
const moon = new THREE.DirectionalLight(0x8f97ff, 0.4);
moon.position.set(-10, 20, 14);
scene.add(moon);
const shopLight = new THREE.PointLight(0xffd9a0, 0, 11, 1.6);
scene.add(shopLight);

// ── Canvas textures ─────────────────────────────────────────────────────────
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"), w, h);
  const tex = new THREE.CanvasTexture(c);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
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
function drawIcon(g, type) {
  g.lineCap = "round";
  g.lineJoin = "round";
  if (type === "calendar") {
    rrect(g, 14, 20, 72, 66, 9);
    g.stroke();
    g.beginPath();
    g.moveTo(14, 40);
    g.lineTo(86, 40);
    g.moveTo(32, 12);
    g.lineTo(32, 28);
    g.moveTo(68, 12);
    g.lineTo(68, 28);
    g.stroke();
    g.beginPath();
    g.moveTo(34, 62);
    g.lineTo(46, 73);
    g.lineTo(68, 52);
    g.stroke();
  } else if (type === "contact") {
    g.beginPath();
    g.arc(50, 36, 15, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.moveTo(22, 84);
    g.quadraticCurveTo(24, 58, 50, 58);
    g.quadraticCurveTo(76, 58, 78, 84);
    g.stroke();
  } else if (type === "ticket") {
    rrect(g, 12, 26, 76, 52, 8);
    g.stroke();
    g.beginPath();
    g.moveTo(16, 32);
    g.lineTo(50, 56);
    g.lineTo(84, 32);
    g.stroke();
  }
}
function tokenIconTex(type) {
  return canvasTex(128, 128, (g, s) => {
    g.translate(14, 14);
    g.strokeStyle = "#ffffff";
    g.lineWidth = 9;
    drawIcon(g, type);
  });
}
const glowTex = canvasTex(
  256,
  256,
  (g, s) => {
    const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    r.addColorStop(0, "rgba(255,255,255,1)");
    r.addColorStop(0.35, "rgba(255,255,255,0.35)");
    r.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, s, s);
  },
  false,
);
const gridTex = canvasTex(1100, 1100, (g, s) => {
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, s, s);
  g.strokeStyle = "#d9d9e6";
  g.lineWidth = 2;
  for (let i = 0; i <= 22; i++) {
    g.beginPath();
    g.moveTo(i * 50, 0);
    g.lineTo(i * 50, s);
    g.moveTo(0, i * 50);
    g.lineTo(s, i * 50);
    g.stroke();
  }
});
const plankTex = canvasTex(512, 512, (g, s) => {
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, s, s);
  g.fillStyle = "#ececec";
  for (let i = 0; i < 8; i++) if (i % 2) g.fillRect(0, i * 64, s, 64);
  g.strokeStyle = "#cfcfcf";
  g.lineWidth = 3;
  for (let i = 0; i <= 8; i++) {
    g.beginPath();
    g.moveTo(0, i * 64);
    g.lineTo(s, i * 64);
    g.stroke();
  }
});

// The website on the vitrine and the other text textures are drawn once the fonts are ready.
let siteTex;
let boardTex;
let signTexOpen;
let signTexClosed;
function drawSite() {
  siteTex = canvasTex(2048, 1140, (g, w, h) => {
    g.fillStyle = "#12121b";
    g.fillRect(0, 0, w, h);
    // Nav.
    g.fillStyle = "#181824";
    g.fillRect(0, 0, w, 130);
    g.fillStyle = "#c084fc";
    g.beginPath();
    g.arc(84, 65, 16, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#ffffff";
    g.font = '700 46px "Outfit"';
    g.textBaseline = "middle";
    g.fillText("Maison Nova", 118, 66);
    g.font = '400 34px "Outfit"';
    g.fillStyle = "rgba(255,255,255,0.62)";
    ["Accueil", "Services", "Tarifs", "Contact"].forEach((s, i) => g.fillText(s, 860 + i * 190, 66));
    g.fillStyle = "#c9a84c";
    rrect(g, 1660, 34, 320, 64, 32);
    g.fill();
    g.fillStyle = "#14141b";
    g.font = '700 32px "Outfit"';
    g.fillText("Prendre RDV", 1720, 67);
    // Hero.
    g.fillStyle = "rgba(255,255,255,0.55)";
    g.font = '700 30px "Space Mono"';
    g.fillText("CONCEPT STORE · ATELIER", 96, 250);
    g.fillStyle = "#ffffff";
    g.font = '800 118px "Outfit"';
    g.fillText("Bienvenue chez", 90, 370);
    g.fillText("Maison Nova.", 90, 500);
    g.font = '400 40px "Outfit"';
    g.fillStyle = "rgba(255,255,255,0.68)";
    g.fillText("Ouvert du mardi au samedi, 9 h – 19 h.", 96, 610);
    g.fillStyle = "#c9a84c";
    rrect(g, 96, 680, 380, 92, 46);
    g.fill();
    g.fillStyle = "#14141b";
    g.font = '700 38px "Outfit"';
    g.fillText("Prendre rendez-vous", 132, 727);
    g.strokeStyle = "rgba(255,255,255,0.35)";
    g.lineWidth = 3;
    rrect(g, 506, 680, 300, 92, 46);
    g.stroke();
    g.fillStyle = "#ffffff";
    g.fillText("Nos tarifs", 580, 727);
    // Product tiles.
    const tile = (x, y, w2, h2, c1) => {
      g.fillStyle = "#1d1d2b";
      rrect(g, x, y, w2, h2, 28);
      g.fill();
      const r = g.createRadialGradient(x + w2 * 0.5, y + h2 * 0.45, 10, x + w2 * 0.5, y + h2 * 0.45, w2 * 0.6);
      r.addColorStop(0, c1);
      r.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = r;
      rrect(g, x, y, w2, h2, 28);
      g.fill();
    };
    tile(1060, 210, 420, 330, "rgba(129,140,248,0.55)");
    tile(1510, 210, 440, 330, "rgba(201,168,76,0.5)");
    tile(1060, 570, 420, 230, "rgba(192,132,252,0.45)");
    // Chat widget (the chatbot lives here).
    g.fillStyle = "#1a1a28";
    rrect(g, 1510, 600, 440, 470, 34);
    g.fill();
    g.strokeStyle = "rgba(129,140,248,0.7)";
    g.lineWidth = 4;
    rrect(g, 1510, 600, 440, 470, 34);
    g.stroke();
    g.fillStyle = "#818cf8";
    g.beginPath();
    g.arc(1556, 650, 10, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#ffffff";
    g.font = '600 30px "Outfit"';
    g.fillText("Assistant · en ligne", 1580, 651);
    // Footer strip.
    g.fillStyle = "rgba(255,255,255,0.35)";
    g.font = '400 26px "Space Mono"';
    g.fillText("maison-nova.fr", 96, 1080);
  });
  boardTex = canvasTex(1024, 680, (g, w, h) => {
    g.fillStyle = "#1b1b26";
    rrect(g, 0, 0, w, h, 30);
    g.fill();
    g.strokeStyle = "#c9a84c";
    g.lineWidth = 6;
    rrect(g, 3, 3, w - 6, h - 6, 28);
    g.stroke();
    g.fillStyle = "#e9d49a";
    g.font = '700 44px "Space Mono"';
    g.textBaseline = "middle";
    g.fillText("AGENDA", 48, 62);
    g.fillStyle = "rgba(255,255,255,0.7)";
    g.font = '700 34px "Space Mono"';
    ["LUN", "MAR", "MER", "JEU", "VEN"].forEach((d, i) => g.fillText(d, 188 + i * 166, 140));
    ["9h", "11h", "14h", "16h"].forEach((r, i) => g.fillText(r, 44, 230 + i * 116));
  });
  const sign = (label, color) =>
    canvasTex(512, 220, (g, w, h) => {
      g.fillStyle = "#16161f";
      rrect(g, 4, 4, w - 8, h - 8, 40);
      g.fill();
      g.strokeStyle = color;
      g.lineWidth = 8;
      rrect(g, 10, 10, w - 20, h - 20, 34);
      g.stroke();
      g.fillStyle = color;
      g.font = '700 84px "Space Mono"';
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(label, w / 2, h / 2 + 4);
    });
  signTexOpen = sign("OUVERT", "#c9a84c");
  signTexClosed = sign("FERMÉ", "#d9d9e6");
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const std = (color, o = {}) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: o.rough ?? 0.82,
    metalness: o.metal ?? 0.04,
    emissive: o.emissive ?? 0x000000,
    emissiveIntensity: o.ei ?? 1,
    map: o.map ?? null,
    emissiveMap: o.emissiveMap ?? null,
    transparent: o.transparent ?? false,
    opacity: o.opacity ?? 1,
  });
function mesh(geo, mat, x = 0, y = 0, z = 0, parent = scene) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
const box = (w, h, d, mat, x, y, z, parent) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent);
const rbox = (w, h, d, r, mat, x, y, z, parent) => mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat, x, y, z, parent);
const glowMat = (hex, k) => new THREE.MeshBasicMaterial({ color: hdr(hex, k) });
function decal(size, hex, k, x, y, z) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({ map: glowTex, color: hdr(hex, k), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  scene.add(m);
  return m;
}

// ── World: island, plaza, street furniture ──────────────────────────────────
const slab = rbox(22, 1, 22, 0.35, std(0xffffff, { map: gridTex, rough: 0.95 }), 0, -0.5, 0);
slab.castShadow = false;
const rimMat = glowMat(C.indigo, 2.4);
[
  [22, 0.07, 0.07, 0, 0, 10.97],
  [22, 0.07, 0.07, 0, 0, -10.97],
  [0.07, 0.07, 22, 10.97, 0, 0],
  [0.07, 0.07, 22, -10.97, 0, 0],
].forEach(([w, h, d, x, y, z]) => (box(w, h, d, rimMat, x, y, z).castShadow = false));
// Plaza paving in front of the vitrine.
const paveM = std(0x2a2a38, { rough: 0.9 });
box(6.5, 0.06, 11, paveM, 4.6, 0.03, -0.6).castShadow = false;
box(11, 0.06, 3.2, paveM, -0.4, 0.03, 4.8).castShadow = false;
// Street with dashes.
const streetM = std(0x15151d);
box(2.6, 0.04, 22, streetM, 9.2, 0.02, 0).castShadow = false;
const dashM = std(0x6a6a88, { emissive: 0x6a6a88, ei: 0.05 });
for (let i = 0; i < 8; i++) box(0.12, 0.05, 1.2, dashM, 9.2, 0.05, -9 + i * 2.6).castShadow = false;
// Planters with soft bushes.
const planterM = std(0x3d3d55);
const bushM = std(C.sage, { rough: 0.95 });
[
  [6.6, -5.6],
  [6.6, 3.6],
  [-6.4, 6.6],
  [1.8, 7.4],
].forEach(([x, z]) => {
  rbox(1.3, 0.5, 1.3, 0.1, planterM, x, 0.25, z);
  mesh(new THREE.SphereGeometry(0.62, 18, 12), bushM, x, 0.85, z);
  mesh(new THREE.SphereGeometry(0.42, 16, 10), bushM, x + 0.35, 1.05, z - 0.25);
});
// Bench.
rbox(1.8, 0.14, 0.55, 0.05, std(0x5b4b2a), 6.5, 0.55, -1.0);
box(0.12, 0.5, 0.45, planterM, 5.8, 0.25, -1.0);
box(0.12, 0.5, 0.45, planterM, 7.2, 0.25, -1.0);
// Street lamps (off by day).
const lampMats = [];
const lampDecals = [];
[
  [7.6, -7.4],
  [7.6, 1.8],
  [3.8, 6.4],
  [-4.2, 6.4],
].forEach(([x, z]) => {
  mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.2, 8), std(0x2e2e40), x, 1.1, z);
  const m = new THREE.MeshBasicMaterial({ color: hdr(C.gold, 0.4) });
  mesh(new THREE.SphereGeometry(0.17, 14, 10), m, x, 2.25, z).castShadow = false;
  lampMats.push(m);
  lampDecals.push(decal(4.2, C.gold, 0.55, x, 0.07, z));
});

// ── The shop (cutaway) ──────────────────────────────────────────────────────
const SHOP = { x: -2.5, z: -1.2, w: 7, d: 6, h: 4.2 };
const shopG = new THREE.Group();
shopG.position.set(SHOP.x, 0, SHOP.z);
scene.add(shopG);
const hw = SHOP.w / 2;
const hd = SHOP.d / 2;
const wallOutM = std(C.wallOut);
const wallInM = std(C.wallIn);
const trimM = std(C.trim);
// Floor + plinth.
box(SHOP.w + 0.4, 0.2, SHOP.d + 0.4, trimM, 0, 0.1, 0, shopG);
const floor = box(SHOP.w - 0.2, 0.04, SHOP.d - 0.2, std(0xffffff, { map: plankTex }), 0, 0.22, 0, shopG);
floor.castShadow = false;
// Back wall (faces +z, seen through the cutaway) and left wall.
box(SHOP.w, SHOP.h, 0.28, wallInM, 0, SHOP.h / 2 + 0.2, -hd + 0.14, shopG);
box(0.28, SHOP.h, SHOP.d, wallInM, -hw + 0.14, SHOP.h / 2 + 0.2, 0, shopG);
// Outside skins of the back/left walls (rarely seen) + cut-edge trim on top.
box(SHOP.w + 0.06, 0.12, 0.34, trimM, 0, SHOP.h + 0.26, -hd + 0.14, shopG);
box(0.34, 0.12, SHOP.d + 0.06, trimM, -hw + 0.14, SHOP.h + 0.26, 0, shopG);
// Vitrine wall (+x): frame around the giant screen.
const VX = hw - 0.14;
box(0.3, SHOP.h, SHOP.d, wallOutM, VX, SHOP.h / 2 + 0.2, 0, shopG);
box(0.36, 0.12, SHOP.d + 0.06, trimM, VX, SHOP.h + 0.26, 0, shopG);
// Cut stub of the front (+z) wall: low, so the interior reads as a cutaway.
[
  [-3.5, -2.3],
  [-0.7, 0.4],
  [2.0, 3.5],
].forEach(([x0, x1]) => {
  box(x1 - x0, 0.55, 0.28, wallOutM, (x0 + x1) / 2, 0.47, hd - 0.14, shopG);
  box(x1 - x0 + 0.06, 0.08, 0.34, trimM, (x0 + x1) / 2, 0.78, hd - 0.14, shopG);
});
// The giant website screen.
const SCREEN = { w: 5.5, h: 3.06, y: 2.32 };
const screenMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN.w, SCREEN.h), screenMat);
screen.rotation.y = Math.PI / 2;
screen.position.set(VX + 0.2, SCREEN.y, 0);
shopG.add(screen);
const screenRim = box(0.06, SCREEN.h + 0.16, SCREEN.w + 0.16, glowMat(C.indigo, 1.2), VX + 0.13, SCREEN.y, 0, shopG);
screenRim.castShadow = false;
// Light spill from the vitrine onto the plaza (stronger at night).
const spill = decal(8.5, C.indigo, 0.9, SHOP.x + hw + 2.6, 0.07, SHOP.z);
spill.scale.set(0.75, 1.25, 1);

// Interior: ceiling lamps, agenda wall, client file, desks.
const lampOnMats = [];
[
  [-1.6, -0.6],
  [1.0, -0.6],
  [-1.6, 1.4],
  [1.0, 1.4],
].forEach(([x, z]) => {
  mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.9, 6), trimM, x, SHOP.h - 0.25, z, shopG).castShadow = false;
  const m = new THREE.MeshBasicMaterial({ color: hdr(0xffd9a0, 2.2) });
  const shade = mesh(new THREE.CylinderGeometry(0.12, 0.34, 0.26, 18, 1, true), std(0x2e2e40, { rough: 0.6 }), x, SHOP.h - 0.75, z, shopG);
  shade.material.side = THREE.DoubleSide;
  mesh(new THREE.SphereGeometry(0.12, 12, 8), m, x, SHOP.h - 0.86, z, shopG).castShadow = false;
  lampOnMats.push(m);
});
shopLight.position.set(SHOP.x - 0.3, SHOP.h - 0.8, SHOP.z + 0.4);

// Agenda board on the back wall: 5 days × 4 slots.
const BOARD = { x: -1.3, y: 2.62, w: 3.6, h: 2.39 };
const boardMesh = new THREE.Mesh(new THREE.PlaneGeometry(BOARD.w, BOARD.h), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }));
boardMesh.position.set(BOARD.x, BOARD.y, -hd + 0.29);
shopG.add(boardMesh);
const slots = [];
for (let c = 0; c < 5; c++) {
  for (let r = 0; r < 4; r++) {
    const u = (188 + c * 166 + 26) / 1024; // matches the board texture columns
    const v = (230 + r * 116) / 680;
    const m = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, emissive: C.gold, emissiveIntensity: 0, roughness: 0.5 });
    const s = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.3, 0.04, 2, 0.04), m);
    s.position.set(BOARD.x - BOARD.w / 2 + u * BOARD.w, BOARD.y + BOARD.h / 2 - v * BOARD.h, -hd + 0.31);
    shopG.add(s);
    slots.push({ c, r, mat: m, mesh: s, fill: Infinity });
  }
}
const slotAt = (c, r) => slots.find((s) => s.c === c && s.r === r);
[
  [0, 0],
  [2, 1],
  [3, 3],
  [4, 0],
  [0, 3],
].forEach(([c, r]) => (slotAt(c, r).fill = -1));

// Client file (cabinet against the left wall) with a growing stack of cards.
const cabG = new THREE.Group();
cabG.position.set(-hw + 0.75, 0.22, -0.4);
shopG.add(cabG);
rbox(0.9, 1.5, 1.4, 0.05, std(0x3a3a52), 0, 0.75, 0, cabG);
const drawerMats = [];
[0.35, 0.8, 1.25].forEach((y) => {
  const m = std(0x464662, { emissive: C.indigo, ei: 0 });
  rbox(0.06, 0.36, 1.2, 0.03, m, 0.47, y, 0, cabG);
  drawerMats.push(m);
});
const stackMat = std(0xe6e2f5, { emissive: C.indigo, ei: 0.15 });
const stack = rbox(0.6, 0.3, 0.8, 0.04, stackMat, 0, 1.65, 0, cabG);
stack.geometry.translate(0, 0.15, 0);
stack.position.y = 1.5;

// Desks (commercial on the left, support on the right) with seated staff by day.
const deskM = std(0x5b4b2a, { rough: 0.7 });
const DESKS = [
  { key: "commercial", x: -1.5, z: 1.2 },
  { key: "sav", x: 1.2, z: 1.3 },
];
DESKS.forEach((d) => {
  const g = new THREE.Group();
  g.position.set(d.x, 0.22, d.z);
  shopG.add(g);
  rbox(1.5, 0.08, 0.8, 0.03, deskM, 0, 0.78, 0, g);
  [-0.65, 0.65].forEach((x) => box(0.06, 0.74, 0.7, std(0x2e2e40), x, 0.37, 0, g));
  box(0.62, 0.4, 0.04, std(0x22222e), 0, 1.12, -0.25, g);
  d.monMat = new THREE.MeshBasicMaterial({ color: hdr(C.indigo, 0.9) });
  const mon = mesh(new THREE.PlaneGeometry(0.54, 0.32), d.monMat, 0, 1.12, -0.225, g);
  mon.castShadow = false;
  d.pipMat = new THREE.MeshBasicMaterial({ color: hdr(C.violet, 0), transparent: true, opacity: 0 });
  d.pip = mesh(new THREE.SphereGeometry(0.1, 12, 8), d.pipMat, 0.45, 1.05, 0.15, g);
  d.pip.castShadow = false;
  d.group = g;
  d.world = new THREE.Vector3(SHOP.x + d.x, 0.22 + 0.86, SHOP.z + d.z);
});

// Open / closed sign on a post beside the vitrine.
const signG = new THREE.Group();
signG.position.set(SHOP.x + hw + 0.9, 0, SHOP.z + hd + 0.2);
scene.add(signG);
mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.9, 8), std(0x2e2e40), 0, 0.95, 0, signG);
const signPivot = new THREE.Group();
signPivot.position.y = 2.0;
signG.add(signPivot);
const signFront = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.6), new THREE.MeshStandardMaterial({ emissive: 0xffffff, emissiveIntensity: 0.9 }));
const signBack = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.6), new THREE.MeshStandardMaterial({ emissive: 0xffffff, emissiveIntensity: 0.9 }));
signFront.position.z = 0.02;
signBack.position.z = -0.02;
signBack.rotation.y = Math.PI;
signPivot.add(signFront, signBack);
box(1.46, 0.66, 0.03, std(0x2e2e40), 0, 0, 0, signPivot);

scene.updateMatrixWorld(true);

// Day / night tones for the large surfaces (texture bases are light; colour sets the tone).
const TONES = [
  [slab.material, 0xb3b6c8, 0x262633],
  [paveM, 0xd0d2de, 0x2c2c3a],
  [wallOutM, 0xe2dfea, 0x34344a],
  [wallInM, 0xd6d3e2, 0x3a3a52],
  [trimM, 0xf4f2f8, 0x5a5a78],
  [planterM, 0xa9abbf, 0x3d3d55],
  [floor.material, 0xd9c6a4, 0x3a3446],
  [deskM, 0xb8996a, 0x5b4b2a],
  [streetM, 0x5d5f73, 0x15151d],
].map(([m, day, night]) => ({ m, day: col(day), night: col(night) }));

// ── People ──────────────────────────────────────────────────────────────────
const SKIN = [0xe8c4a2, 0xb7835f, 0x8a5a3c, 0xf1d3b8];
const CLOTH = [0xe8e2d0, 0xc9a84c, 0x6b6f9a, 0xc98aa9, 0x3d3d55, 0x9aa0c8];
function person(i) {
  const g = new THREE.Group();
  const bodyM = std(CLOTH[i % CLOTH.length], { rough: 0.8 });
  const body = mesh(new THREE.CapsuleGeometry(0.24, 0.55, 6, 14), bodyM, 0, 0.62, 0, g);
  const legM = std(0x24243a);
  mesh(new THREE.CapsuleGeometry(0.1, 0.32, 4, 8), legM, 0.09, 0.22, 0, g);
  mesh(new THREE.CapsuleGeometry(0.1, 0.32, 4, 8), legM, -0.09, 0.22, 0, g);
  mesh(new THREE.SphereGeometry(0.21, 16, 12), std(SKIN[i % SKIN.length], { rough: 0.7 }), 0, 1.25, 0, g);
  const hair = mesh(new THREE.SphereGeometry(0.22, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), std(i % 3 === 0 ? 0x2a2018 : i % 3 === 1 ? 0x5b3b22 : 0x16161e), 0, 1.28, 0, g);
  hair.rotation.x = -0.25;
  scene.add(g);
  g.visible = false;
  return { g, body };
}
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
// Paths are polylines on the ground; `at` = arrival time at the stand point, `leave` = start of exit.
const STAND_X = SHOP.x + hw + 1.6; // 2.6
const VISITORS = [
  { id: "v1", path: [v3(10.5, 0, 7.5), v3(2.8, 0, 4.6)], start: 3.3, at: 4.7, leave: 13.8, exit: [v3(2.8, 0, 4.6), v3(4.5, 0, 11)] },
  { id: "v2", path: [v3(6.0, 0, -11), v3(2.6, 0, -5.0)], start: 3.5, at: 4.9, leave: 14.1, exit: [v3(2.6, 0, -5.0), v3(10, 0, -7)] },
  { id: "v3", path: [v3(11, 0, -3), v3(7.0, 0, -1.4)], start: 3.6, at: 5.0, leave: 13.6, exit: [v3(7.0, 0, -1.4), v3(11, 0, 2)] },
  { id: "v4", path: [v3(-3, 0, 11), v3(-1.2, 0, 6.6)], start: 3.9, at: 5.0, leave: 14.3, exit: [v3(-1.2, 0, 6.6), v3(-6, 0, 11)] },
  { id: "v5", path: [v3(-11, 0, 7.5), v3(-3.6, 0, 5.4)], start: 4.1, at: 5.4, leave: 14.5, exit: [v3(-3.6, 0, 5.4), v3(-11, 0, 4)] },
  { id: "v6", path: [v3(11, 0, 9), v3(8.0, 0, 3.2)], start: 4.4, at: 5.7, leave: 14.0, exit: [v3(8.0, 0, 3.2), v3(11, 0, 9)] },
  // Night passer-by with a phone.
  { id: "n1", path: [v3(10, 0, -9), v3(STAND_X + 0.6, 0, -1.4)], start: 16.2, at: 17.2, leave: 99, exit: [v3(0, 0, 0)], phone: true },
];
VISITORS.forEach((v, i) => {
  Object.assign(v, person(i + 1));
  if (v.phone) {
    v.phoneMat = new THREE.MeshBasicMaterial({ color: hdr(C.indigo, 2.2) });
    mesh(new THREE.BoxGeometry(0.14, 0.22, 0.03), v.phoneMat, 0.18, 1.0, 0.22, v.g).castShadow = false;
  }
});
const STAFF = DESKS.map((d, i) => {
  const p = person(i === 0 ? 2 : 4);
  const seat = v3(SHOP.x + d.x, 0.22, SHOP.z + d.z + 0.7);
  return {
    ...p,
    seat,
    exitPath: [seat.clone(), v3(SHOP.x + d.x, 0.22, SHOP.z + hd + 1.4), v3(SHOP.x + d.x - 2, 0, 11)],
    leave: 14.6 + i * 0.35,
  };
});
function polyAt(path, p, out) {
  const segs = [];
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const l = path[i].distanceTo(path[i - 1]);
    segs.push(l);
    total += l;
  }
  let d = p * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      out.lerpVectors(path[i], path[i + 1], segs[i] ? clamp01(d / segs[i]) : 1);
      return path[i + 1].clone().sub(path[i]);
    }
    d -= segs[i];
  }
  return v3(1, 0, 0);
}
const tmp = new THREE.Vector3();
function poseWalker(p, t, path, t0, t1, faceDefault) {
  const k = prog(t, t0, t1);
  const dir = polyAt(path, ease("power1.inOut")(k), tmp);
  p.g.position.copy(tmp);
  const moving = t > t0 && t < t1;
  p.g.position.y += moving ? Math.abs(Math.sin(t * 11)) * 0.07 : 0;
  p.g.rotation.y = moving ? Math.atan2(dir.x, dir.z) : faceDefault;
  p.body.rotation.z = moving ? Math.sin(t * 11) * 0.05 : 0;
}

// ── The chatbot (hero prop) ─────────────────────────────────────────────────
const BOT_LOCAL = v3(VX + 0.75, 1.55, -1.85);
const BOT = BOT_LOCAL.clone().add(v3(SHOP.x, 0, SHOP.z));
const botG = new THREE.Group();
botG.position.copy(BOT);
botG.rotation.y = Math.PI / 4;
scene.add(botG);
const botMat = std(0x1b1530, { emissive: C.indigo, ei: 2.2, rough: 0.25 });
const bot = mesh(new THREE.SphereGeometry(0.55, 40, 28), botMat, 0, 0, 0, botG);
bot.castShadow = false;
const botShell = new THREE.Mesh(
  new THREE.SphereGeometry(0.72, 40, 28),
  new THREE.MeshBasicMaterial({ color: hdr(C.violet, 1.2), transparent: true, opacity: 0.18, depthWrite: false }),
);
botG.add(botShell);
const eyeM = new THREE.MeshBasicMaterial({ color: 0x14102a });
const eyes = [-0.18, 0.18].map((x) => {
  const e = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), eyeM);
  e.position.set(x, 0.08, 0.5);
  e.scale.set(1, 1.6, 0.6);
  botG.add(e);
  return e;
});
const botLight = new THREE.PointLight(C.indigo, 2.5, 6, 1.8);
botG.add(botLight);

// ── Beams (chatbot → visitor), tokens (reply → interior station) ───────────
const HEAD = (v) => v.g.position.clone().add(v3(0, 1.45, 0));
const beams = [];
function addBeam(target, t0) {
  const start = BOT.clone();
  const end = target.clone();
  const mid = start.clone().lerp(end, 0.5).add(v3(0, 1.6, 0));
  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  const geo = new THREE.TubeGeometry(curve, 48, 0.035, 6, false);
  const mat = new THREE.MeshBasicMaterial({ color: hdr(C.indigo, 2.6), transparent: true, opacity: 1, depthWrite: false });
  const m = new THREE.Mesh(geo, mat);
  m.visible = false;
  scene.add(m);
  beams.push({ m, mat, t0, total: geo.index.count, curve });
}
const tokenGeo = new RoundedBoxGeometry(0.62, 0.1, 0.46, 2, 0.04);
const TOKEN_COL = { calendar: C.gold, contact: C.indigo, ticket: C.violet };
const tokens = [];
function addToken(type, from, to, t0, dur, onLand) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(tokenGeo, std(0x1a1a24, { emissive: TOKEN_COL[type], ei: 2.0, rough: 0.4 }));
  g.add(m);
  const icon = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.38), new THREE.MeshBasicMaterial({ map: tokenIconTex(type), transparent: true, depthWrite: false }));
  icon.rotation.x = -Math.PI / 2;
  icon.position.y = 0.055;
  g.add(icon);
  g.visible = false;
  scene.add(g);
  const apex = Math.max(from.y, to.y) + 2.6;
  const ctrl = from.clone().lerp(to, 0.5).setY(apex);
  tokens.push({ g, curve: new THREE.QuadraticBezierCurve3(from.clone(), ctrl, to.clone()), t0, dur, land: t0 + dur, onLand, type });
}
const slotWorld = (c, r) => slotAt(c, r).mesh.getWorldPosition(new THREE.Vector3()).add(v3(0, 0, 0.12));
const fileWorld = () => v3(SHOP.x - hw + 0.75, 1.95, SHOP.z - 0.4);
const deskWorld = (k) => DESKS.find((d) => d.key === k).world.clone();

// ── Script: who asks what, when (labels live in the HTML overlay) ───────────
// Day — three labelled questions, three unlabelled ones, all answered in the same beat.
const ASK = 5.05;
const ANSWER = 6.15;
const COLLAPSE = 7.25;
const vis = Object.fromEntries(VISITORS.map((v) => [v.id, v]));
function standHead(v) {
  return v.path[v.path.length - 1].clone().add(v3(0, 1.45, 0));
}
["v1", "v2", "v3", "v4", "v5", "v6"].forEach((id) => addBeam(standHead(vis[id]), ANSWER + (id === "v4" || id === "v6" ? 0.25 : 0)));
// Tokens leaving the replies (the RDV of v3 waits for the close-up).
addToken("contact", standHead(vis.v2).add(v3(0, 0.9, 0)), fileWorld(), COLLAPSE, 1.05, "file");
addToken("calendar", standHead(vis.v4).add(v3(0, 0.6, 0)), slotWorld(3, 1), COLLAPSE + 0.15, 1.1, "slot:3:1");
addToken("contact", standHead(vis.v5).add(v3(0, 0.6, 0)), fileWorld(), COLLAPSE + 0.3, 1.0, "file");
addToken("ticket", standHead(vis.v6).add(v3(0, 0.6, 0)), deskWorld("sav"), COLLAPSE + 0.2, 1.1, "desk:sav");
// Close-up RDV: the confirmation leaves the vitrine for the agenda (camera follows).
const RDV_T0 = 12.42;
addToken("calendar", BOT.clone().add(v3(0.4, 1.4, 0.6)), slotWorld(1, 2), RDV_T0, 1.0, "slot:1:2");
// Night — a passer-by and online messages.
const ONLINE = [
  { from: v3(14, 9, 9), t0: 16.7 },
  { from: v3(12, 10, -12), t0: 16.95 },
  { from: v3(-6, 11, 13), t0: 17.25 },
];
const onlineDots = ONLINE.map((o) => {
  const m = mesh(new THREE.SphereGeometry(0.16, 14, 10), glowMat(C.violet, 2.8), 0, 0, 0);
  m.castShadow = false;
  m.visible = false;
  return { ...o, m, to: BOT.clone().add(v3(0.3, 0.9, 0.2)) };
});
const NIGHT_ANSWER = 18.0;
addBeam(standHead(vis.n1), NIGHT_ANSWER);
addToken("contact", standHead(vis.n1).add(v3(0, 0.7, 0)), fileWorld(), 18.65, 1.0, "file");
addToken("ticket", BOT.clone().add(v3(0.2, 1.2, 0.4)), deskWorld("commercial"), 18.85, 1.05, "desk:commercial");
addToken("contact", BOT.clone().add(v3(0.2, 1.4, -0.4)), fileWorld(), 19.05, 1.0, "file");
// Landings resolve into station state.
tokens.forEach((tk) => {
  if (tk.onLand.startsWith("slot:")) {
    const [, c, r] = tk.onLand.split(":").map(Number);
    slotAt(c, r).fill = tk.land;
  }
});
const fileLandings = tokens.filter((tk) => tk.onLand === "file").map((tk) => tk.land);
const deskLandings = (k) => tokens.filter((tk) => tk.onLand === "desk:" + k).map((tk) => tk.land);

// ── Day / night cycle ───────────────────────────────────────────────────────
const SUNRISE = [1.0, 3.4];
const SUNSET = [13.2, 16.3];
function daylight(t) {
  return smooth(t, SUNRISE[0], SUNRISE[1]) * (1 - smooth(t, SUNSET[0], SUNSET[1]));
}
function duskGlow(t) {
  return bell(t, 0.8, 2.0, 3.3) * 0.55 + bell(t, 13.2, 14.8, 16.4);
}
const SKY_NIGHT = col(0x0c0c0c);
const SKY_DAY = col(0xc4c7d8);
const SKY_DUSK = col(0x7d4f63);
const bgCol = new THREE.Color();
const warm = col(0xffb27a);
const white = col(0xfff1dc);

// ── Camera journey ──────────────────────────────────────────────────────────
const EL = (35.264 * Math.PI) / 180;
const P = (x, y, z) => new THREE.Vector3(x, y, z);
const WIDE = P(0.6, 1.4, -0.4);
const SCREEN_W = P(SHOP.x + VX + 0.2, SCREEN.y, SHOP.z);
const CHAT_PT = P(SHOP.x + VX + 0.2, 2.2, SHOP.z - 0.9);
const KEYS = [
  { t: 0.0, tg: BOT.clone(), z: 8.5, az: 45 },
  { t: 0.45, tg: BOT.clone(), z: 8.5, az: 45 },
  { t: 3.3, tg: WIDE, z: 1.48, az: 44, e: "power4.out" },
  { t: 8.95, tg: P(0.9, 1.5, -0.3), z: 1.62, az: 41, e: "sine.inOut" },
  { t: 9.65, tg: CHAT_PT, z: 3.6, az: 43, e: "power3.inOut" },
  { t: 12.35, tg: CHAT_PT, z: 3.75, az: 44, e: "sine.inOut" },
  { t: 13.35, tg: slotWorld(1, 2).add(P(0.4, -0.3, 0.6)), z: 3.0, az: 26, e: "power2.inOut" },
  { t: 13.75, tg: slotWorld(1, 2).add(P(0.4, -0.3, 0.6)), z: 3.05, az: 25, e: "sine.inOut" },
  { t: 14.7, tg: WIDE, z: 1.38, az: 47, e: "power2.inOut" },
  { t: 19.3, tg: P(0.9, 1.5, -0.4), z: 1.62, az: 50, e: "sine.inOut" },
  { t: 19.95, tg: CHAT_PT, z: 3.6, az: 47, e: "power3.inOut" },
  { t: 22.25, tg: CHAT_PT, z: 3.75, az: 46, e: "sine.inOut" },
  { t: 23.0, tg: BOT.clone(), z: 1.25, az: 46, e: "power2.inOut" },
  { t: 23.6, tg: BOT.clone(), z: 0.75, az: 48, e: "power2.in" },
];
const camTarget = new THREE.Vector3();
function cameraAt(t) {
  let i = 0;
  while (i < KEYS.length - 1 && t >= KEYS[i + 1].t) i++;
  const a = KEYS[i];
  const b = KEYS[Math.min(i + 1, KEYS.length - 1)];
  const p = b === a ? 0 : ease(b.e || "none")(prog(t, a.t, b.t));
  camTarget.lerpVectors(a.tg, b.tg, p);
  let zoom = lerp(a.z, b.z, p);
  const az = lerp(a.az, b.az, p);
  const dAmp = 0.1 / zoom;
  camTarget.x += Math.sin(t * 0.71) * dAmp;
  camTarget.z += Math.cos(t * 0.53) * dAmp;
  zoom *= 1 + Math.sin(t * 0.37) * 0.005;
  const azr = (az * Math.PI) / 180;
  const dir = tmp.set(Math.cos(EL) * Math.sin(azr), Math.sin(EL), Math.cos(EL) * Math.cos(azr));
  camera.position.copy(camTarget).addScaledVector(dir, 120);
  camera.up.set(0, 1, 0);
  camera.lookAt(camTarget);
  camera.zoom = zoom;
  camera.updateProjectionMatrix();
}

// ── HTML overlays (bubbles anchored to 3D heads) + HUD ──────────────────────
const $ = (id) => document.getElementById(id);
const proj = new THREE.Vector3();
function toScreen(p) {
  proj.copy(p).project(camera);
  return { x: (proj.x + 1) * 0.5 * W, y: (1 - proj.y) * 0.5 * H };
}
// Bubble choreography: [elementId, visitorId|null, show, hide, stackOffsetPx, anchorOverride]
const BUBBLES = [
  ["shop-q1", "v1", ASK, COLLAPSE + 0.6, 64],
  ["shop-r1", "v1", ANSWER + 0.2, COLLAPSE + 0.6, 0],
  ["shop-q2", "v2", ASK + 0.3, COLLAPSE, 64],
  ["shop-r2", "v2", ANSWER + 0.2, COLLAPSE, 0],
  ["shop-q3", "v3", ASK + 0.6, 9.3, 64],
  ["shop-r3", "v3", ANSWER + 0.2, 9.3, 0],
  ["shop-q4", "n1", 17.35, 18.65, 64],
  ["shop-r4", "n1", NIGHT_ANSWER + 0.2, 18.65, 0],
  ["shop-q5", null, 17.6, 19.05, 64, BOT.clone().add(v3(0.2, 2.1, -0.2))],
  ["shop-r5", null, NIGHT_ANSWER + 0.25, 19.05, 0, BOT.clone().add(v3(0.2, 2.1, -0.2))],
].map(([id, vid, show, hide, lift, anchor]) => ({ el: $(id), vid, show, hide, lift, anchor }));
const PIPS = ["v4", "v5", "v6"].map((id, i) => ({ el: $("shop-p" + (i + 1)), vid: id, show: ASK + 0.15 + i * 0.2, hide: COLLAPSE + 0.15 + i * 0.12 }));
const backOut = ease("back.out(1.7)");
function placeBubble(b, t, closeFade) {
  const visible = t >= b.show && t < b.hide + 0.25;
  if (!visible) {
    b.el.style.opacity = "0";
    return;
  }
  const anchor = b.anchor ? b.anchor : HEAD(vis[b.vid]).add(v3(0, 0.55, 0));
  const s = toScreen(anchor);
  const pin = backOut(prog(t, b.show, b.show + 0.35));
  const pout = prog(t, b.hide, b.hide + 0.25);
  const scale = Math.max(0.001, pin * (1 - pout * 0.6));
  b.el.style.opacity = String(clamp01(prog(t, b.show, b.show + 0.12)) * (1 - pout) * closeFade);
  b.el.style.transform = `translate(${s.x.toFixed(1)}px, ${(s.y - b.lift).toFixed(1)}px) translate(-50%, -100%) scale(${scale.toFixed(3)})`;
}
const clockEl = $("shop-clock-time");
const sunIcon = $("shop-clock-sun");
const moonIcon = $("shop-clock-moon");
const convEl = $("shop-count-conv");
const rdvEl = $("shop-count-rdv");
const hudEl = $("shop-hud");
const countersEl = $("shop-counters");
const CLOCK = [
  [0, 418],
  [1.0, 430],
  [3.3, 540],
  [9.0, 900],
  [12.5, 1080],
  [13.2, 1110],
  [15.5, 1260],
  [16.5, 1320],
  [19.4, 1420],
  [19.9, 1427],
  [22.4, 1428],
  [23.6, 1431],
];
const CONV = [
  [6.2, 0],
  [9.0, 38],
  [12.5, 241],
  [16.5, 613],
  [19.5, 982],
  [22.6, 1284],
];
const RDV = [
  [6.2, 0],
  [9.0, 3],
  [12.5, 24],
  [16.5, 51],
  [19.5, 78],
  [22.6, 96],
];
const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
function hudAt(t) {
  const m = Math.round(pw(t, CLOCK));
  const hh = String(Math.floor(m / 60) % 24).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  clockEl.textContent = `${hh}:${mm}`;
  const isDay = m >= 450 && m < 1230;
  sunIcon.style.opacity = isDay ? "1" : "0";
  moonIcon.style.opacity = isDay ? "0" : "1";
  convEl.textContent = fmt(pw(t, CONV));
  rdvEl.textContent = fmt(pw(t, RDV));
  hudEl.style.opacity = String(smooth(t, 0.6, 1.2) * (1 - smooth(t, 23.1, 23.4)));
  countersEl.style.opacity = String(smooth(t, 5.9, 6.4));
  countersEl.style.transform = `translateY(${((1 - ease("power3.out")(prog(t, 5.9, 6.5))) * -16).toFixed(1)}px)`;
}

// ── Scene state at time t ───────────────────────────────────────────────────
const pos = new THREE.Vector3();
const gold = col(C.gold);
const indigo = col(C.indigo);
function renderAt(t) {
  // Day / night.
  const d = daylight(t);
  const du = duskGlow(t);
  // The sky runs slightly ahead of the light so night has fully fallen when the lamps come on.
  const dSky = smooth(t, 1.0, 3.0) * (1 - smooth(t, 13.0, 15.5));
  const duSky = bell(t, 0.7, 1.7, 2.9) * 0.5 + bell(t, 12.9, 14.3, 15.9);
  bgCol.copy(SKY_NIGHT).lerp(SKY_DAY, dSky).lerp(SKY_DUSK, duSky * 0.7);
  renderer.setClearColor(bgCol, 1);
  const a = Math.PI * pw(t, [
    [SUNRISE[0], 0.02],
    [SUNSET[1], 0.98],
  ]);
  sun.position.set(18 * Math.cos(a), 3 + 22 * Math.sin(a), 8 + 2.4 * Math.cos(a));
  sun.target.position.set(0, 0, 0);
  sun.intensity = 2.6 * Math.max(d, du * 0.6);
  sun.color.copy(white).lerp(warm, clamp01(du * 1.2));
  moon.intensity = 0.45 * (1 - d);
  hemi.intensity = 0.38 + 0.95 * d + du * 0.15;
  hemi.color.set(0x4a4f8a).lerp(col(0xcdd3ff), d);
  bloom.strength = 0.22 + 0.4 * (1 - d);
  bloom.threshold = 0.72 + 0.9 * d;
  for (const tn of TONES) tn.m.color.copy(tn.night).lerp(tn.day, d * 0.92 + du * 0.08);
  screenMat.color.setScalar(1 + 0.18 * (1 - d));
  const night = 1 - d;
  rimMat.color.copy(indigo).multiplyScalar(0.4 + 2.0 * night);
  const lampsOn = smooth(t, 15.2, 15.8) + (1 - smooth(t, 2.2, 2.8)) * (t < 5 ? 1 : 0);
  lampMats.forEach((m, i) => m.color.copy(gold).multiplyScalar(0.3 + 3.0 * clamp01(lampsOn * 1.4 - i * 0.1)));
  lampDecals.forEach((m) => (m.material.opacity = lampsOn * 0.9));
  spill.material.opacity = 0.25 + 0.75 * night;

  // Shop open / closed: interior lamps, sign, staff, monitors.
  const open = smooth(t, 2.7, 3.1) * (1 - smooth(t, 15.6, 15.9));
  lampOnMats.forEach((m, i) => {
    const on = smooth(t, 2.7 + i * 0.08, 2.9 + i * 0.08) * (1 - smooth(t, 15.6 + i * 0.12, 15.7 + i * 0.12));
    m.color.set(0xffd9a0).multiplyScalar(0.15 + 2.3 * on);
  });
  shopLight.intensity = 9 * open;
  const flip = ease("back.out(1.4)")(prog(t, 3.0, 3.45)) - ease("back.out(1.4)")(prog(t, 15.75, 16.2));
  signPivot.rotation.y = Math.PI * (1 - flip) + Math.PI / 4;
  if (signTexOpen) {
    signFront.material.emissiveMap = signTexOpen;
    signFront.material.map = signTexOpen;
    signBack.material.emissiveMap = signTexClosed;
    signBack.material.map = signTexClosed;
  }
  DESKS.forEach((dk) => {
    dk.monMat.color.copy(indigo).multiplyScalar(0.15 + 1.0 * open);
    let pip = 0;
    for (const l of deskLandings(dk.key)) if (t >= l) pip = Math.max(pip, 0.6 + 0.4 * Math.sin((t - l) * 5));
    dk.pipMat.opacity = pip;
    dk.pipMat.color.copy(col(C.violet)).multiplyScalar(2.4 * pip);
  });
  STAFF.forEach((s) => {
    s.g.visible = t >= 2.9 && t < s.leave + 2.2;
    if (t < s.leave) {
      s.g.position.copy(s.seat).add(v3(0, -0.12, 0));
      s.g.rotation.y = Math.PI;
      s.body.rotation.z = Math.sin(t * 1.3 + s.seat.x) * 0.04;
    } else poseWalker(s, t, s.exitPath, s.leave, s.leave + 2.2, 0);
  });

  // Visitors.
  VISITORS.forEach((v) => {
    v.g.visible = t >= v.start && t < v.leave + 2.4;
    if (!v.g.visible) return;
    if (t < v.leave) poseWalker(v, t, v.path, v.start, v.at, -Math.PI / 2 - 0.3);
    else poseWalker(v, t, v.exit, v.leave, v.leave + 2.4, 0);
    if (t >= v.at && t < v.leave) v.g.rotation.y = Math.atan2(BOT.x - v.g.position.x, BOT.z - v.g.position.z);
    if (v.phoneMat) v.phoneMat.color.copy(indigo).multiplyScalar(1.4 + 0.8 * Math.sin(t * 6));
  });

  // Chatbot: idle bob, blinks, a squash on each answer, glow stronger at night.
  const answerPulse = bell(t, ANSWER - 0.12, ANSWER + 0.05, ANSWER + 0.5) + bell(t, NIGHT_ANSWER - 0.12, NIGHT_ANSWER + 0.05, NIGHT_ANSWER + 0.5);
  const bob = Math.sin(t * 2.2) * 0.07;
  botG.position.set(BOT.x, BOT.y + bob, BOT.z);
  const sq = 1 + answerPulse * 0.18;
  bot.scale.set(sq, 1 / Math.sqrt(sq), sq);
  botShell.scale.setScalar(1 + answerPulse * 0.35 + Math.sin(t * 3) * 0.03);
  botMat.emissiveIntensity = 1.5 + 0.45 * night + answerPulse * 0.8;
  botLight.intensity = 1.2 + 1.6 * night;
  const BLINKS = [0.75, 1.0, 4.2, 8.1, 11.0, 15.2, 18.8, 21.4];
  let lid = 1;
  for (const bt of BLINKS) lid = Math.min(lid, 1 - bell(t, bt - 0.06, bt, bt + 0.08) * 0.92);
  // Wake-up at the very start: eyes open from shut.
  lid *= 0.08 + 0.92 * smooth(t, 0.35, 0.6);
  eyes.forEach((e) => (e.scale.y = 1.6 * Math.max(0.06, lid)));

  // Beams.
  for (const b of beams) {
    const k = prog(t, b.t0, b.t0 + 0.28);
    const fade = 1 - prog(t, b.t0 + 0.7, b.t0 + 1.1);
    b.m.visible = k > 0 && fade > 0;
    b.m.geometry.setDrawRange(0, Math.floor((ease("power2.out")(k) * b.total) / 3) * 3);
    b.mat.opacity = fade;
  }
  // Online message dots (night).
  for (const o of onlineDots) {
    const k = prog(t, o.t0, o.t0 + 0.9);
    o.m.visible = k > 0 && k < 1;
    o.m.position.lerpVectors(o.from, o.to, ease("power2.in")(k));
  }
  // Tokens.
  for (const tk of tokens) {
    const k = prog(t, tk.t0, tk.land);
    tk.g.visible = t >= tk.t0 && t < tk.land + 0.15;
    if (!tk.g.visible) continue;
    tk.curve.getPoint(ease("power1.inOut")(k), tk.g.position);
    const s = smooth(t, tk.t0, tk.t0 + 0.15) * (1 - prog(t, tk.land, tk.land + 0.15));
    tk.g.scale.setScalar(Math.max(0.001, s));
    tk.g.rotation.set(0, t * 2.2, Math.sin(k * Math.PI) * 0.35);
  }
  // Stations: agenda slots, file stack + drawers.
  for (const s of slots) {
    const f = s.fill === -1 ? 0.55 : t >= s.fill ? 0.55 + 2.4 * Math.exp(-(t - s.fill) * 2.2) : 0;
    s.mat.emissiveIntensity = f;
    s.mat.color.set(f > 0 ? 0x3a3220 : 0x2a2a3a);
  }
  let filed = 0;
  let drawerPulse = 0;
  for (const l of fileLandings) {
    if (t >= l) {
      filed++;
      drawerPulse += Math.exp(-(t - l) * 3);
    }
  }
  stack.scale.y = 1 + filed * 0.35;
  stackMat.emissiveIntensity = 0.12 + Math.min(1, drawerPulse) * 1.6;
  drawerMats.forEach((m, i) => (m.emissiveIntensity = Math.min(1, drawerPulse) * (i === 0 ? 2.2 : 0.6)));

  cameraAt(t);

  // Overlays after the camera so anchors are this frame's projection.
  const closeFade = 1 - Math.max(smooth(t, 9.1, 9.5) * (1 - smooth(t, 13.9, 14.3)), smooth(t, 19.4, 19.75));
  BUBBLES.forEach((b) => placeBubble(b, t, closeFade));
  PIPS.forEach((p) => placeBubble({ ...p, lift: 0 }, t, closeFade));
  hudAt(t);

  composer.render();
}

// ── Boot: wait for fonts, draw text textures, first frame ───────────────────
async function boot() {
  try {
    await Promise.all([
      document.fonts.load('800 118px "Outfit"'),
      document.fonts.load('700 46px "Outfit"'),
      document.fonts.load('400 40px "Outfit"'),
      document.fonts.load('600 30px "Outfit"'),
      document.fonts.load('700 34px "Space Mono"'),
      document.fonts.load('400 26px "Space Mono"'),
    ]);
  } catch (e) {
    void e;
  }
  drawSite();
  screenMat.map = siteTex;
  screenMat.needsUpdate = true;
  boardMesh.material.map = boardTex;
  boardMesh.material.needsUpdate = true;
  signFront.material.needsUpdate = true;
  signBack.material.needsUpdate = true;
  window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
  renderAt(window.__hfThreeTime || 0);
  if (window.__altiarcShopReady) window.__altiarcShopReady();
}
window.__altiarcShop = { BOT, toScreen };
boot();
