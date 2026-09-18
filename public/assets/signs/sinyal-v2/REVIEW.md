# HANDSIGN alphabet reference audit — 2026-09-12

## Scope and evidence

26 publisher-labelled original Rhio photographs were inspected together with
26 original Sanjaya comparison photographs. Source IDs, SHA256, URLs, and selected
joint coordinates are in src/features/gesture-reference/reviewed-hands.json and
poses.json. All source photos remain internal review material. Character assets
contain original geometry; no source pixels or person's likeness is reused.

Primary: Rhio Sutoyo et al., Indonesian Sign Language (BISINDO) Hand Sign Detection
Dataset, revision e1a48c6caa9d12318c8561e9962da845ab50226e, MIT.
Comparison: Samuel Ady Sanjaya (2024), BISINDO Indonesian Sign Language: Alphabet
Image Data v1, DOI https://doi.org/10.17632/ywnjpbcz8m.1, CC BY 4.0.
Regional scope is unknown. SOURCE_VERIFIED means checked against these photo
references only, never human-validator approval or a universal language form.

## Reviewed hand requirements

ONE: C,E,I,J,L,O,R,U,V,Z.
TWO: A,B,D,F,G,H,K,M,N,P,Q,S,T,W,X,Y.

The requirements are based on visual inspection plus Indra et al. (2019), section
3.1, https://doi.org/10.1016/j.procs.2019.11.101. They are NOT inferred from the
number of hands successfully detected by MediaPipe. Incomplete detections occur
in the training corpus and must not make a two-hand teaching target one-handed.

## Photo comparison observations

A: paired index/thumb triangle. B/D/F/K/P/T: fingers of one hand contact an upright
finger of the other, with different combinations/orientations. G: two closed
hands. H: two upright indices with a connecting digit. M/N: differing numbers of
contacting digits against the other palm. Q/S: two-hand curved/contact arrangements.
W: two-hand outer indices and central contact. X: crossed fingers. Y: second hand
contacts the first; the second hand is less obvious in the wider Rhio photo.
C/E/I/L/U/V: corresponding one-hand silhouettes were visible in both sources.
These are inspection notes, not new geometric recognition rules or correction
tolerances. Character poses retain the selected primary photograph's orientation.

O: the first comparison file was undecodable (also a recorded training-data
failure), and a usable replacement was fetched and checksum-verified. That
Sanjaya sample shows a thumb/index contact with other fingers extended, unlike
the rounded Rhio sample. Do not combine these into an invented universal pose;
the character follows the recorded Rhio O and the UI discloses source variation.

J/R: https://ojs.uajy.ac.id/index.php/jbi/article/view/12013 explicitly discusses
dynamic elements. Z: static photographs do not settle the full movement and
published descriptions differ. J/R are DYNAMIC, Z is UNKNOWN. All three permit
only the explicitly labelled POSE_SNAPSHOT exercise, never motion acceptance.
Other entries represent the reviewed static photo forms; the entire prototype
still disclaims complete gesture or regional validity pending human review.

## Rendering limitations

The front projection preserves image-relative joint positions and inter-hand
layout. Joint depth is MediaPipe's per-wrist relative depth, so unseen surfaces,
precise fingertip contact and relative depth between hands are approximate.
Orbit is limited; the front view is the source-observed reference. The same pose
drives SVG fallback and the original 3D palm/finger geometry. Character geometry
is not used as model input or a perfect-pose coaching template.

There are no synthetic training images, horizontal flips, guessed correction
bounds, or trained-model accuracy claims based on the rendered character.

## Character projection QA

All 26 generated posters were compared with the selected source photo sheet.
Original fixed-width bones were too thin to communicate source finger contact;
visual radius now scales with the source-projected palm length and is stored in
each GestureHand, shared by SVG and 3D. This is illustration thickness, never a
recognition constraint. X illustration landmarks were re-extracted in IMAGE mode
from a tighter crop of the same checksum-verified photo (both handedness scores
>0.998), preserving the visible crossed indices. S source-visible thumb IP/tip
were annotated at (337,234)/(309,238) in the original 640x480 photo to correct the
landmark estimate away from visible contact. All remaining joints retain source
estimates. Evidence, crop, coordinate transform and purpose are retained in
illustration-landmarks.json. No pose points were substituted into classifier
features, envelopes, training or probability tests. Rendering remains approximate,
especially hidden joints, inter-hand depth and dynamic forms, pending human review.
