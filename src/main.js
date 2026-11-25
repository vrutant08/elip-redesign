import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { Flip } from 'gsap/Flip';
import Lenis from 'lenis';
import { createLogo } from './logo3d.js';
import { SHAPES, SHAPE_KEYS, buildAmbientField, buildMorphBand, buildSectionOpeners } from './motifs.js';

gsap.registerPlugin(ScrollTrigger, MorphSVGPlugin, Flip);

const qs = (s, c = document) => c.querySelector(s);
const qsa = (s, c = document) => [...c.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ═════════════ smooth scroll ═════════════ */
const lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
window.__lenis = lenis;
lenis.stop();
gsap.ticker.lagSmoothing(0);

/* ═════════════ 3D logo ═════════════ */
const canvas = qs('#gl');
const logo = createLogo(canvas);
gsap.ticker.add((t) => { lenis.raf(t * 1000); logo.tick(); });
lenis.on('scroll', (e) => {
  ScrollTrigger.update();
  logo.state.spinBoost = e.scroll * 0.0016;
  kineticVelocity(e.velocity);
  navOnScroll(e);
});

/* ═════════════ Bauhaus SVG fields & morph bands ═════════════ */
const loaderField = buildAmbientField(qs('#loaderGeo'), {
  theme: 'light',
  count: 10,
  opacity: 0.24,
  morphInterval: 2.8,
});
buildAmbientField(qs('#heroGeo'), {
  theme: 'light',
  count: 8,
  opacity: 0.17,
  morphInterval: 4.2,
});
buildAmbientField(qs('#morningGeo'), {
  theme: 'dark',
  count: 8,
  opacity: 0.18,
  morphInterval: 4.0,
});
buildMorphBand(qs('#morphBand'));
buildSectionOpeners();

/* ═════════════ kinetic slices ═════════════ */
const allSlices = [];
function kinetic(el) {
  const txt = el.textContent.trim();
  el.textContent = '';
  const w = document.createElement('span');
  w.className = 'k';
  w.innerHTML = `<span class="k__base">${txt}</span>` +
    `<span class="k__slice" aria-hidden="true">${txt}</span>`.repeat(3);
  el.appendChild(w);
  const s = qsa('.k__slice', w);
  allSlices.push(s);
  return s;
}
const velSetters = [];
function kineticVelocity(v) {
  const off = gsap.utils.clamp(-36, 36, v * 0.85);
  velSetters.forEach((set, i) => set(off * ((i % 3) - 1)));
}

/* ═════════════ magnetic buttons (fluid & weighted) ═════════════ */
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  qsa('[data-magnetic]').forEach((btn) => {
    const mx = gsap.quickTo(btn, 'x', { duration: 0.75, ease: 'power3.out' });
    const my = gsap.quickTo(btn, 'y', { duration: 0.75, ease: 'power3.out' });
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) * 0.22;
      const dy = (e.clientY - (r.top + r.height / 2)) * 0.28;
      mx(gsap.utils.clamp(-14, 14, dx));
      my(gsap.utils.clamp(-10, 10, dy));
    });
    btn.addEventListener('pointerleave', () => { mx(0); my(0); });
  });
}

/* ═════════════ cursor ═════════════ */
const cursor = qs('#cursor');
if (cursor) {
  const cx = gsap.quickTo(cursor, 'x', { duration: 0.22, ease: 'power3.out' });
  const cy = gsap.quickTo(cursor, 'y', { duration: 0.22, ease: 'power3.out' });
  window.addEventListener('pointermove', (e) => { cx(e.clientX); cy(e.clientY); });
  window.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
  window.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
  document.addEventListener('pointerover', (e) => {
    cursor.classList.toggle('is-hover', !!e.target.closest('a, button, summary, .token, .capsule'));
  });
}

/* ═════════════ slice links ═════════════ */
qsa('[data-slice]').forEach((a) => {
  const t = a.textContent;
  a.innerHTML = `<span class="s s--a">${t}</span><span class="s s--b" aria-hidden="true">${t}</span>`;
});

/* ═════════════ nav ═════════════ */
const nav = qs('#nav');
let lastY = 0;
function navOnScroll(e) {
  const y = e.scroll;
  nav.classList.toggle('is-solid', y > window.innerHeight * 0.6);
  nav.classList.toggle('is-hidden', y > lastY && y > window.innerHeight);
  lastY = y;
}
qsa('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href');
  if (id.length < 2) return;
  const el = qs(id);
  if (!el) return;
  e.preventDefault();
  lenis.scrollTo(el, { offset: id === '#top' ? 0 : -20, duration: 1.5 });
}));

