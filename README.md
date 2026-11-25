# Elip — Concept Redesign

Unofficial portfolio redesign of [Elip](https://tryelip.ai) by **Vrutant Panchal**. Swiss grid × sculptural Bauhaus geometry, kinetic type, and 2D-to-3D motion.

## Run
```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # dist/
```

## Stack
Vite, GSAP (ScrollTrigger, MorphSVG, Flip), Three.js, Lenis.

## Structure
- `index.html` — markup, SVG mark, custom wordmark, and geometric glyph defs
- `src/style.css` — sculptural card & button system, typography (`Michroma`, `Audiowide`, `Geist`, `JetBrains Mono`)
- `src/motifs.js` — animated Swiss–Bauhaus SVG fields, interactive morph band, and section openers
- `src/logo3d.js` — extruded 3D Elip mark tracking page anchors
- `src/main.js` — slowed intro choreography, kinetic slices, pinned 2D→3D morph, interactive Signal Sieve, and scroll transitions

