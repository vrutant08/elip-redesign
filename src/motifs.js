import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/* ═══════════════════════════════════════════════════════════
   Swiss–Bauhaus geometric SVG vocabulary (inspired by Image 7)
   Single continuous paths centered on (50, 50) in 0..100 so
   MorphSVGPlugin morphs every shape into every other smoothly.
   ═══════════════════════════════════════════════════════════ */
export const SHAPES = {
  // Opposing double-semicircle bowtie / butterfly
  butterfly:
    'M 12 10 C 34 10 47 26 49 48 L 51 48 C 53 26 66 10 88 10 L 88 90 C 66 90 53 74 51 52 L 49 52 C 47 74 34 90 12 90 Z',
  // 4-arm diagonal notched Bauhaus X / flower
  splitX:
    'M 22 8 L 50 34 L 78 8 L 92 22 L 66 50 L 92 78 L 78 92 L 50 66 L 22 92 L 8 78 L 34 50 L 8 22 Z',
  // Crisp geometric pinwheel / 4-blade sawtooth star
  pinwheel:
    'M 12 12 L 50 12 L 50 38 L 88 12 L 88 50 L 62 50 L 88 88 L 50 88 L 50 62 L 12 88 L 12 50 L 38 50 Z',
  // Pure modernist circle
  circle:
    'M 50 8 C 73.2 8 92 26.8 92 50 C 92 73.2 73.2 92 50 92 C 26.8 92 8 73.2 8 50 C 8 26.8 26.8 8 50 8 Z',
  // Elip signature squircle
  squircle:
    'M 26 10 L 74 10 C 84 10 90 16 90 26 L 90 74 C 90 84 84 90 74 90 L 26 90 C 16 90 10 84 10 74 L 10 26 C 10 16 16 10 26 10 Z',
  // Bold Bauhaus four-petal diamond star
  star:
    'M 50 6 C 55 34 66 45 94 50 C 66 55 55 66 50 94 C 45 66 34 55 6 50 C 34 45 45 34 50 6 Z',
};

export const SHAPE_KEYS = Object.keys(SHAPES);

const NS = 'http://www.w3.org/2000/svg';
function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

/* Helper: centered geometric tile (pos -> rot/scale -> centered path) */
function makeTile(x, y, scale, pathD, fill, opacity = 1) {
  const pos = svgEl('g', { style: `opacity: ${opacity}` });
  const rot = svgEl('g');
  const center = svgEl('g', { transform: 'translate(-50, -50)' });
  const path = svgEl('path', { d: pathD, fill });
  center.appendChild(path);
  rot.appendChild(center);
  pos.appendChild(rot);
  gsap.set(pos, { x, y });
  gsap.set(rot, { scale, rotation: 0, transformOrigin: '0px 0px' });
  return { pos, rot, path };
}

/* ── Palette tuned to Image 7 × Elip warm paper ── */
const PALETTE_LIGHT = ['#F6A800', '#B33B63', '#E45238', '#F2C94C', '#1E1B16'];
const PALETTE_AMBER = ['#FFE373', '#B43862', '#FF6B57', '#FFF2B2', '#1E1B16'];
const PALETTE_DARK = ['#F6A800', '#FFE373', '#D44D6A', '#E85A3F', '#F4F0E6'];