/* ═════════════ hero setup ═════════════ */
const heroSlices = qsa('.hero [data-kinetic]').map(kinetic);
const heroBadges = qsa('.hl__badge');
gsap.set(heroSlices.flat(), { xPercent: (i) => [-54, 36, -26][i % 3], opacity: 0 });
gsap.set(heroBadges, { scaleX: 0 });
gsap.set(['.hero__meta', '.hero__dossier', '.hero__ctas > *'], { y: 34, opacity: 0 });
nav.classList.add('is-hidden');

/* ═════════════ LOADER (slowed & unhurried, with Vrutant Panchal credit) ═════════════ */
const heroAnchor = qs('[data-logo-anchor="hero"]');
const footAnchor = qs('[data-logo-anchor="foot"]');
const pageAnchor = () => {
  const vh = window.innerHeight;
  const h = heroAnchor.getBoundingClientRect();
  if (h.bottom > vh * 0.15) return { el: heroAnchor };
  const f = footAnchor.getBoundingClientRect();
  if (f.top < vh * 1.05 && f.bottom > -40) return { el: footAnchor };
  return null;
};

// Split "Vrutant Panchal" into individually animatable glyphs
const creditNameEl = qs('#creditName');
const creditChars = [];
if (creditNameEl) {
  const raw = creditNameEl.textContent.trim();
  creditNameEl.textContent = '';
  [...raw].forEach((ch) => {
    const span = document.createElement('span');
    if (ch === ' ') {
      span.className = 'credit__space';
      span.innerHTML = '&nbsp;';
    } else {
      span.className = 'credit__char';
      span.textContent = ch;
      creditChars.push(span);
    }
    creditNameEl.appendChild(span);
  });
}

