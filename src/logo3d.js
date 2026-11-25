import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/* Rounded-rect shape centred on origin */
function squircle(size, r) {
  const s = new THREE.Shape();
  const h = size / 2;
  s.moveTo(-h + r, -h);
  s.lineTo(h - r, -h);
  s.quadraticCurveTo(h, -h, h, -h + r);
  s.lineTo(h, h - r);
  s.quadraticCurveTo(h, h, h - r, h);
  s.lineTo(-h + r, h);
  s.quadraticCurveTo(-h, h, -h, h - r);
  s.lineTo(-h, -h + r);
  s.quadraticCurveTo(-h, -h, -h + r, -h);
  return s;
}

const lerp = (a, b, t) => a + (b - a) * t;

export function createLogo(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.45;

  const FOV = 30;
  const CAM_Z = 12;
  const camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, CAM_Z);

  /* lights */
  scene.add(new THREE.AmbientLight(0xfff4e0, 0.35));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(-4, 6, 9);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -8; key.shadow.camera.right = 8;
  key.shadow.camera.top = 8; key.shadow.camera.bottom = -8;
  key.shadow.camera.near = 1; key.shadow.camera.far = 30;
  key.shadow.radius = 10;
  key.shadow.bias = -0.0005;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffd27a, 1.1);
  rim.position.set(6, -2, 4);
  scene.add(rim);

  /* paper shadow catcher */
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.ShadowMaterial({ color: 0x1e1b16, opacity: 0.12 })
  );
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  /* ── the mark ── (overall front width ≈ 1 unit) */
  const RIM_SIZE = 0.9, RIM_R = 0.27, RIM_DEPTH = 0.26, RIM_BEVEL = 0.05;
  const rimGeo = new THREE.ExtrudeGeometry(squircle(RIM_SIZE, RIM_R), {
    depth: RIM_DEPTH, bevelEnabled: true, bevelThickness: RIM_BEVEL, bevelSize: RIM_BEVEL, bevelSegments: 10, curveSegments: 24,
  });
  rimGeo.translate(0, 0, -RIM_DEPTH / 2);
  const ink = new THREE.MeshPhysicalMaterial({ color: 0x1e1b16, roughness: 0.45, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.3 });
  const amber = new THREE.MeshPhysicalMaterial({ color: 0xf2a000, roughness: 0.38, metalness: 0, clearcoat: 0.7, clearcoatRoughness: 0.2 });

  const FACE_SIZE = 0.72, FACE_R = 0.19, FACE_DEPTH = 0.04, FACE_BEVEL = 0.035;
  const faceGeo = new THREE.ExtrudeGeometry(squircle(FACE_SIZE, FACE_R), {
    depth: FACE_DEPTH, bevelEnabled: true, bevelThickness: FACE_BEVEL, bevelSize: FACE_BEVEL, bevelSegments: 8, curveSegments: 24,
  });
  const faceZ = RIM_DEPTH / 2 + RIM_BEVEL - 0.03;
  faceGeo.translate(0, 0, faceZ);

  const body = new THREE.Group();
  const rimMesh = new THREE.Mesh(rimGeo, ink);
  const faceMesh = new THREE.Mesh(faceGeo, amber);
  rimMesh.castShadow = faceMesh.castShadow = true;
  body.add(rimMesh, faceMesh);

  const dots = [];
  const dotGeo = new THREE.SphereGeometry(0.078, 32, 24);
  const dotZ = faceZ + FACE_DEPTH + FACE_BEVEL;
  [-0.19, 0, 0.19].forEach((x) => {
    const d = new THREE.Mesh(dotGeo, ink);
    d.scale.z = 0.55;
    d.position.set(x, 0, dotZ);
    d.castShadow = true;
    body.add(d);
    dots.push(d);
  });

  const logo = new THREE.Group();   // positioned / scaled to anchors
  const spin = new THREE.Group();   // rotation
  spin.add(body);
  logo.add(spin);
  scene.add(logo);

  /* ── state ── */
  const state = {
    visible: 0,       // 0..1 multiplier on scale
    extrude: 1,       // z-scale of body (0.02 = flat 2D)
    rx: -0.32, ry: 0.55, rz: 0.1,   // base rotation
    typing: 1,        // dots wave amount
    snap: false,      // snap to anchor (no lerp)
    spinBoost: 0,     // extra Y spin (scroll velocity)
    float: 1,
  };
  let anchorFn = () => null;
  const cur = { x: 0, y: 0, s: 0 };
  const rot = { x: state.rx, y: state.ry, z: state.rz };
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

  window.addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  });

  function pxToWorld() {
    return (2 * CAM_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2))) / window.innerHeight;
  }

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  const t0 = performance.now();
  let wasHidden = false;

  function tick() {
    const t = (performance.now() - t0) / 1000;
    const upp = pxToWorld();
    const a = anchorFn();
    let tx = cur.x, ty = cur.y, ts = 0;
    if (a) {
      const r = a.el.getBoundingClientRect();
      tx = (r.left + r.width / 2 - window.innerWidth / 2) * upp;
      ty = -(r.top + r.height / 2 - window.innerHeight / 2) * upp;
      ts = r.width * upp * (a.scale ?? 1);
    }
    ts *= state.visible;
    const k = state.snap ? 1 : 0.11;
    cur.x = lerp(cur.x, tx, k);
    cur.y = lerp(cur.y, ty, k);
    cur.s = lerp(cur.s, ts, state.snap ? 1 : 0.09);

    logo.position.set(cur.x, cur.y + Math.sin(t * 1.3) * 0.04 * state.float * cur.s, 0);
    logo.scale.setScalar(Math.max(cur.s, 0.0001));
    body.scale.z = Math.max(state.extrude, 0.02);

    mouse.x = lerp(mouse.x, mouse.tx, 0.06);
    mouse.y = lerp(mouse.y, mouse.ty, 0.06);
    const f = state.float;
    rot.x = lerp(rot.x, state.rx + mouse.y * 0.28 * f + Math.sin(t * 0.7) * 0.04 * f, state.snap ? 1 : 0.08);
    rot.y = lerp(rot.y, state.ry + mouse.x * 0.42 * f + state.spinBoost, state.snap ? 1 : 0.08);
    rot.z = lerp(rot.z, state.rz + Math.sin(t * 0.5) * 0.03 * f, state.snap ? 1 : 0.08);
    spin.rotation.set(rot.x, rot.y, rot.z);

    // typing dots
    dots.forEach((d, i) => {
      const w = Math.max(0, Math.sin(t * 6 - i * 0.9));
      d.position.z = dotZ + w * 0.05 * state.typing;
      d.position.y = w * 0.025 * state.typing;
    });

    // shadow plane follows behind the mark
    shadowPlane.position.set(0, 0, -Math.max(cur.s, 0.3) * 0.9);

    const hidden = cur.s < 0.002;
    if (!hidden || !wasHidden) renderer.render(scene, camera);
    wasHidden = hidden;
  }

  return {
    state,
    tick,
    setAnchorFn(fn) { anchorFn = fn; },
    snapRotation() { rot.x = state.rx; rot.y = state.ry; rot.z = state.rz; },
  };
}
