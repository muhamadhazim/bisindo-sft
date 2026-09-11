# Phase 4 recognition spike — incomplete

The production page currently offers hand tracking only. It does not instantiate
this rule engine or claim correctness, XP, or lesson completion. Accepted rule
profiles are empty because no defensible, calibrated bounds have been accepted.

## Feature contract

`hands-geometry-v1`, `world-palm-scale-v1`, 52 numbers:

- indices 0–24: LEFT hand; 25–49: RIGHT hand, selected by provider handedness;
- indices 50, 51: left/right presence flags;
- per hand: 10 internal finger-joint angles divided by pi (thumb through little,
  proximal then distal); 4 thumb-tip-to-other-tip distances; 5 wrist-to-tip
  distances; 3 adjacent non-thumb tip distances; palm unit normal xyz.

Distances use world landmarks divided by wrist-to-middle-MCP length. Translation
and positive uniform scale do not change these features. Palm orientation is
retained; hands are not reflected, rotated, or merged. Missing hand block is zero
plus presence flag zero. Missing world points, degenerate bones/palm, nonfinite
values and landmarks outside the visible frame are rejected. Source analysis and
runtime use this exact extractor and the same pinned Tasks model; no legacy or
Python extraction pipeline is substituted.

Rule metadata must match schema, normalization, vector length and landmark asset.
No rule can be used without source identifiers and valid feature bounds. Draft,
missing, overlapping, unsupported-target and out-of-envelope results remain
UNCERTAIN. A uniquely recognized different supported sign yields RETRY. Model
confidence and numerical similarity are not exposed as gesture correctness.

Initial timing: 400ms match, 250ms observed no-hand release, 500ms cooldown,
maximum 250ms between observations. Target changes require release; a held pose
cannot produce duplicate acceptance. These engineering values still require live
validation. CORRECT/RETRY are the public states required by AGENTS; MATCH/NON_MATCH
are internal candidates only. Tests use explicitly synthetic shapes, not letters.

## Reference audit and real blocker

`node scripts/inspect-reference-landmarks.mjs` runs the pinned CPU VIDEO model
against the nine licensed publisher images, with no webcam. It compiles the same
canonicalizer/feature extractor for a temporary test-browser route. Nothing is
added to the production routes. Start the local server first. The ignored report
is `.tools/references/landmark-analysis.json`.

In the 2026-09-11 run, after aspect-preserving placement on a 640x480 canvas:

| Reference | Usable feature vector | Provider hand |
| --- | --- | --- |
| C-0 | yes | Right |
| C-60 | no hand detected | — |
| C-120 | yes | Right |
| L-0 | yes | Left |
| L-60 | yes | Right |
| L-120 | no hand detected | — |
| O-0 | no hand detected | — |
| O-60 | yes | Right |
| O-120 | yes | Left |

These are detector observations, not human handedness annotations or accuracy
metrics. No horizontal flipping was used to invent missing reference coverage.

The original-resolution versions were then fetched by exact publisher filename
and verified against the publisher's SHA256. Repeating the identical VIDEO and
feature pipeline still produced the same six usable samples and three missing
detections. The original/resized versions are the same source observations; they
must not be counted as separate subjects or split between training and test.
Run `node scripts/inspect-reference-landmarks.mjs --originals` to repeat this
check. It downloads missing originals to the ignored `.tools/references/originals`
folder, verifies checksums, and writes `.tools/references/landmark-analysis-originals.json`.
Original source URLs/license/checksums are tracked
in `original-references.json`. The production reference images are unchanged.

Only one useful sample exists for each observed L/O side in this reviewed set.
It cannot establish acceptable pose ranges, invalid near-misses, or regional
hand-exchange semantics. Higher-resolution or additional source-reviewed samples
can improve detector coverage; they do not establish linguistic tolerances alone.

Before activating correctness feedback, a BISINDO mentor/validator needs to
confirm acceptable variations and near-miss distinctions for these reference
forms, followed by live C/L/O acceptance and false-positive tests. Alphabet scope
is already settled and is not being asked again. No uploaded/prerecorded-video
practice flow is being introduced. This is the unresolved Phase 4 gate; later
phases have not been skipped.

## 2026-09-11 experiment update

A nearest-reference candidate was implemented and tested but failed the integrated
L-0 acceptance check and a repeated-frame/framing probe. It is not wired into the
production practice page. See [reference audit](REFERENCE_AUDIT.md) for measured
results, comparisons with existing projects, and reproducible commands. The
candidate remains experimental; source-vector self-matches are not an accuracy
benchmark. Technical dataset and classifier evaluation can continue without
requiring a mentor to invent numerical thresholds first.

## Current classifier (supersedes tracking-only status above)

The user explicitly authorized training from the Rhio Sutoyo dataset and trying
the initial classifier themselves, narrowed to C/L/O only. `clo-classifier.ts`
now serves the realtime practice path using a genuinely trained Random Forest;
`reference-matcher.ts` remains an archived experiment used only by its tests.
See `public/models/rhio-clo-v1/README.md` and `ml/rhio/` for source, model, metrics,
reproduction and limitations. Actual live user acceptance is still pending.