function runLoader() {
  const L = qs('#loader');
  const pctEl = qs('#loaderPct');
  const skipBtn = qs('#loaderSkip');
  const dots = qsa('.loader__dots ellipse');
  const rings = qsa('.loader__rings circle');
  const arcs = qsa('.loader__arcs path');
  const stroke = qs('.loader__stroke');
  const fill = qs('.loader__fill');
  const letters = qsa('.lw');
  const gap = qs('.lw-gap');
  const speed = qsa('.loader__speed i');
  const creditRule = qs('.credit__rule i');
  const creditEyebrow = qs('.credit__eyebrow span');
  const creditGlyphs = qsa('.credit__glyph');
  const len = stroke.getTotalLength();
  const anchor = { el: qs('#loaderAnchor'), scale: 1 };

  gsap.set(stroke, { strokeDasharray: len, strokeDashoffset: len });
  gsap.set(dots, { scale: 0, transformOrigin: '50% 100%' });
  gsap.set(fill, { scale: 0.6, transformOrigin: '50% 50%' });
  gsap.set(letters, { opacity: 0, scale: 0.25, x: 0 });
  gsap.set(creditChars, { yPercent: 135, opacity: 0, rotateX: -65 });
  gsap.set(creditGlyphs, { scale: 0, rotation: -120, opacity: 0 });
  speed.forEach((s, i) => gsap.set(s, { rotation: i * 45, scaleX: 0, opacity: 1 }));

  let finished = false;
  function finishLoader() {
    if (finished) return;
    finished = true;
    loaderField.destroy();
    L.remove();
    canvas.style.zIndex = '';
    document.body.classList.remove('is-loading');
    lenis.start();
    ScrollTrigger.refresh();
  }

  const tl = gsap.timeline({
    onUpdate() {
      pctEl.textContent = String(Math.round(tl.progress() * 100)).padStart(3, '0');
    },
  });

  // 0.0s – 1.3s: Ambient Bauhaus field + dots pulse gently into existence
  tl.to('.loader__grid', { opacity: 1, duration: 0.9, ease: 'power2.out' }, 0)
    .to('#loaderGeo', { opacity: 1, duration: 1.2, ease: 'power2.out' }, 0.1)
    .to(dots, { scale: 1, duration: 0.65, stagger: 0.14, ease: 'back.out(2.4)' }, 0.15)
    .fromTo(rings, { scale: 0.45, opacity: 0.48, svgOrigin: '120 120' }, { scale: 1.22, opacity: 0, svgOrigin: '120 120', duration: 1.5, stagger: 0.18, ease: 'power2.out' }, 0.2);

  // 1.3s – 2.75s: Unhurried squash-and-stretch typing waves
  tl.to(arcs, { opacity: 0.5, duration: 0.35 }, 1.25)
    .to(arcs, { opacity: 0, duration: 0.45 }, 2.45);
  for (let r = 0; r < 2; r++) {
    dots.forEach((d, i) => {
      const t = 1.3 + r * 0.6 + i * 0.11;
      tl.to(d, { y: -36, scaleY: 1.24, scaleX: 0.82, duration: 0.24, ease: 'power2.out' }, t)
        .to(d, { y: 0, scaleY: 1, scaleX: 1, duration: 0.2, ease: 'power2.in' }, t + 0.24)
        .to(d, { scaleY: 0.7, scaleX: 1.26, duration: 0.08 }, t + 0.44)
        .to(d, { scaleY: 1, scaleX: 1, duration: 0.28, ease: 'back.out(3.2)' }, t + 0.52);
    });
  }

  // 2.75s – 4.1s: Squircle border draws smoothly + amber face blooms
  tl.to(stroke, { strokeDashoffset: 0, duration: 1.15, ease: 'power2.inOut' }, 2.75)
    .to(fill, { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.9)' }, 3.25);

  // 4.1s – 5.4s: Seamless 2D → 3D extrusion handoff
  tl.call(() => {
    canvas.style.zIndex = 55;
    Object.assign(logo.state, { visible: 1, extrude: 0.02, rx: 0, ry: 0, rz: 0, typing: 0, float: 0, snap: true });
    logo.setAnchorFn(() => anchor);
    logo.snapRotation();
  }, null, 4.1)
    .set('.loader__svg', { opacity: 0 }, 4.16)
    .to(logo.state, { extrude: 1, rx: -0.36, ry: 0.6, rz: 0.08, duration: 1.2, ease: 'power3.inOut' }, 4.16)
    .to('.loader__grid', { opacity: 0.4, duration: 0.9 }, 4.16);

  // 5.4s – 7.45s: Kinetic ELIP wordmark + "Redesigned by Vrutant Panchal" signature reveal
  tl.call(() => {
    logo.state.snap = false;
    logo.state.typing = 1;
    anchor.el = gap;
  }, null, 5.4)
    .to(letters, { opacity: 1, scale: 1, duration: 0.9, stagger: { each: 0.08, from: 'center' }, ease: 'expo.out' }, 5.45)
    .fromTo(letters, { scaleY: 1.5 }, { scaleY: 1, duration: 1.05, stagger: { each: 0.08, from: 'center' }, ease: 'elastic.out(1, .5)' }, 5.45)
    .to(speed, { scaleX: 1, duration: 0.35, ease: 'power2.out', stagger: 0.02 }, 5.45)
    .to(speed, { x: 130, scaleX: 0, duration: 0.5, ease: 'power2.in', stagger: 0.02 }, 5.8)

    // Bespoke credit animation
    .to(creditRule, { scaleX: 1, duration: 0.85, ease: 'expo.inOut' }, 5.65)
    .to(creditEyebrow, { y: 0, duration: 0.75, ease: 'expo.out' }, 5.85)
    .to(creditGlyphs, { scale: 1, rotation: 0, opacity: 1, duration: 0.95, stagger: 0.1, ease: 'back.out(2.2)' }, 5.85)
    .to(creditChars, { yPercent: 0, opacity: 1, rotateX: 0, duration: 0.9, stagger: 0.032, ease: 'expo.out' }, 5.95)
    .fromTo(creditNameEl, { letterSpacing: '0.32em' }, { letterSpacing: '0.14em', duration: 1.15, ease: 'expo.out' }, 5.95);

  // 7.6s – 8.7s: Graceful exit into the Hero
  tl.call(() => {
    logo.setAnchorFn(pageAnchor);
    Object.assign(logo.state, { float: 1, rx: -0.32, ry: 0.55, rz: 0.1 });
  }, null, 7.65)
    .to(letters, { yPercent: -120, opacity: 0, duration: 0.65, stagger: 0.05, ease: 'power3.in' }, 7.45)
    .to(['.loader__credit', '.loader__meta', '.loader__skip', '#loaderGeo', '.loader__grid'], { opacity: 0, y: -16, duration: 0.55, ease: 'power2.in' }, 7.5)
    .to(L, { opacity: 0, duration: 0.7, ease: 'power2.out' }, 7.8)
    .add(heroReveal(), 7.85)
    .call(finishLoader, null, 8.75);

  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      tl.kill();
      logo.setAnchorFn(pageAnchor);
      Object.assign(logo.state, { visible: 1, extrude: 1, float: 1, snap: false, typing: 1, rx: -0.32, ry: 0.55, rz: 0.1 });
      gsap.to(L, {
        opacity: 0, duration: 0.45, ease: 'power2.out',
        onComplete: () => {
          finishLoader();
          heroReveal();
        },
      });
    });
  }

  if (reduced) tl.timeScale(1.35);
  return tl;
}

