# Colab training: A-Z, Rhio + Sanjaya

Open `BISINDO_Alphabet_Combined_Colab.ipynb` in Google Colab and run cells in order.
CPU runtime is sufficient. Both publishers' original images download automatically.
Only one version of each image is selected; checksums and source labels are checked.
The notebook does not need repository credentials or webcam access.

Output: `bisindo-alphabet-results.zip` containing a candidate forest, per-letter and
per-source evaluation, confusion chart, provenance, source snapshot and attribution.
The browser feature extractor is embedded from this project. Do not overwrite the
current C/L/O production model: A-Z runtime/content integration and live validation
are still required. Static photo classification is not dynamic sign recognition.

Original-image splits cannot establish signer independence because signer/session
metadata is unavailable. Exact duplicates are reconciled; visually similar separate
captures may remain. Source-label compatibility needs review before correctness use.

Verified locally: notebook JSON and every Python cell parse; bundled JavaScript
syntax; repository lint/typecheck and relevant training contract tests. Full combined
training and execution in a hosted Colab runtime have not been performed here.

Regenerate the self-contained notebook after changing its helper scripts:
`node scripts/colab/build-notebook.mjs`.
