# Alphabet MLP v2

User-authorized experimental A–Z integration, 2026-09-12. This supersedes the
C/L/O-only scope for this local trial, not human validation or release gates.

Original inputs remain untouched and ignored under ml/bisindo-mlp2-clean-results,
ml/bisindo-dataset-raw-backup and the supplied Colab notebook. No retraining.
Install requirements.txt in an isolated environment; run scripts/export-alphabet.py,
scripts/verify-alphabet-features.mjs and scripts/prepare-onnx-assets.mjs.

Export uses ONNX 1.22.0 and ORT Python 1.30.0; browser uses ORT Web 1.29.0.
Input float_input: float32 [batch,52]. Output out_activations_result: [batch,26].
The graph is extracted at the existing Softmax; original weights are unchanged.
Canonical feature extraction remains hands-geometry-v1/world-palm-scale-v1.

26 train-reference envelopes use equal presence masks, leave-group-out nearest
distances from train+validation, ceiling-index p99, multiplier 1.8. Accept only
unique highest probability >=0.5 inside its envelope. No zero-hand acceptance.

Original/derived Python parity and exact validation/test confusion were verified.
Validation: 321 correct,97 wrong,246 uncertain. Test:367 correct,100 wrong,215
uncertain. There are 2169 train,664 validation,682 test usable samples; 5273 total.
Signer/session IDs are unknown. These are source-photo labels, not measured live
accuracy. IMAGE/VIDEO tracking differences, unknown poses and physical devices
need separate tests. The 52 features do not encode relative inter-hand position.

replay.json contains all 682 held-out feature vectors and expected probabilities
for browser parity; it is not shipped to the application. No user camera data.

Sources: Rhio Sutoyo et al., MIT (license in runtime package); Samuel Ady Sanjaya,
2024, BISINDO Indonesian Sign Language: Alphabet Image Data v1,
https://doi.org/10.17632/ywnjpbcz8m.1, CC BY 4.0. Feature derivatives preserve
attribution. The UI must not present model output as linguistic validation.