function heroReveal() {
  const tl = gsap.timeline();
  tl.call(() => nav.classList.remove('is-hidden'), null, 0)
    .to('.hero__meta', { y: 0, opacity: 1, duration: 0.85, ease: 'expo.out' }, 0.05)
    .to(heroBadges, { scaleX: 1, duration: 0.8, ease: 'expo.inOut', stagger: 0.12 }, 0.16);
  heroSlices.forEach((s, li) => {
    tl.to(s, { xPercent: 0, opacity: 1, duration: 1.05, ease: 'expo.out', stagger: 0.07 }, 0.1 + li * 0.11);
  });
  tl.fromTo('.hl--3', { '--u': 0 }, { '--u': 1, duration: 0.9, ease: 'expo.inOut' }, 0.55)
    .to(['.hero__dossier', '.hero__ctas > *'], { y: 0, opacity: 1, duration: 0.95, stagger: 0.1, ease: 'expo.out' }, 0.5);
  return tl;
}

/* ═════════════ kinetic section headings ═════════════ */
qsa('[data-kinetic-scroll]').forEach((h) => {
  const s = kinetic(h);
  gsap.set(s, { xPercent: (i) => [-22, 16, -12][i], opacity: 0 });
  ScrollTrigger.create({
    trigger: h, start: 'top 86%', once: true,
    onEnter: () => gsap.to(s, { xPercent: 0, opacity: 1, duration: 1.2, ease: 'expo.out', stagger: 0.07 }),
  });
});
allSlices.flat().forEach((el) => velSetters.push(gsap.quickTo(el, 'x', { duration: 0.55, ease: 'power3.out' })));

/* ═════════════ HOW — pinned 2D→3D morph (zero dev labels) ═════════════ */
const STEPS = [
  { t: 'Learns', s: 'Your experience. Your next move.', d: "Start with your resume and a conversation. Elip learns what you've done, what you want next — and what you never want to do again." },
  { t: 'Looks', s: 'New roles, with you in mind.', d: 'Every night it searches companies hiring through Elip and public listings, guided by your experience and preferences.' },
  { t: 'Filters', s: 'Your dealbreakers count.', d: 'Roles that cross a line you drew are set aside before they ever reach you. No crypto? No relocation? It remembers.' },
  { t: 'Explains', s: 'Why this role. Why you.', d: 'Each match comes with the fit — and what still needs checking. No black boxes.' },
  { t: 'Tailors', s: 'Your experience, for this role.', d: 'Review the tailored resume and approve every change. Then choose where to apply.' },
];
const ICONS = ['#ic-doc', '#ic-mag', '#ic-fun', '#ic-bub', '#ic-sci'];

