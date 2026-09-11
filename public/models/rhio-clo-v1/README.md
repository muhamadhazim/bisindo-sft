# C/L/O browser classifier

Trained artifact: `rhio-clo-rf-v1` version 1.0.0, EXPERIMENTAL for local user trials.
It predicts C, L, O or abstains. It does not recognize other letters, dynamic
motion, linguistic correctness, coaching instructions, scores or mastery.

- Dataset: Rhio Sutoyo et al., [BISINDO Hand-Sign Detection Dataset](https://github.com/rhiosutoyo/Indonesian-Sign-Language-BISINDO-Hand-Sign-Detection-Dataset), MIT; license included.
- Source labels C/L/O were checked against XML annotations; preview examples
  were inspected and agree with the current source-reviewed C/L/O handshapes.
  Region is unspecified. This is SOURCE_VERIFIED, not VALIDATOR_VERIFIED.
- 60 original C/L/O images; 35 train, 13 validation, 12 publisher test images.
  Three VIDEO extraction ticks per image stay in the same partition. No flip,
  augmentation, frame-random split, or inferred signer identity.
- All usable source hands were labeled RIGHT by the provider. Left-hand input
  abstains; no automatic reflection or handedness exchange is introduced.
- MediaPipe Tasks Vision 1.0.1, hand_landmarker float16 v1, CPU VIDEO,
  numHands=2, detection/presence/tracking=0.5; canonical handedness gates remain
  in force. Feature schema hands-geometry-v1 / world-palm-scale-v1, 52 values.
- Classifier: ml-random-forest 2.1.0, 80 trees, seeded training. The same library
  reads its native JSON in the browser; no sklearn/TF.js conversion is claimed.
- Vote cutoff selected on validation; distance envelope from training and
  validation rejects geometry outside the observed domain. Neither is exposed
  as gesture accuracy. Unknown-pose rejection still needs live trials.
- Held-out publisher test: 31 matching, 5 uncertain, 0 wrong over 36 correlated
  extraction rows from 12 photos. These are not 36 independent people/tests.
  Signer/session metadata is unavailable; this is not unseen-person accuracy.

The app processes live frames locally. No frames or user landmark histories are
stored or transmitted. The shipped reference photographs are licensed dataset
assets, not captures from users. The browser downloads the classifier only after
camera start. Production use here is a visibly labeled user-test prototype,
explicitly authorized by the user; it is not DEMO_APPROVED or a completed MVP.

Reproduce with the pinned Node/npm versions and a local server on port 3000:

```sh
npm ci
node scripts/prepare-rhio-dataset.mjs
node scripts/extract-rhio-landmarks.mjs
node scripts/train-rhio-classifier.mjs
npm run build
npm test
```

Manifest, checksums, partitions and evaluation: `ml/rhio/`. Images and extracted
landmark rows remain in ignored `.tools/bisindo-dataset`. Browser fixtures use
three unmodified, attributed publisher test photographs. They prove runtime
integration, not new-user generalization. A user can now try their own hand.

Live feedback update: current-pose status is independent of attempt acceptance.
After a match, another recognized letter immediately yields RETRY; ambiguous or
missing hands yield UNCERTAIN/NO_HAND. Returning to the target settles for 400ms
and shows CORRECT again without requiring the hand to leave the camera. Only the
one-shot acceptance event retains the no-hand release gate. Predicted-letter and
status changes publish on the next processed frame, bypassing the 250ms heartbeat.
No model weights, thresholds or dataset were changed by this UI/recognition fix.
