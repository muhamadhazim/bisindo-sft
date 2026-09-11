# BISINDO Learning Platform

## Implementation status

Phases 0, 0A, 1, 2, and 3 are complete for local development. Phase 4 now has
an actual trained C/L/O Random Forest connected to realtime webcam practice.
Open `/practice/bisindo-c-sanjaya-v1`, start the camera, and use the C/L/O buttons
to select a target. Use your right hand. The UI shows the recognized letter,
target match, retry, or uncertain continuously as the pose changes.
Acceptance events remain one-shot until release. Camera frames stay local. This is an explicitly labeled initial
user-trial model, not verified new-user accuracy or a completed MVP.

The classifier was trained from 60 C/L/O photographs in the user-selected Rhio
Sutoyo BISINDO dataset. It uses the same pinned Tasks model and 52-value extractor
at training and runtime. See the [model card](public/models/rhio-clo-v1/README.md)
and [reproducible training](ml/rhio/README.md). No extra alphabet classes are used.
Scoring, coaching and persistence remain pending; the challenge is a placeholder.
Vercel deployment is deferred at the user's request; development continues
locally. See [task status](docs/TASKS.md) and ADR-017 in docs/DECISIONS.md.

Verification includes lint, typecheck, production build, responsive flows, and browser classifier tests; responsive shell and
learning click-through at 320–1440px with no horizontal overflow. Tests also cover
reference-image failure and unknown curriculum IDs. See [verification record](docs/IMPLEMENTATION_STATUS.md).

Camera tests cover denied/missing/busy/unsupported devices, late permission after
cancel/navigation, track cleanup, mirror display, and frame scheduling. Automated
tests use synthetic camera input only in the test browser. A separate real-device
check passed on local Chrome 152.0.7977.83: 640×480 video and all tracks ended after
route exit. No frames were saved. Physical phone behavior and camera-light visual
inspection remain unverified.

Tracking uses pinned MediaPipe Tasks Vision 1.0.1 and an official Apache-2.0 model,
with locally hosted WASM, traceable checksums, ambiguous-hand rejection, and model
failure/retry. Camera and tracking started on actual local Chrome; this is not a
live letter-recognition accuracy test. Debug overlay was checked at 360px with a
licensed reference fixture. A sampled inference took 81ms on this desktop/dev
run; this is not a phone performance benchmark. Vendor usage telemetry is blocked
by the enforced same-origin connection policy. See [runtime details](public/models/mediapipe/README.md).

Phase 4 includes ambiguous-hand rejection, time-based stability, release gating,
and recovery from failed model downloads. The earlier six-observation reference
matcher was rejected and is no longer the production inference path. The current
Random Forest uses its native browser JSON format through ml-random-forest 2.1.0.
Live user validation is pending; the user explicitly chose to try the classifier
themselves rather than block its implementation on prior live approval.
Phases 5–8, 10 and 13 remain required and pending. Phase 9 learned-model work is
conditional. Phase 11 (3D) and Phase 12 (dynamic gestures) are non-MVP stretch.
Supabase/RLS, scoring, mastery and the full learning loop are not claimed complete.

Observe and Practice share the same three unchanged C/L/O reference photographs
from the Rhio Sutoyo dataset (MIT), with full-size links and right-hand guidance.
See [image provenance](public/assets/signs/rhio-clo/provenance.json).
The nine earlier Sanjaya images remain archived with their CC BY 4.0 attribution
and [content evidence](public/assets/signs/sanjaya-v1/REVIEW.md).
Existing route IDs are retained for link compatibility; content source IDs identify Rhio.
SOURCE_VERIFIED records reflect source comparison, not human-validator approval
or verified realtime recognition accuracy.

## Run from a fresh clone

Install **Node.js 24.21.0** (see `.node-version`) and **npm 10.9.4**.
Verify `node --version` and `npm --version`, then run from the repository root:

```bash
npm ci
npm run dev
```

Open http://localhost:3000. Phase 0 does not need environment variables or
external accounts. `.env.example` lists the optional future configuration;
copy it to `.env.local` when needed, and never commit credentials.

Verification:

```bash
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm test
```

Linux CI may need `npx playwright install --with-deps chromium`.
`npm test` starts the production server on `127.0.0.1:3100`; build first and
keep that port free. Playwright tests cover responsive shell/404 recovery,
keyboard navigation, text zoom, privacy headers, and absence of heavy downloads.

Production locally:

```bash
npm run start
```

Optional real-camera check (briefly activates the webcam; requires installed
Google Chrome and the production server above): `npm run test:camera:local`.
This checks live decoded video and track cleanup without recording pixels.

Vercel: import this repository, select Next.js and Node 24.x, use `npm ci` /
`npm run build`, then verify the generated HTTPS URL. Account/project access is
required. See [deployment](docs/DEPLOYMENT.md). No deployment has been claimed.

The original `manifest.json` and `SHA256SUMS.txt` describe the input documentation
pack, not a PWA manifest or integrity manifest for the evolving application.

## Source of truth

Dokumentasi ini adalah **source of truth** untuk membangun prototype platform pembelajaran BISINDO yang interaktif, mobile-first, dan menggunakan computer vision lokal di browser.