(() => {
  const stack = qs('#stack');
  const LAYERS = 14;
  const d0 = qs('#ic-doc').getAttribute('d');
  stack.innerHTML = Array.from({ length: LAYERS }, (_, i) =>
    `<svg viewBox="0 0 100 100" style="--i:${LAYERS - 1 - i}" class="${i === LAYERS - 1 ? 'front' : ''}"><path d="${d0}"/></svg>`
  ).join('');
  const paths = qsa('path', stack);
  const els = { num: qs('#howNum'), title: qs('#howTitle'), sub: qs('#howSub'), desc: qs('#howDesc'), frame: qs('#howFrame') };
  const bars = qsa('.how__progress i');
  const labels = qsa('.how__path span');
  const dot = qs('#howDot');
  let cur = -1;

  function setStep(i) {
    if (i === cur) return;
    cur = i;
    const st = STEPS[i];
    bars.forEach((b, k) => { b.classList.toggle('on', k < i); b.classList.toggle('cur', k === i); });
    labels.forEach((l, k) => l.classList.toggle('on', k === i));
    els.frame.textContent = String(i + 1).padStart(2, '0');
    const out = [els.num, els.title, els.sub, els.desc];
    gsap.timeline()
      .to(out, { yPercent: -36, opacity: 0, duration: 0.22, stagger: 0.03, ease: 'power2.in' })
      .call(() => {
        els.num.textContent = String(i + 1).padStart(2, '0');
        els.title.textContent = st.t; els.sub.textContent = st.s; els.desc.textContent = st.d;
      })
      .fromTo(out, { yPercent: 36, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: 'expo.out' })
      .fromTo(els.num, { scaleY: 1.4, transformOrigin: '0 100%' }, { scaleY: 1, duration: 0.7, ease: 'elastic.out(1,.45)' }, '<');
  }
  setStep(0);

  const mm = gsap.matchMedia();
  mm.add('(min-width: 0px)', () => {
    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      scrollTrigger: {
        trigger: '.how', start: 'top top', end: () => '+=' + window.innerHeight * 4.2,
        pin: '.how__pin', scrub: 0.75,
        onUpdate(self) {
          const t = self.animation.time();
          let s = 0;
          for (let k = 1; k < 5; k++) if (t >= tl.labels['s' + k]) s = k;
          setStep(s);
          gsap.set(dot, { left: (self.progress * 100) + '%' });
        },
      },
    });
    tl.set(stack, { '--gap': '0px', rotationX: 0, rotationY: 0 })
      .to({}, { duration: 0.2 })
      .to(stack, { '--gap': '3.2px', rotationX: 32, rotationY: -34, duration: 0.85 });
    for (let i = 1; i < 5; i++) {
      tl.to({}, { duration: 0.35 })
        .to(stack, { '--gap': '0px', rotationX: 0, rotationY: 0, scale: 0.92, duration: 0.55 })
        .addLabel('s' + i)
        .to(paths, { morphSVG: { shape: ICONS[i], type: 'rotational' }, duration: 0.8, ease: 'expo.inOut' }, '<0.15')
        .to(stack, { '--gap': '3.2px', rotationX: 32, rotationY: i % 2 ? 34 : -34, scale: 1, duration: 0.75 });
    }
    tl.to({}, { duration: 0.4 });
  });
})();

