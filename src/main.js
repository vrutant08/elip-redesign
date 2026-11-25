import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { Flip } from 'gsap/Flip';
import Lenis from 'lenis';
import { createLogo } from './logo3d.js';

gsap.registerPlugin(ScrollTrigger, MorphSVGPlugin, Flip);

const qs = (s, c = document) => c.querySelector(s);
const qsa = (s, c = document) => [...c.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ═════════════ smooth scroll ═════════════ */
const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
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
  const off = gsap.utils.clamp(-40, 40, v * 0.9);
  velSetters.forEach((set, i) => set(off * ((i % 3) - 1)));
}

/* ═════════════ cursor ═════════════ */
const cursor = qs('#cursor');
if (cursor) {
  const cx = gsap.quickTo(cursor, 'x', { duration: 0.18, ease: 'power3' });
  const cy = gsap.quickTo(cursor, 'y', { duration: 0.18, ease: 'power3' });
  window.addEventListener('pointermove', (e) => { cx(e.clientX); cy(e.clientY); });
  window.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
  window.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
  document.addEventListener('pointerover', (e) => {
    cursor.classList.toggle('is-hover', !!e.target.closest('a, button, summary, .chip'));
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
  lenis.scrollTo(el, { offset: id === '#top' ? 0 : -20, duration: 1.4 });
}));

/* ═════════════ hero setup ═════════════ */
const heroSlices = qsa('.hero [data-kinetic]').map(kinetic);
const heroBoxes = qsa('.hl__box');
gsap.set(heroSlices.flat(), { xPercent: (i) => [-60, 40, -30][i % 3], opacity: 0 });
gsap.set(heroBoxes, { scaleX: 0 });
gsap.set(['.hero__meta', '.spec', '.hero__ctas > *', '.hero__scroll'], { y: 30, opacity: 0 });
nav.classList.add('is-hidden');

/* ═════════════ LOADER (storyboard F01–F06) ═════════════ */
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

