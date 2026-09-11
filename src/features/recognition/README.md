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