/* ═════════════ SIGNAL SIEVE — Reimagined Interactive Dealbreakers ═════════════ */
(() => {
  const JOBS = [
    { t: 'Senior Product Designer', c: 'Parabola Labs', m: 'Remote · $172k', fit: 94, tags: ['Remote', 'Design systems'], r: [], why: 'Strong match on design systems ownership, remote culture, and compensation band.' },
    { t: 'Design Engineer', c: 'Ledgerline', m: 'Web3 · Remote · $165k', fit: 89, tags: ['Crypto', 'Remote'], r: ['crypto'], why: 'Great craft overlap, though their product sits inside the Web3 / crypto vertical.' },
    { t: 'Founding Designer', c: 'Northwind AI', m: 'NYC · Onsite 5 days', fit: 87, tags: ['Onsite', 'Seed'], r: ['office', 'relocate'], why: 'High ownership early-stage seat, requires full-time presence in New York.' },
    { t: 'Staff Designer', c: 'Marlow Health', m: 'Remote · $190k', fit: 92, tags: ['Remote', 'Health'], r: [], why: 'Matches your target scope, remote flexibility, and senior compensation floor.' },
    { t: 'Product Designer', c: 'Studio Kettle', m: 'Agency · $128k', fit: 78, tags: ['Agency'], r: ['agency', 'salary'], why: 'Client-services studio model and below a $150k base compensation threshold.' },
    { t: 'UX Lead', c: 'Coinrise', m: 'Hybrid · $180k', fit: 84, tags: ['Crypto', 'Hybrid'], r: ['crypto'], why: 'Strong leadership scope in a crypto exchange environment.' },
    { t: 'Senior Designer', c: 'Fieldnote', m: 'London · Relocation', fit: 85, tags: ['Relocation'], r: ['relocate'], why: 'Thoughtful product team, requires relocating to London.' },
    { t: 'Product Designer II', c: 'Brightpath', m: 'Remote · $138k', fit: 81, tags: ['Remote'], r: ['salary'], why: 'Remote-friendly team, but base salary sits under $150k.' },
  ];
  const REASON = { crypto: 'CRYPTO', relocate: 'RELOCATION', salary: 'UNDER $150K', office: '5-DAY OFFICE', agency: 'AGENCY' };

  const matchList = qs('#matchList');
  const asideList = qs('#asideList');
  const dismissedWrap = qs('#dismissedWrap');
  const mc = qs('#matchCount');
  const ac = qs('#asideCount');
  const ring = qs('#apertureRing');
  const shape = qs('#apertureShape');
  const pulse = qs('#sievePulse');
  const verdictTag = qs('#verdictTag');
  const verdictText = qs('#verdictText');

  const CIRC = 2 * Math.PI * 96;
  gsap.set(ring, { strokeDasharray: CIRC, strokeDashoffset: 0 });
  gsap.set('#apertureRot', { scale: 0.92, svgOrigin: '110 110' });

  const active = new Set();
  const cards = JOBS.map((j) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'capsule';
    el.innerHTML =
      `<div class="capsule__top"><span class="capsule__t">${j.t}</span><span class="capsule__fit">${j.fit}</span></div>` +
      `<span class="capsule__m">${j.c} · ${j.m}</span>` +
      `<div class="capsule__tags">${j.tags.map((t) => `<span>${t}</span>`).join('')}</div>` +
      `<span class="capsule__stamp"></span>`;
    el.dataset.flipId = j.t + j.c;
    el.addEventListener('click', () => {
      if (el.classList.contains('is-aside')) return;
      cards.forEach((c) => c.el.classList.remove('is-selected'));
      el.classList.add('is-selected');
      verdictTag.textContent = `${j.c.toUpperCase()} · ${j.fit}% FIT`;
      verdictText.textContent = j.why;
      gsap.fromTo('#apertureVerdict', { y: 8, opacity: 0.4 }, { y: 0, opacity: 1, duration: 0.55, ease: 'expo.out' });
    });
    matchList.appendChild(el);
    return { el, j };
  });

  const pad = (n) => String(n).padStart(2, '0');
  dismissedWrap.classList.add('is-empty');

  function apply() {
    const state = Flip.getState(cards.map((c) => c.el));
    let m = 0, a = 0;
    cards.forEach(({ el, j }) => {
      const hit = j.r.find((r) => active.has(r));
      el.classList.toggle('is-aside', !!hit);
      if (hit) el.classList.remove('is-selected');
      el.querySelector('.capsule__stamp').textContent = hit ? REASON[hit] : '';
      (hit ? asideList : matchList).appendChild(el);
      hit ? a++ : m++;
    });

    dismissedWrap.classList.toggle('is-empty', a === 0);
    ac.textContent = pad(a);

    // Animate aperture readout + SVG ring + Bauhaus shape morph
    const curVal = { v: parseInt(mc.textContent, 10) || JOBS.length };
    gsap.to(curVal, {
      v: m, duration: 0.7, ease: 'expo.out',
      onUpdate: () => { mc.textContent = pad(Math.round(curVal.v)); },
    });
    const ratio = m / JOBS.length;
    gsap.to(ring, {
      strokeDashoffset: CIRC * (1 - ratio),
      duration: 0.95,
      ease: 'expo.out',
    });

    const targetShape = SHAPES[SHAPE_KEYS[active.size % SHAPE_KEYS.length]];
    gsap.to(shape, {
      morphSVG: { shape: targetShape, shapeIndex: 'auto' },
      duration: 1.0,
      ease: 'expo.inOut',
    });
    gsap.to('#apertureRot', {
      rotation: '+=90',
      svgOrigin: '110 110',
      duration: 1.0,
      ease: 'expo.inOut',
    });

    // Subtle scan pulse across stage
    gsap.fromTo(
      pulse,
      { scale: 0.8, opacity: 0.55 },
      { scale: 18, opacity: 0, duration: 1.15, ease: 'power3.out' }
    );

    if (active.size === 0) {
      verdictTag.textContent = 'SELECT A RULE ABOVE';
      verdictText.textContent = 'Toggle any boundary to watch Elip narrow the field in real time.';
    } else {
      verdictTag.textContent = `${active.size} ${active.size === 1 ? 'BOUNDARY' : 'BOUNDARIES'} ACTIVE`;
      verdictText.textContent = `${a} roles crossed your line and were quietly set aside. Click any remaining role to inspect the fit.`;
    }

    Flip.from(state, {
      duration: 0.85,
      ease: 'expo.inOut',
      stagger: 0.025,
      absolute: true,
      nested: true,
    });
  }

  qsa('.token').forEach((tok) => tok.addEventListener('click', () => {
    const r = tok.dataset.rule;
    active.has(r) ? active.delete(r) : active.add(r);
    tok.classList.toggle('is-on', active.has(r));
    apply();
  }));

  gsap.from(cards.map((c) => c.el), {
    y: 36, opacity: 0, duration: 0.95, stagger: 0.055, ease: 'expo.out',
    scrollTrigger: { trigger: '#sieveStage', start: 'top 82%' },
  });
  gsap.from('.token', {
    y: 22, opacity: 0, stagger: 0.06, duration: 0.75, ease: 'expo.out',
    scrollTrigger: { trigger: '.sieve__tokens', start: 'top 86%' },
  });
})();

