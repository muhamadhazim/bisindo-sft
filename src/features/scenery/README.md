# Sinyal decorative scenes

User-approved presentation change, 2026-09-12 (ADR-026 in local docs).
This overrides the earlier deferral of decorative Three.js work only. Recognition
remains in Phase 4, with live user acceptance pending. No new language rules,
alphabet classes, progress persistence, XP or account features were introduced.

## Boundaries

- Original procedural mascot and islands; original SVG logo/sticker/fallback.
  None is an instructional hand reference or a source of linguistic truth.
- Pinned Three 0.186.0, Fiber 9.4.2 and Drei 10.7.8. Fiber 9.5+ currently excludes
  React 19.3 in its peer range; 9.4.2 supports the installed React 19.3.0.
  Installation and actual Chromium rendering were verified without peer overrides.
- `ENABLE_3D_DECORATION` controls these scenes independently of the disabled
  `ENABLE_3D_REFERENCE`. Only home and learning map import the lazy wrapper.
- No Three.js imports in the practice flow, recognition, camera hooks or root
  chrome. No remote models, texture downloads, environment maps, or telemetry.
- Server output includes the same-size SVG poster and all navigation links.
  WebGL2 is probed only when the scene enters view. Lazy import/render errors and
  context loss retain the poster. The 2D button unmounts the renderer.
- DPR is capped at 1.5, rendering is demand-driven, greeting animation is bounded
  to 1.5 seconds and disabled for reduced motion. Rendering pauses out of view or
  while the document is hidden; route unmount disposes the scene.
- `map-layout.ts` derives available signs/routes from curriculum and shares
  percentage anchors between DOM navigation, 3D scene and 2D poster.

## Assets and verification

Nunito is hosted at `/assets/fonts/nunito-variable.ttf`, downloaded from
https://github.com/google/fonts/tree/main/ofl/nunito under the adjacent OFL.txt.
Three, Fiber and Drei use MIT; versions are locked in package-lock.json.
Reference photographs remain the original Rhio C/L/O assets with their provenance
and licenses. The reference image and model feature schemas were not modified.

Run typecheck, ESLint, production build and Playwright. `design.spec.ts` covers
actual renderer startup, 320/360/768/1440px layouts, WebGL unavailable/context loss,
2D navigation and absence of decorative scenes on lessons/practice. Existing
camera/MediaPipe/classifier tests cover tracking alignment and lifecycle.
Viewport emulation is not a physical-phone performance benchmark.

## Completion audit (2026-09-12)

The tracked redesign was checked against the approved plan: shared Sinyal branding,
home/map/lesson/camera layouts, original lazy 3D decoration, 2D fallback, source
preservation, responsive navigation, camera cleanup and renderer isolation.
The full 68-test regression suite passed. The audit then found low-contrast text
that functional checks had not covered. Green gradients and muted labels were
darkened while preserving the visual theme.

Added pinned @axe-core/playwright 4.13.0 as a development-only check. Eighteen
WCAG A/AA audits cover nine routes at 360/1440px; a separate test checks all
primary-button gradient stops, including hover, against the 4.5:1 contrast
threshold. These 19 checks and seven scene/layout checks passed after correction.
TypeScript, lint and production build passed. Automated audits supplement the
keyboard, zoom, fallback and screenshot review; they are not certification.

Local implementation checkpoints are committed. Deployment, physical-phone
performance measurements and human recognition acceptance remain explicitly
deferred; this redesign does not close the full alphabet MVP or Phase 4.
