# Local alphabet practice session

PracticeSession is independent from the classifier and camera. It consumes current
timestamped assessments and owns one receipt per session/target/attempt. It counts
unique accepted letters only. Entry at C runs C through F; no credit for A or B.
Manual selection changes targets without scoring skipped letters. No persistence.

Flow: PRACTICING -> CELEBRATING -> AWAITING_CONTINUE -> PREPARING_NEXT -> PRACTICING.
The final Continue enters SUMMARY. The 1.5s success timer is in PracticeExperience;
CSS duration comes from practiceTiming, reduced motion bypasses animation. Timing
for stabilization/release/cooldown/gap is shared recognitionTiming (400/250/500/250ms).
Tracking continues behind the receipt, but no second receipt is accepted. A held
pose cannot complete another target. Continue and repeat reuse observed release
since acceptance; changing target manually requires fresh release. Attempt changes
reset the classifier and invalidate outstanding results in use-hand-tracking.

Stop/hidden tab aborts camera lifetime, clears release continuity and finishes the
receipt without automatic target advancement. Restarting camera is manual. Route
exit disposes timers, tracker, stream and model. Actions and animation callbacks
are guarded by controller state/receipt IDs; double clicks cannot skip letters.
Summary reflects attempts received by an experimental model, never mastery.

Regressions: practice-session.spec.ts (deterministic timeline),
alphabet-practice.spec.ts (real MediaPipe VIDEO + ONNX on licensed photo fixtures),
camera.spec.ts and frame-scheduler.spec.ts (cleanup/races). Photo replay is not
live human validation. Camera practice never loads the 3D reference renderer.