function runLoader() {
  const L = qs('#loader');
  const caption = qs('#loaderCaption');
  const timeEl = qs('#loaderTime');
  const pctEl = qs('#loaderPct');
  const dots = qsa('.loader__dots ellipse');
  const rings = qsa('.loader__rings circle');
  const arcs = qsa('.loader__arcs path');
  const stroke = qs('.loader__stroke');
  const fill = qs('.loader__fill');
  const letters = qsa('.lw');
  const gap = qs('.lw-gap');
  const speed = qsa('.loader__speed i');
  const len = stroke.getTotalLength();
  const anchor = { el: qs('#loaderAnchor'), scale: 1 };
  const setCap = (t) => () => { caption.textContent = t; };

  gsap.set(stroke, { strokeDasharray: len, strokeDashoffset: len });
  gsap.set(dots, { scale: 0, transformOrigin: '50% 100%' });
  gsap.set(fill, { scale: 0.6, transformOrigin: '50% 50%' });
  gsap.set(letters, { opacity: 0, scale: 0.2, x: 0 });
  speed.forEach((s, i) => gsap.set(s, { rotation: i * 45, scaleX: 0, opacity: 1 }));

  const tl = gsap.timeline({
    onUpdate() {
      timeEl.textContent = tl.time().toFixed(1);
      pctEl.textContent = String(Math.round(tl.progress() * 100)).padStart(3, '0');
    },
  });

  // F01 — dots pulse
  tl.to('.loader__grid', { opacity: 1, duration: 0.6 }, 0)
    .to(dots, { scale: 1, duration: 0.45, stagger: 0.08, ease: 'back.out(3)' }, 0.05)
    .fromTo(rings, { scale: 0.5, opacity: 0.5 }, { scale: 1.15, opacity: 0, duration: 1, stagger: 0.12, ease: 'power2.out' }, 0.1);

  // F02 — squash & stretch
  tl.call(setCap('F02 — SQUASH & STRETCH'), null, 0.6)
    .to(arcs, { opacity: 0.6, duration: 0.2 }, 0.6)
    .to(arcs, { opacity: 0, duration: 0.3 }, 1.25);
  for (let r = 0; r < 2; r++) {
    dots.forEach((d, i) => {
      const t = 0.62 + r * 0.36 + i * 0.07;
      tl.to(d, { y: -34, scaleY: 1.22, scaleX: 0.82, duration: 0.15, ease: 'power2.out' }, t)
        .to(d, { y: 0, scaleY: 1, scaleX: 1, duration: 0.13, ease: 'power2.in' }, t + 0.15)
        .to(d, { scaleY: 0.68, scaleX: 1.3, duration: 0.05 }, t + 0.28)
        .to(d, { scaleY: 1, scaleX: 1, duration: 0.18, ease: 'back.out(4)' }, t + 0.33);
    });
  }

  // F03 — mark draws on
  tl.call(setCap('F03 — MARK DRAWS ON'), null, 1.45)
    .to(stroke, { strokeDashoffset: 0, duration: 0.7, ease: 'power2.inOut' }, 1.45)
    .to(fill, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2.2)' }, 1.75);

  // F04 — 2D → 3D extrude
  tl.call(() => {
    caption.textContent = 'F04 — 2D → 3D EXTRUDE';
    canvas.style.zIndex = 55;
    Object.assign(logo.state, { visible: 1, extrude: 0.02, rx: 0, ry: 0, rz: 0, typing: 0, float: 0, snap: true });
    logo.setAnchorFn(() => anchor);
    logo.snapRotation();
  }, null, 2.25)
    .set('.loader__svg', { opacity: 0 }, 2.3)
    .to(logo.state, { extrude: 1, rx: -0.38, ry: 0.62, rz: 0.08, duration: 0.85, ease: 'power3.inOut' }, 2.3)
    .to('.loader__grid', { opacity: 0.4, duration: 0.6 }, 2.3);

  // F05 — kinetic wordmark
  tl.call(() => {
    caption.textContent = 'F05 — KINETIC WORDMARK';
    logo.state.snap = false;
    logo.state.typing = 1;
    anchor.el = gap;
  }, null, 3.15)
    .to(letters, { opacity: 1, scale: 1, duration: 0.6, stagger: { each: 0.05, from: 'center' }, ease: 'expo.out' }, 3.2)
    .fromTo(letters, { scaleY: 1.6 }, { scaleY: 1, duration: 0.7, stagger: { each: 0.05, from: 'center' }, ease: 'elastic.out(1, .45)' }, 3.2)
    .to(speed, { scaleX: 1, duration: 0.25, ease: 'power2.out', stagger: 0.01 }, 3.2)
    .to(speed, { x: 120, scaleX: 0, duration: 0.35, ease: 'power2.in', stagger: 0.01 }, 3.45);

  // F06 — hero reveal
  tl.call(() => {
    caption.textContent = 'F06 — HERO REVEAL';
    logo.setAnchorFn(pageAnchor);
    Object.assign(logo.state, { float: 1, rx: -0.32, ry: 0.55, rz: 0.1 });
  }, null, 4.2)
    .to(letters, { yPercent: -140, opacity: 0, duration: 0.5, stagger: 0.04, ease: 'power3.in' }, 4.0)
    .to(['.loader__meta', '.loader__grid'], { opacity: 0, duration: 0.3 }, 4.1)
    .to(L, { opacity: 0, duration: 0.5, ease: 'power2.out' }, 4.25)
    .add(heroReveal(), 4.3)
    .call(() => {
      L.remove();
      canvas.style.zIndex = '';
      document.body.classList.remove('is-loading');
      lenis.start();
      ScrollTrigger.refresh();
    }, null, 5.0);

  if (reduced) tl.timeScale(3);
  return tl;
}

function heroReveal() {
  const tl = gsap.timeline();
  tl.call(() => nav.classList.remove('is-hidden'), null, 0)
    .to('.hero__meta', { y: 0, opacity: 1, duration: 0.7, ease: 'expo.out' }, 0.05)
    .to(heroBoxes, { scaleX: 1, duration: 0.6, ease: 'expo.inOut', stagger: 0.1 }, 0.15);
  heroSlices.forEach((s, li) => {
    tl.to(s, { xPercent: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.06 }, 0.1 + li * 0.1);
  });
  tl.fromTo('.hl--3', { '--u': 0 }, { '--u': 1, duration: 0.8, ease: 'expo.inOut' }, 0.5)
    .to(['.spec', '.hero__ctas > *', '.hero__scroll'], { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: 'expo.out' }, 0.45);
  return tl;
}

