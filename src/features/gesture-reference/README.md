# HANDSIGN source-linked hand character

Original procedural palm/finger geometry and SVG, with a small smiling green
wrist cuff that does not cover the articulating fingers. C/L/O implemented first.
Joints come from licensed source-photo Tasks landmarks, never guessed gestures.
The SVG front projection and 3D renderer read the same pose coordinates.

Only the front projection is source-observed. Landmark z is relative to each
wrist, so inter-hand depth and hidden surfaces are not observed; rotation is
limited. This character is an approximate visual aid, not linguistic ground
truth. No source pixels appear in the generated assets. Human validation and
motion capture are not claimed. Research/dataset comparisons are documented in
the review records before expanding the catalogue.

3D loads on request only on observation pages. Local SVG is default and fallback.
Camera practice never imports the renderer. Bounded DPR, demand rendering,
context-loss fallback, route disposal and hidden-tab shutdown protect resources.

A–Z extension: all 26 photo-form references are now source-linked, with four
curriculum groups. GestureHand.radius scales visual finger thickness with the
source-projected palm length; both renderers use it. Viewpoint and PHOTO_SOURCE_ONLY
review are explicit. illustration-landmarks.json preserves X crop extraction and
S visible photo-point corrections independently from all model features. Consult
public/assets/signs/sinyal-v2/REVIEW.md for evidence and rendering limits.