Versi ini telah diaudit ulang untuk mengurangi risiko kesalahan eksekusi pada:

- Next.js 16,
- MediaPipe Tasks Vision,
- camera/mirroring,
- feature-schema parity antara training dan runtime,
- TensorFlow.js/browser model,
- Supabase Auth + RLS,
- dataset split dan leakage,
- dynamic gesture sampling,
- coaching feedback,
- performance mobile,
- lisensi dataset/repository.

## Tujuan Produk

Membantu masyarakat umum yang belum mengenal BISINDO mempelajari fondasi bahasa isyarat secara bertahap melalui:

- micro-learning,
- latihan dengan kamera,
- feedback gerakan,
- challenge berbasis gesture,
- gamification,
- adaptive review,
- roadmap menuju kosakata dan komunikasi sederhana.

**Alfabet adalah fondasi pembelajaran, bukan keseluruhan produk.**

Produk **bukan** translator BISINDO universal dan **bukan** pengganti interpreter manusia.

## Urutan Dokumen

Baca dalam urutan berikut:

1. `AGENTS.md`
2. `docs/PRD.md`
3. `docs/DECISIONS.md`
4. `docs/ARCHITECTURE.md`
5. `docs/CONTRACTS.md`
6. `docs/CONTENT_SCHEMA.md`
7. `docs/AI_RECOGNITION.md`
8. `docs/MODEL_TRAINING.md`
9. `docs/DATASET.md`
10. `docs/DESIGN.md`
11. `docs/CURRICULUM.md`
12. `docs/GAMIFICATION.md`
13. `docs/DATABASE.md`
14. `docs/SECURITY_PRIVACY.md`
15. `docs/PERFORMANCE.md`
16. `docs/TESTING.md`
17. `docs/SETUP.md`
18. `docs/DEPLOYMENT.md`
19. `docs/LICENSES.md`
20. `docs/TASKS.md`
21. `docs/ROADMAP.md`
22. `docs/REFERENCES.md`
23. `docs/AUDIT_REPORT.md`
24. `docs/CODEX_START_PROMPT.md`

Jika ada konflik, precedence:

`AGENTS.md > PRD.md > DECISIONS.md > ARCHITECTURE.md > CONTRACTS.md > domain docs > TASKS.md > code comments`

## Prinsip yang Tidak Boleh Dilanggar

- Mobile-first.
- Camera + learning loop harus bekerja sebelum 3D polish.
- Raw webcam frames tidak dikirim ke backend.
- Mirroring hanya untuk display; model memakai canonical coordinate convention.
- Detection array order tidak boleh dianggap sebagai kiri/kanan.
- Recognition dan coaching adalah sistem berbeda.
- Confidence model bukan persentase "seberapa benar" gesture user.
- Gesture statis dan dinamis dipisahkan.
- Training dan runtime wajib memakai feature schema yang identik.
- Split dataset berdasarkan signer/source group bila metadata memungkinkan.
- Augmentation hanya pada training split.
- Jangan horizontal-flip data bahasa isyarat tanpa validasi semantik.
- Jangan mengarang rule BISINDO dari asumsi developer.
- Three.js/React Three Fiber hanya enhancement.
- Tidak mengklaim akurasi yang belum diuji.
- Tidak mengklaim satu bentuk BISINDO sebagai universal tanpa sumber/region.
- External repository adalah referensi, bukan produk yang direbrand.

## Target MVP

Loop wajib:

`Learn → Observe → Practice → Camera Feedback → Challenge → Reward → Review`

MVP minimum:

- onboarding BISINDO,
- learning path,
- materi alfabet tervalidasi,
- camera permission + calibration,
- one/two-hand tracking sesuai requirement sign,
- recognition untuk subset sign tervalidasi,
- multi-frame/time stabilization,
- corrective feedback sederhana,
- Sign Challenge,
- XP + mastery,
- progress persistence,
- responsive mobile,
- graceful fallback jika camera/model/3D/backend gagal,
- credits dataset/model/assets.

Full A–Z, dynamic gesture, 3D rigged hand, leaderboard, dan vocabulary hanya masuk setelah core stabil.

## Stack

Baseline:

- Next.js 16 Active LTS / latest patched 16.3.x at implementation time
- React 19
- TypeScript strict
- Tailwind CSS
- shadcn/ui
- Motion (`motion/react`)
- MediaPipe Tasks Vision (`@mediapipe/tasks-vision`)
- Supabase
- Vercel

Install later only when needed:

- TensorFlow.js — only if a learned browser model is required
- React Three Fiber + Drei + Three.js — only after camera/recognition stable

Lihat `docs/SETUP.md`.

### Phase 4 technical experiment — 2026-09-11

A source-derived reference matcher was evaluated and rejected for production:
L-0 remained uncertain in the integrated VIDEO acceptance test, and the repeated
frame/framing probe showed unstable coverage. The experimental code and source
measurements are retained outside the production path, with a reproducible
[reference audit](src/features/recognition/REFERENCE_AUDIT.md). Existing project
methodologies were reviewed; no external code, ASL rules or model was copied.
Technical evaluation can continue without waiting for mentor-provided numeric
thresholds. Reliable new-person recognition is still unverified.