/* ═════════════ kinetic section headings ═════════════ */
qsa('[data-kinetic-scroll]').forEach((h) => {
  const s = kinetic(h);
  gsap.set(s, { xPercent: (i) => [-24, 18, -12][i], opacity: 0 });
  ScrollTrigger.create({
    trigger: h, start: 'top 85%', once: true,
    onEnter: () => gsap.to(s, { xPercent: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: 0.07 }),
  });
});
// velocity offsets (x) on every kinetic slice
allSlices.flat().forEach((el) => velSetters.push(gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' })));

/* ═════════════ marquee ═════════════ */
(() => {
  const track = qs('#marquee');
  const words = qsa('span', track);
  let x = 0, boost = 0;
  lenis.on('scroll', (e) => { boost = gsap.utils.clamp(-30, 30, e.velocity); });
  gsap.ticker.add((t, dt) => {
    x -= (0.06 + Math.abs(boost) * 0.04) * dt;
    const half = track.scrollWidth / 2;
    if (-x >= half) x += half;
    track.style.transform = `translate3d(${x}px,0,0)`;
    const sk = boost * 0.6;
    words.forEach((w) => { w.style.transform = `skewX(${-sk}deg) scaleY(${1 + Math.abs(boost) * 0.01})`; });
    boost *= 0.92;
  });
})();

/* ═════════════ HOW — pinned 2D→3D morph ═════════════ */
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
  const zEl = qs('#stageZ');
  const capEl = qs('#stageCaption');
  let cur = -1;

  function setStep(i) {
    if (i === cur) return;
    cur = i;
    const st = STEPS[i];
    bars.forEach((b, k) => { b.classList.toggle('on', k < i); b.classList.toggle('cur', k === i); });
    labels.forEach((l, k) => l.classList.toggle('on', k === i));
    els.frame.textContent = `F0${i + 1}`;
    const out = [els.num, els.title, els.sub, els.desc];
    gsap.timeline()
      .to(out, { yPercent: -40, opacity: 0, duration: 0.18, stagger: 0.03, ease: 'power2.in' })
      .call(() => {
        els.num.textContent = String(i + 1).padStart(2, '0');
        els.title.textContent = st.t; els.sub.textContent = st.s; els.desc.textContent = st.d;
      })
      .fromTo(out, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.04, ease: 'expo.out' })
      .fromTo(els.num, { scaleY: 1.5, transformOrigin: '0 100%' }, { scaleY: 1, duration: 0.6, ease: 'elastic.out(1,.4)' }, '<');
  }
  setStep(0);

  const mm = gsap.matchMedia();
  mm.add('(min-width: 0px)', () => {
    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      scrollTrigger: {
        trigger: '.how', start: 'top top', end: () => '+=' + window.innerHeight * 4.2,
        pin: '.how__pin', scrub: 0.7,
        onUpdate(self) {
          const t = self.animation.time();
          let s = 0;
          for (let k = 1; k < 5; k++) if (t >= tl.labels['s' + k]) s = k;
          setStep(s);
          gsap.set(dot, { left: (self.progress * 100) + '%' });
          const g = parseFloat(gsap.getProperty(stack, '--gap')) || 0;
          zEl.textContent = 'Z = ' + (g * LAYERS).toFixed(2);
          capEl.textContent = g < 0.6 ? 'FLAT 2D — SHAPE MORPH' : '2D → 3D EXTRUDE';
        },
      },
    });
    tl.set(stack, { '--gap': '0px', rotationX: 0, rotationY: 0 })
      .to({}, { duration: 0.2 })
      .to(stack, { '--gap': '3.2px', rotationX: 32, rotationY: -34, duration: 0.8 });
    for (let i = 1; i < 5; i++) {
      tl.to({}, { duration: 0.35 })
        .to(stack, { '--gap': '0px', rotationX: 0, rotationY: 0, scale: 0.92, duration: 0.5 })
        .addLabel('s' + i)
        .to(paths, { morphSVG: { shape: ICONS[i], type: 'rotational' }, duration: 0.7, ease: 'expo.inOut' }, '<0.15')
        .to(stack, { '--gap': '3.2px', rotationX: 32, rotationY: i % 2 ? 34 : -34, scale: 1, duration: 0.7 });
    }
    tl.to({}, { duration: 0.4 });
  });
})();

