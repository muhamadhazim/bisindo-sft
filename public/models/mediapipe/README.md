# Local hand-tracking runtime

Google MediaPipe Tasks Vision 1.0.1, Apache-2.0. The WASM directory contains
unchanged package files; the JS wrapper is bundled by Next from the pinned npm
dependency. The official Hand Landmarker float16 model is version 1. Source URLs,
file sizes and SHA256 checksums are in provenance.json. License text and bundled
third-party notices are in LICENSE. The model card linked from the official
Hand Landmarker overview states Apache-2.0 on page 2.

Runtime uses VIDEO mode, two-hand capacity, CPU delegate and an 80ms minimum
frame interval. These are engineering settings, not linguistic rules or measured
phone performance. Input stays unmirrored. Provider handedness labels select the
canonical slot; low-confidence, conflicting or duplicate labels return uncertain.
Display mirroring and contain-letterboxing are handled only in the debug overlay.

This model detects hands; it does not recognize or validate BISINDO letters.
Occlusion, lighting and device performance can affect results. No device/user
accuracy percentage is claimed.

The package includes built-in usage telemetry to odml.pa.googleapis.com. The
application's enforced `connect-src 'self'` CSP blocks that external connection;
all model/runtime assets load from this origin. Development additionally permits
local WebSocket hot reload. No raw frames or landmarks are logged or persisted.
Supabase integration must later allow only its configured origin, retaining the
block on vendor telemetry. Do not remove the CSP to silence vendor console errors.

Checks cover package/asset parity, canonical ordering, ambiguous output, required
hands, contain/mirror geometry, real browser model startup, missing-model retry,
and VIDEO inference from a licensed reference fixture. Test fixture streams are
not production input and are not evidence of live BISINDO recognition accuracy.