/* ═════════════ EXPLAIN + TAILOR ═════════════ */
(() => {
  gsap.from('#matchCard', { y: 110, rotation: -6, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.explain__grid', start: 'top 82%' } });
  gsap.from('#resume', { y: 140, rotation: 6, opacity: 0, duration: 1.2, delay: 0.14, ease: 'expo.out', scrollTrigger: { trigger: '.explain__grid', start: 'top 82%' } });
  qsa('.fit b i').forEach((b) => {
    gsap.to(b, { scaleX: parseFloat(b.style.getPropertyValue('--w')), duration: 1.3, ease: 'expo.inOut', scrollTrigger: { trigger: b, start: 'top 86%' } });
  });
  qsa('.fit em').forEach((em) => {
    const end = +em.textContent; const o = { v: 0 };
    gsap.to(o, { v: end, duration: 1.3, ease: 'expo.inOut', onUpdate: () => { em.textContent = Math.round(o.v); }, scrollTrigger: { trigger: em, start: 'top 86%' } });
  });
  const tl = gsap.timeline({ scrollTrigger: { trigger: '#resume', start: 'top 62%' } });
  tl.from('.resume__lines del', { opacity: 1, duration: 0.01 })
    .to('.resume__lines del', { opacity: 0.55, duration: 0.45, stagger: 0.28 })
    .fromTo('.resume__lines ins', { '--hl': '0%', opacity: 0, y: 8 }, { '--hl': '100%', opacity: 1, y: 0, duration: 0.8, stagger: 0.28, ease: 'expo.out' }, '<0.15');

  const btn = qs('#approveBtn');
  btn.addEventListener('click', () => {
    const r = qs('#resume');
    if (r.classList.contains('is-approved')) return;
    r.classList.add('is-approved');
    qs('.resume__status').textContent = 'APPROVED · READY TO SEND';
    qsa('.t', btn).forEach((t) => { t.textContent = 'Approved'; });
    gsap.fromTo(r, { rotation: 0.9 }, { rotation: -0.4, duration: 0.95, ease: 'elastic.out(1,.4)' });
  });
})();

/* ═════════════ EACH MORNING — sunrise ═════════════ */
(() => {
  const l1 = kinetic(qs('#mL1'));
  const l2 = kinetic(qs('#mL2'));
  l1.concat(l2).forEach((el) => velSetters.push(gsap.quickTo(el, 'x', { duration: 0.55, ease: 'power3.out' })));
  const tl = gsap.timeline({
    scrollTrigger: { trigger: '.morning', start: 'top top', end: () => '+=' + window.innerHeight * 1.8, pin: '.morning__pin', scrub: 0.7 },
  });
  tl.fromTo('#sun', { yPercent: 120, scale: 0.35 }, { yPercent: 0, scale: 1, duration: 1, ease: 'power2.out' })
    .fromTo('#sun i', { scale: 0 }, { scale: 1, duration: 0.4, stagger: 0.12, ease: 'back.out(3)' }, 0.7)
    .fromTo('.morning__kicker', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3 }, 0.3)
    .fromTo(l1, { xPercent: (i) => [-50, 30, -20][i], opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: 'expo.out' }, 0.5)
    .fromTo(qs('#mL2'), { scaleY: 0, scaleX: 1.35 }, { scaleY: 1, scaleX: 1, duration: 0.6, ease: 'back.out(2.4)' }, 0.9)
    .fromTo('#mL3', { opacity: 0 }, { opacity: 1, duration: 0.3 }, 1.3)
    .to('#sun i', { y: (i) => [-14, 0, 14][i], duration: 0.3, stagger: 0.05 }, 1.5)
    .to('#sun i', { y: 0, duration: 0.3, stagger: 0.05 }, 1.8)
    .to('#sun', { scale: 0.18, yPercent: 0, duration: 0.6, ease: 'power2.in' }, 2.1)
    .to('#sun i', { scale: 0, duration: 0.2 }, 2.1);
})();

/* ═════════════ TWO SIDES ═════════════ */
(() => {
  const SIDES = {
    cand: {
      fig: '$0', cap: 'FOR CANDIDATES. ALWAYS.',
      body: 'Companies pay Elip when they hire. You never pay. Nobody can pay to appear on a shortlist.',
      flow: [['Learns', "Your resume and a conversation about what's next."], ['Matches', 'A few roles each morning, each one explained.'], ['Applies', 'Your tailored resume goes out only after you approve it.']],
    },
    comp: {
      fig: '10%', cap: 'OF FIRST-YEAR BASE. ONLY WHEN YOU HIRE.',
      body: 'Nothing to start. Full refund if the hire leaves within 3 months. No fee for people you already knew.',
      flow: [['Understands', 'Start with the work. Describe the role in your dashboard.'], ['Recommends', 'Why this person fits. Relevant experience. What they want next.'], ['Introduces', 'Both sides choose to meet. You request, Elip checks their interest.']],
    },
  };
  const sw = qs('#sideSwitch');
  const fig = qs('#priceFig'), cap = qs('#priceCap'), body = qs('#priceBody');
  const items = qsa('#flow li');
  const CH = '0123456789%$#';
  function scramble(el, to) {
    const o = { p: 0 };
    gsap.to(o, {
      p: 1, duration: 0.8, ease: 'none',
      onUpdate: () => {
        const n = Math.floor(o.p * to.length);
        el.textContent = to.slice(0, n) + Array.from({ length: to.length - n }, () => CH[(Math.random() * CH.length) | 0]).join('');
      },
      onComplete: () => { el.textContent = to; },
    });
  }
  qsa('.switch__opt', sw).forEach((b) => b.addEventListener('click', () => {
    const side = b.dataset.side;
    if (sw.dataset.side === side || (!sw.dataset.side && side === 'cand')) return;
    sw.dataset.side = side;
    qsa('.switch__opt', sw).forEach((o) => o.classList.toggle('is-on', o === b));
    const d = SIDES[side];
    scramble(fig, d.fig);
    gsap.timeline()
      .to([cap, body, ...items], { opacity: 0, x: -20, duration: 0.25, stagger: 0.03 })
      .call(() => {
        cap.textContent = d.cap; body.textContent = d.body;
        items.forEach((li, i) => { li.querySelector('h4').textContent = d.flow[i][0]; li.querySelector('p').textContent = d.flow[i][1]; });
      })
      .fromTo([cap, body, ...items], { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.7, stagger: 0.06, ease: 'expo.out' });
    gsap.fromTo('.price', { rotation: side === 'comp' ? 1.8 : -1.8 }, { rotation: 0, duration: 1.0, ease: 'elastic.out(1,.45)' });
  }));
  gsap.from('.price', { y: 60, opacity: 0, duration: 1.0, ease: 'expo.out', scrollTrigger: { trigger: '.sides__panel', start: 'top 95%' } });
  gsap.from(items, { x: 50, opacity: 0, duration: 0.95, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '#flow', start: 'top 95%' } });
})();

