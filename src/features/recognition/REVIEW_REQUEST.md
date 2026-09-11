# Review needed before correctness feedback

Scope already confirmed: alphabet MVP, realtime webcam, initially C/L/O. This
review does not ask to change that scope or supply uploaded practice videos.

Open the local app at `/learn/alfabet-awal` and compare the three examples in
each letter's observation page. They are source-verified Sanjaya v1 images
(CC BY 4.0), not yet individually approved by a human validator for this app.

| Letter | Review page | Source examples |
| --- | --- | --- |
| C | `/lesson/huruf-c/observe` | c-0, c-60, c-120 |
| L | `/lesson/huruf-l/observe` | l-0, l-60, l-120 |
| O | `/lesson/huruf-o/observe` | o-0, o-60, o-120 |

For each letter, record:

1. Which examples/variations are acceptable under the intended reference, and
   which should not be used as a correctness target. Cite the reference/region
   if known; leave unknown region explicit.
2. Whether a particular physical hand is required or exchanging hands is allowed.
   Detector labels alone do not decide that language rule.
3. A brief description or traceable reference for a near-miss that should be
   rejected, and the visible distinction from an acceptable form.

Reviewer and review date: **pending**. Per-letter decisions: **pending**.
No numeric angle thresholds are requested from the reviewer. Engineering will
calibrate those against reviewed examples, record false positives and run live
attempts. Initial timing and synthetic tests do not substitute for that evidence.

Then test real webcam attempts for C/L/O, no-hand, near-misses and target changes,
including an unseen participant before demo acceptance. Save aggregate outcomes
only; the current app does not record or upload camera images.
