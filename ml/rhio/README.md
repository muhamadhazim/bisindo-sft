# Reproducible C/L/O training

See [model card](../../public/models/rhio-clo-v1/README.md) for the exact pipeline,
license, runtime, split limitations and local reproduction commands.

`manifest.json` pins source revision, Git blob and SHA256 hashes, source labels,
parent groups and partitions. Do not merge collectedimages with train/test: those
are duplicate copies. Only C/L/O are selected. `evaluation.json` records training
options, calibration and correlated held-out row results, plus source-linked
golden vectors for browser/extractor parity. No camera data from users is present.

Training now fails before fitting if extracted labels, source checksums, parent
partitions, ticks or feature schema disagree with the manifest. Every usable
cached vector is recalculated from its recorded frame using the actual runtime
extractor (1e-10 floating-point tolerance). Image hashes are checked before
extraction. Re-running verified training produced the same model SHA256; no
inference threshold or browser behavior changed in this validation checkpoint.