/* ═════════════ FAQ ═════════════ */
qsa('.faq details').forEach((d) => {
  d.addEventListener('toggle', () => {
    if (d.open) gsap.fromTo(d.querySelector('p'), { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' });
    ScrollTrigger.refresh();
  });
});
gsap.from('.faq details', { y: 30, opacity: 0, stagger: 0.06, duration: 0.8, ease: 'expo.out', scrollTrigger: { trigger: '.faq__list', start: 'top 86%' } });

/* ═════════════ FOOTER wordmark ═════════════ */
(() => {
  const letters = qsa('#footWord svg');
  gsap.from(letters, {
    yPercent: 110, scaleY: 0.3, duration: 1.25, stagger: 0.08, ease: 'elastic.out(1,.5)',
    scrollTrigger: { trigger: '#footWord', start: 'top 92%' },
  });
  const word = qs('#footWord');
  const setters = letters.map((l) => gsap.quickTo(l, 'scaleY', { duration: 0.65, ease: 'elastic.out(1,.42)' }));
  word.addEventListener('pointermove', (e) => {
    letters.forEach((l, i) => {
      const r = l.getBoundingClientRect();
      const d = Math.abs(e.clientX - (r.left + r.width / 2)) / window.innerWidth;
      setters[i](1 + Math.max(0, 0.45 - d * 1.6));
    });
  });
  word.addEventListener('pointerleave', () => setters.forEach((s) => s(1)));
})();

/* ═════════════ boot ═════════════ */
const boot = () => runLoader();
if (document.fonts && document.fonts.ready) {
  Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]).then(boot);
} else boot();