/* ═════════════ FILTERS — dealbreaker board with Flip ═════════════ */
(() => {
  const JOBS = [
    { t: 'Senior Product Designer', c: 'Parabola Labs', m: 'Remote · $172k', fit: 94, tags: ['Remote', 'Design systems'], r: [] },
    { t: 'Design Engineer', c: 'Ledgerline', m: 'Web3 · Remote · $165k', fit: 89, tags: ['Crypto', 'Remote'], r: ['crypto'] },
    { t: 'Founding Designer', c: 'Northwind AI', m: 'NYC · Onsite 5 days', fit: 87, tags: ['Onsite', 'Seed'], r: ['office', 'relocate'] },
    { t: 'Staff Designer', c: 'Marlow Health', m: 'Remote · $190k', fit: 92, tags: ['Remote', 'Health'], r: [] },
    { t: 'Product Designer', c: 'Studio Kettle', m: 'Agency · $128k', fit: 78, tags: ['Agency'], r: ['agency', 'salary'] },
    { t: 'UX Lead', c: 'Coinrise', m: 'Hybrid · $180k', fit: 84, tags: ['Crypto', 'Hybrid'], r: ['crypto'] },
    { t: 'Senior Designer', c: 'Fieldnote', m: 'London · Relocation', fit: 85, tags: ['Relocation'], r: ['relocate'] },
    { t: 'Product Designer II', c: 'Brightpath', m: 'Remote · $138k', fit: 81, tags: ['Remote'], r: ['salary'] },
  ];
  const REASON = { crypto: 'CRYPTO', relocate: 'RELOCATION', salary: 'UNDER $150K', office: '5-DAY OFFICE', agency: 'AGENCY' };
  const matchList = qs('#matchList'), asideList = qs('#asideList');
  const mc = qs('#matchCount'), ac = qs('#asideCount');
  const active = new Set();
  const cards = JOBS.map((j) => {
    const el = document.createElement('div');
    el.className = 'job';
    el.innerHTML = `<span class="job__fit">${j.fit}</span><span class="job__t">${j.t}</span><span class="job__m">${j.c} — ${j.m}</span><div class="job__tags">${j.tags.map((t) => `<span>${t}</span>`).join('')}</div><span class="job__stamp"></span>`;
    el.dataset.flipId = j.t + j.c;
    matchList.appendChild(el);
    return { el, j };
  });
  const pad = (n) => String(n).padStart(2, '0');
  mc.textContent = pad(cards.length);

  function apply() {
    const state = Flip.getState(cards.map((c) => c.el));
    let m = 0, a = 0;
    cards.forEach(({ el, j }) => {
      const hit = j.r.find((r) => active.has(r));
      el.classList.toggle('is-aside', !!hit);
      el.querySelector('.job__stamp').textContent = hit ? REASON[hit] : '';
      (hit ? asideList : matchList).appendChild(el);
      hit ? a++ : m++;
    });
    mc.textContent = pad(m); ac.textContent = pad(a);
    Flip.from(state, { duration: 0.75, ease: 'expo.inOut', stagger: 0.025, absolute: true, nested: true });
  }
  qsa('.chip').forEach((ch) => ch.addEventListener('click', () => {
    const r = ch.dataset.rule;
    active.has(r) ? active.delete(r) : active.add(r);
    ch.classList.toggle('is-on', active.has(r));
    gsap.fromTo(ch, { scale: 0.92 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1,.4)' });
    apply();
  }));

  gsap.from(cards.map((c) => c.el), {
    y: 40, opacity: 0, rotation: () => gsap.utils.random(-4, 4), duration: 0.8, stagger: 0.05, ease: 'expo.out',
    scrollTrigger: { trigger: '.board', start: 'top 80%' },
  });
  gsap.from('.chip', { y: 20, opacity: 0, stagger: 0.06, duration: 0.6, ease: 'back.out(2)', scrollTrigger: { trigger: '.chips', start: 'top 85%' } });
})();

/* ═════════════ EXPLAIN + TAILOR ═════════════ */
(() => {
  gsap.from('#matchCard', { y: 120, rotation: -8, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.explain__grid', start: 'top 80%' } });
  gsap.from('#resume', { y: 160, rotation: 8, opacity: 0, duration: 1.1, delay: 0.15, ease: 'expo.out', scrollTrigger: { trigger: '.explain__grid', start: 'top 80%' } });
  qsa('.fit b i').forEach((b) => {
    gsap.to(b, { scaleX: parseFloat(b.style.getPropertyValue('--w')), duration: 1.2, ease: 'expo.inOut', scrollTrigger: { trigger: b, start: 'top 85%' } });
  });
  qsa('.fit em').forEach((em) => {
    const end = +em.textContent; const o = { v: 0 };
    gsap.to(o, { v: end, duration: 1.2, ease: 'expo.inOut', onUpdate: () => { em.textContent = Math.round(o.v); }, scrollTrigger: { trigger: em, start: 'top 85%' } });
  });
  const tl = gsap.timeline({ scrollTrigger: { trigger: '#resume', start: 'top 60%' } });
  tl.from('.resume__lines del', { opacity: 1, duration: 0.01 })
    .to('.resume__lines del', { opacity: 0.55, duration: 0.4, stagger: 0.25 })
    .fromTo('.resume__lines ins', { '--hl': '0%', opacity: 0, y: 8 }, { '--hl': '100%', opacity: 1, y: 0, duration: 0.7, stagger: 0.25, ease: 'expo.out' }, '<0.15');

  const btn = qs('#approveBtn');
  btn.addEventListener('click', () => {
    const r = qs('#resume');
    if (r.classList.contains('is-approved')) return;
    r.classList.add('is-approved');
    qs('.resume__status').textContent = 'APPROVED — READY TO SEND';
    btn.querySelector('.btn__label').textContent = 'Approved';
    gsap.fromTo(r, { rotation: 1 }, { rotation: -0.5, duration: 0.8, ease: 'elastic.out(1,.35)' });
  });
})();

/* ═════════════ EACH MORNING — sunrise ═════════════ */
(() => {
  const l1 = kinetic(qs('#mL1'));
  const l2 = kinetic(qs('#mL2'));
  l1.concat(l2).forEach((el) => velSetters.push(gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' })));
  const tl = gsap.timeline({
    scrollTrigger: { trigger: '.morning', start: 'top top', end: () => '+=' + window.innerHeight * 1.8, pin: '.morning__pin', scrub: 0.6 },
  });
  tl.fromTo('#sun', { yPercent: 120, scale: 0.35 }, { yPercent: 0, scale: 1, duration: 1, ease: 'power2.out' })
    .fromTo('#sun i', { scale: 0 }, { scale: 1, duration: 0.4, stagger: 0.12, ease: 'back.out(3)' }, 0.7)
    .fromTo('.morning__kicker', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3 }, 0.3)
    .fromTo(l1, { xPercent: (i) => [-50, 30, -20][i], opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: 'expo.out' }, 0.5)
    .fromTo(qs('#mL2'), { scaleY: 0, scaleX: 1.4 }, { scaleY: 1, scaleX: 1, duration: 0.6, ease: 'back.out(2.5)' }, 0.9)
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
      p: 1, duration: 0.7, ease: 'none',
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
      .to([cap, body, ...items], { opacity: 0, x: -20, duration: 0.2, stagger: 0.03 })
      .call(() => {
        cap.textContent = d.cap; body.textContent = d.body;
        items.forEach((li, i) => { li.querySelector('h4').textContent = d.flow[i][0]; li.querySelector('p').textContent = d.flow[i][1]; });
      })
      .fromTo([cap, body, ...items], { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.6, stagger: 0.05, ease: 'expo.out' });
    gsap.fromTo('.price', { rotation: side === 'comp' ? 2 : -2 }, { rotation: 0, duration: 0.9, ease: 'elastic.out(1,.4)' });
  }));
  gsap.from('.price', { y: 80, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.sides__panel', start: 'top 80%' } });
  gsap.from(items, { x: 60, opacity: 0, duration: 0.9, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '#flow', start: 'top 80%' } });
})();

/* ═════════════ FAQ ═════════════ */
qsa('.faq details').forEach((d) => {
  d.addEventListener('toggle', () => {
    if (d.open) gsap.fromTo(d.querySelector('p'), { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' });
    ScrollTrigger.refresh();
  });
});
gsap.from('.faq details', { y: 30, opacity: 0, stagger: 0.06, duration: 0.7, ease: 'expo.out', scrollTrigger: { trigger: '.faq__list', start: 'top 85%' } });

/* ═════════════ FOOTER wordmark ═════════════ */
(() => {
  const letters = qsa('#footWord svg');
  gsap.from(letters, {
    yPercent: 110, scaleY: 0.3, duration: 1.2, stagger: 0.08, ease: 'elastic.out(1,.5)',
    scrollTrigger: { trigger: '#footWord', start: 'top 92%' },
  });
  const word = qs('#footWord');
  const setters = letters.map((l) => gsap.quickTo(l, 'scaleY', { duration: 0.6, ease: 'elastic.out(1,.4)' }));
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
