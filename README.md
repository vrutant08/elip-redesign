# Elip - concept redesign

Unofficial portfolio redesign of [Elip](https://tryelip.ai). Swiss grid x soft brutalism, kinetic type, 2D-to-3D motion.

## Run
```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # dist/
```

## Stack
Vite, GSAP (ScrollTrigger, MorphSVG, Flip), Three.js, Lenis.

## Structure
- index.html - markup, SVG logo / wordmark / icon defs
- src/style.css - design system (Michroma display, Audiowide numerals, Geist, JetBrains Mono)
- src/logo3d.js - extruded 3D Elip mark that tracks DOM anchors
- src/main.js - loader (storyboard F01-F06), kinetic slices, pinned morph, filters board, interactions

