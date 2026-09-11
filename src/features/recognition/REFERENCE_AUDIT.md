# Recognition reference audit — 2026-09-11

The six-observation nearest-reference experiment is **NOT accepted for the
production camera path**. It is retained for reproducibility and comparison.
The UI still provides tracking only. No model confidence is a correctness score.

## What existing implementations teach us

- [Krisna realtime BISINDO](https://github.com/KrisnaSantosa15/realtime-bisindo-classification): MIT code, MediaPipe landmarks then a trained classifier and realtime OpenCV. Its README describes 312 original images and explicitly acknowledges limited live accuracy. The [augmentation notebook](https://github.com/KrisnaSantosa15/realtime-bisindo-classification/blob/main/BISINDO_Classifier_With_Data_Augmentation.ipynb) uses legacy `mp.solutions.hands`, detection-order feature concatenation, horizontal flipping, and random row splitting after augmentation. Those steps cannot be adopted unchanged: derivative leakage can inflate evaluation; handedness and Tasks parity must be explicit. Random Forest files cannot be loaded by TensorFlow.js Layers.
- [Spellhand](https://github.com/luthfidi/spellhand): MIT; reusable architectural ideas are per-finger checks, feedback separation and stable acceptance. Its actual letter rules are ASL, not evidence for BISINDO thresholds. No rules or assets were copied.
- [Silent-Vox](https://github.com/JazzIsOnTheBeat/Silent-Vox): conceptual sequence reference; its README describes legacy MediaPipe, backend inference, WebSockets and Colab/ngrok. That deployment does not fit our browser-local camera architecture. README claims MIT, but this audit did not verify a root LICENSE file; no reuse performed.
- [Raden–Asshafi dataset](https://data.mendeley.com/datasets/4xnkvr88tk/1): publisher confirms 26 alphabet labels, seven participants, varying orientations and CC BY 4.0. This is a stronger candidate for varied-person research than six reference observations. Per-image signer/session mapping still needs checking before any signer-independent split claim. Its teaching forms must be source-compared before replacing the current C/L/O material.

## Rejected experiment and reproducibility

`reference-model.json` contains 12 measurements of six Sanjaya observations
(original and resized versions). It has no independent validation subjects.
`reference-matcher.ts` is imported by tests only. Its acceptance neighborhoods
are half the nearest other-class distance on the same canonical hand side;
these are geometric experimental bounds, not calibrated linguistic tolerances.

With the local server running, using the pinned Node runtime:

```sh
node scripts/inspect-reference-landmarks.mjs
node scripts/inspect-reference-landmarks.mjs --originals
node scripts/build-reference-model.mjs
node scripts/inspect-reference-landmarks.mjs --sequence
node scripts/evaluate-reference-replay.mjs
```

The sequence probe repeats each licensed image for 12 timestamped frames and
changes its fit from 440px to 480px within 640x480. No webcam is used, and this is
neither new-person evaluation nor extra independent training data.

| Source observation | Usable / 12 | Target matches / 12 |
| --- | ---: | ---: |
| C-0 | 11 | 1 |
| C-60 | 0 | 0 |
| C-120 | 12 | 12 |
| L-0 | 12 | 0 |
| L-60 | 12 | 11 |
| L-120 | 0 | 0 |
| O-0 | 0 | 0 |
| O-60 | 12 | 12 |
| O-120 | 12 | 12 |

The attempted integrated browser acceptance test also failed on L-0 despite
visible tracking. The exact cause (framing, tracking evolution, geometry/model
sensitivity) has not been isolated. No threshold was loosened to hide the
failure. Production wiring was withdrawn; the existing tracking E2E remains.
No accuracy percentage is claimed. Passing source-vector self-match unit tests
only verifies mechanics, not suitability for users.

## Application to our platform

The required pipeline remains webcam -> Tasks landmarks -> canonical features ->
BISINDO target recognizer -> timed acceptance -> separate coaching/scoring.
Database storage does not solve recognition. A defensible candidate needs:

1. Source-reviewed C/L/O observations covering multiple people and both observed
   hand sides; no inferred mirror equivalence.
2. A manifest with source, label, checksum, signer/session group and parent asset.
   Group split happens before augmentation; originals/resizes stay together.
3. The same pinned Tasks asset and feature extractor for training and runtime;
   compare geometry against normalized landmark candidates on held-out groups.
4. Threshold selection on validation groups including other letters and unknown
   poses; then untouched group evaluation and actual webcam trials.
5. Browser-compatible export and parity tests before enabling the user path.
   Only expand alphabet coverage after this initial recognition spike works.

Human review validates teaching/coaching claims. It does not prevent building
and evaluating this technical pipeline. Phase 4 is incomplete because the
current candidate also fails a technical runtime test, not merely because no
mentor has supplied numerical thresholds.