/* ───────────── 1. Ambient Geometric Field (Loader, Hero, Morning) ───────────── */
export function buildAmbientField(container, opts = {}) {
  if (!container) return { destroy() {}, items: [] };
  const {
    theme = 'light',
    count = 10,
    crosshairs = 18,
    opacity = 0.22,
    morphInterval = 3.4,
    positions = null,
  } = opts;

  const palette = theme === 'dark' ? PALETTE_DARK : theme === 'amber' ? PALETTE_AMBER : PALETTE_LIGHT;
  const crossColor = theme === 'dark' ? 'rgba(244,240,230,0.35)' : theme === 'amber' ? 'rgba(255,255,255,0.65)' : 'rgba(30,27,22,0.22)';

  const svg = svgEl('svg', {
    class: 'geo-field__svg',
    viewBox: '0 0 1440 900',
    preserveAspectRatio: 'xMidYMid slice',
  });

  // Subtle modular crosshair '+' grid nodes
  const crossGroup = svgEl('g', { class: 'geo-crosses' });
  const cols = 6, rows = 4;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r * cols + c) % 2 === 1 && crosshairs < 20) continue;
      const x = 110 + c * 244;
      const y = 110 + r * 225;
      const g = svgEl('g', { transform: `translate(${x}, ${y})`, opacity: '0.85' });
      g.appendChild(svgEl('path', { d: 'M -7 0 H 7 M 0 -7 V 7', stroke: crossColor, 'stroke-width': '1.6', 'stroke-linecap': 'square' }));
      crossGroup.appendChild(g);
    }
  }
  svg.appendChild(crossGroup);

  const defaultSlots = [
    { x: 96, y: 165, s: 0.72 },
    { x: 1320, y: 175, s: 0.86 },
    { x: 165, y: 740, s: 0.62 },
    { x: 1295, y: 725, s: 0.92 },
    { x: 350, y: 125, s: 0.44 },
    { x: 1090, y: 135, s: 0.5 },
    { x: 82, y: 455, s: 0.54 },
    { x: 1355, y: 465, s: 0.6 },
    { x: 1065, y: 790, s: 0.52 },
    { x: 425, y: 805, s: 0.46 },
  ];
  const slots = positions || defaultSlots.slice(0, count);

  const items = [];
  const shapeGroup = svgEl('g', { class: 'geo-shapes' });

  slots.forEach((slot, i) => {
    const keyIdx = i % SHAPE_KEYS.length;
    const tile = makeTile(slot.x, slot.y, slot.s, SHAPES[SHAPE_KEYS[keyIdx]], palette[i % palette.length], slot.op ?? opacity);
    shapeGroup.appendChild(tile.pos);
    items.push({ ...tile, keyIdx, baseX: slot.x, baseY: slot.y, depth: 0.4 + (i % 4) * 0.25 });
  });

  svg.appendChild(shapeGroup);
  container.innerHTML = '';
  container.appendChild(svg);

  // Rhythmic mechanical morph + in-place 90° rotation
  const timers = [];
  items.forEach((item, idx) => {
    const step = () => {
      item.keyIdx = (item.keyIdx + 1 + (idx % 2)) % SHAPE_KEYS.length;
      gsap.to(item.path, {
        morphSVG: { shape: SHAPES[SHAPE_KEYS[item.keyIdx]], shapeIndex: 'auto' },
        duration: 1.5,
        ease: 'expo.inOut',
      });
      gsap.to(item.rot, {
        rotation: '+=90',
        duration: 1.6,
        ease: 'expo.inOut',
      });
    };
    const d = gsap.delayedCall(morphInterval * (0.4 + idx * 0.28), function loop() {
      step();
      timers.push(gsap.delayedCall(morphInterval + (idx % 3) * 0.9, loop));
    });
    timers.push(d);
  });

  // Gentle cursor parallax
  const moveHandlers = items.map((item) => ({
    x: gsap.quickTo(item.pos, 'x', { duration: 1.4, ease: 'power3.out' }),
    y: gsap.quickTo(item.pos, 'y', { duration: 1.4, ease: 'power3.out' }),
    item,
  }));

  const onMove = (e) => {
    const nx = (e.clientX / window.innerWidth - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    moveHandlers.forEach(({ x, y, item }) => {
      x(item.baseX + nx * 24 * item.depth);
      y(item.baseY + ny * 18 * item.depth);
    });
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  return {
    svg,
    items,
    destroy() {
      timers.forEach((t) => t.kill());
      window.removeEventListener('pointermove', onMove);
    },
  };
}

/* ───────────── 2. Kinetic Bauhaus Morph Band (Replaces generic marquee) ───────────── */
export function buildMorphBand(container) {
  if (!container) return;
  const COLS = 12;
  const ROWS = 2;
  const CELL = 120;
  const W = COLS * CELL;
  const H = ROWS * CELL;

  const svg = svgEl('svg', {
    class: 'morph-band__svg',
    viewBox: `0 0 ${W} ${H}`,
    preserveAspectRatio: 'xMidYMid slice',
  });

  const plusGroup = svgEl('g', { class: 'morph-band__pluses' });
  for (let r = 0; r <= ROWS; r++) {
    for (let c = 0; c <= COLS; c++) {
      const x = c * CELL;
      const y = r * CELL;
      plusGroup.appendChild(svgEl('path', {
        d: `M ${x - 7} ${y} H ${x + 7} M ${x} ${y - 7} V ${y + 7}`,
        stroke: 'rgba(255,255,255,0.75)',
        'stroke-width': '1.6',
      }));
    }
  }
  svg.appendChild(plusGroup);

  const tiles = [];
  const tileGroup = svgEl('g');
  const pattern = [
    { c: 0, r: 0, s: 0.78, k: 3, col: 0 },
    { c: 1, r: 0, s: 0.92, k: 0, col: 1 },
    { c: 2, r: 0, s: 0.98, k: 1, col: 1 },
    { c: 3, r: 0, s: 0.56, k: 1, col: 1 },
    { c: 4, r: 0, s: 0.68, k: 2, col: 0 },
    { c: 5, r: 0, s: 0.84, k: 0, col: 2 },
    { c: 6, r: 0, s: 0.48, k: 3, col: 1 },
    { c: 7, r: 0, s: 0.88, k: 4, col: 0 },
    { c: 8, r: 0, s: 0.62, k: 1, col: 1 },
    { c: 9, r: 0, s: 0.94, k: 2, col: 0 },
    { c: 10, r: 0, s: 0.54, k: 0, col: 3 },
    { c: 11, r: 0, s: 0.82, k: 5, col: 1 },

    { c: 0, r: 1, s: 0.9, k: 2, col: 1 },
    { c: 1, r: 1, s: 0.58, k: 3, col: 0 },
    { c: 2, r: 1, s: 0.76, k: 1, col: 0 },
    { c: 3, r: 1, s: 0.94, k: 2, col: 0 },
    { c: 4, r: 1, s: 0.52, k: 0, col: 1 },
    { c: 5, r: 1, s: 0.96, k: 3, col: 0 },
    { c: 6, r: 1, s: 0.78, k: 1, col: 1 },
    { c: 7, r: 1, s: 0.6, k: 5, col: 2 },
    { c: 8, r: 1, s: 0.96, k: 1, col: 0 },
    { c: 9, r: 1, s: 0.66, k: 0, col: 1 },
    { c: 10, r: 1, s: 0.88, k: 2, col: 0 },
    { c: 11, r: 1, s: 0.58, k: 3, col: 4 },
  ];

  pattern.forEach((p, idx) => {
    const cx = p.c * CELL + CELL / 2;
    const cy = p.r * CELL + CELL / 2;
    const tile = makeTile(cx, cy, p.s, SHAPES[SHAPE_KEYS[p.k]], PALETTE_AMBER[p.col % PALETTE_AMBER.length], 1);
    tileGroup.appendChild(tile.pos);
    tiles.push({ ...tile, cx, cy, s: p.s, k: p.k, idx, busy: false });
  });

  svg.appendChild(tileGroup);
  container.innerHTML = '';
  container.appendChild(svg);

  // Scroll-triggered wave entrance
  ScrollTrigger.create({
    trigger: container,
    start: 'top 90%',
    once: true,
    onEnter: () => {
      tiles.forEach((t, i) => {
        gsap.fromTo(
          t.rot,
          { scale: 0, rotation: -90 },
          {
            scale: t.s,
            rotation: 0,
            duration: 1.15,
            delay: (i % 12) * 0.04 + Math.floor(i / 12) * 0.1,
            ease: 'expo.out',
          }
        );
      });
    },
  });

  // Periodic gentle ambient wave morph across columns
  let waveCol = 0;
  function triggerWave() {
    tiles.forEach((t) => {
      if (Math.floor(t.cx / CELL) === waveCol && !t.busy) {
        t.k = (t.k + 1) % SHAPE_KEYS.length;
        gsap.to(t.path, {
          morphSVG: { shape: SHAPES[SHAPE_KEYS[t.k]], shapeIndex: 'auto' },
          duration: 1.35,
          ease: 'expo.inOut',
        });
        gsap.to(t.rot, {
          rotation: '+=90',
          duration: 1.35,
          ease: 'expo.inOut',
        });
      }
    });
    waveCol = (waveCol + 1) % COLS;
    gsap.delayedCall(0.6, triggerWave);
  }
  gsap.delayedCall(2.0, triggerWave);

  // Interactive cursor proximity morph & bloom
  container.addEventListener('pointermove', (e) => {
    const rect = svg.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * W;
    const my = ((e.clientY - rect.top) / rect.height) * H;
    tiles.forEach((t) => {
      const dist = Math.hypot(mx - t.cx, my - t.cy);
      if (dist < 115 && !t.busy) {
        t.busy = true;
        t.k = (t.k + 1) % SHAPE_KEYS.length;
        gsap.to(t.path, {
          morphSVG: { shape: SHAPES[SHAPE_KEYS[t.k]], shapeIndex: 'auto' },
          duration: 0.95,
          ease: 'expo.out',
        });
        gsap.to(t.rot, {
          rotation: '+=90',
          scale: t.s * 1.15,
          duration: 0.55,
          ease: 'power3.out',
          onComplete: () => {
            gsap.to(t.rot, {
              scale: t.s,
              duration: 0.75,
              ease: 'expo.out',
              onComplete: () => { t.busy = false; },
            });
          },
        });
      }
    });
  });
}

/* ───────────── 3. Section Opener Morph Clusters ───────────── */
export function buildSectionOpeners() {
  document.querySelectorAll('[data-geo-opener]').forEach((el, idx) => {
    const count = +(el.dataset.count || 3);
    const theme = el.dataset.theme || 'light';
    const palette = theme === 'dark' ? PALETTE_DARK : PALETTE_LIGHT;
    const size = 26;
    const gap = 10;
    const w = count * size + (count - 1) * gap;
    const svg = svgEl('svg', {
      class: 'geo-opener__svg',
      width: w,
      height: size,
      viewBox: `0 0 ${w} ${size}`,
    });

    const nodes = [];
    for (let i = 0; i < count; i++) {
      const cx = i * (size + gap) + size / 2;
      const cy = size / 2;
      const startKey = (idx + i) % SHAPE_KEYS.length;
      const tile = makeTile(cx, cy, size / 100, SHAPES[SHAPE_KEYS[startKey]], palette[(idx + i) % palette.length], 1);
      svg.appendChild(tile.pos);
      nodes.push({ ...tile, k: startKey });
    }
    el.innerHTML = '';
    el.appendChild(svg);

    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        nodes.forEach((n, i) => {
          const next = (n.k + 2) % SHAPE_KEYS.length;
          gsap.fromTo(
            n.rot,
            { scale: 0, rotation: -120 },
            {
              scale: size / 100,
              rotation: 0,
              duration: 1.05,
              delay: i * 0.1,
              ease: 'expo.out',
            }
          );
          gsap.to(n.path, {
            morphSVG: { shape: SHAPES[SHAPE_KEYS[next]], shapeIndex: 'auto' },
            duration: 1.4,
            delay: 0.4 + i * 0.15,
            ease: 'expo.inOut',
          });
        });
      },
    });
  });
}
