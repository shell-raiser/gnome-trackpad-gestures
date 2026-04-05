# Implementation notes

## Gesture handling fixes

To address "short swipes work but long swipes behave the same", this version does:

- Keep cumulative swipe tracking through the entire gesture session.
- Apply a swipe gain to gesture deltas so long swipes can cross multiple window steps.
- Use a lower `pixelsPerStep` (scaled from monitor width) and `Math.trunc` to convert motion into multi-step index changes.
- Keep wrapped indexing so both swipe directions are responsive.

## Popup visibility fixes

To address "popup not showing in the middle", this version does:

- Render the popup via `Main.layoutManager.addTopChrome(...)`.
- Center popup with explicit width/height estimates based on thumbnail dimensions and window count.
- Keep popup alive until gesture end/cancel.

## Thumbnail fallback

- Preferred: compositor texture clone (`Clutter.Clone`)
- Fallback: app icon + app title
