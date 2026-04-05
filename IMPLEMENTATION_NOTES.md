# Implementation notes

## Requested behavior adjustments

1. **Preview size inside thumbnail boxes**
   - The preview actor now uses `Clutter.Clone` with explicit `width`/`height` matching thumbnail bounds.
   - This prevents tiny top-left previews caused by aggressive manual scaling.

2. **Lower swipe sensitivity**
   - `swipeGain` reduced to `1`.
   - `pixelsPerStep` increased and scaled from monitor width.

3. **Disable end-to-end looping**
   - Wrapped index behavior disabled (`_wrapSelection = false`).
   - Selection clamps to first/last window when swiping beyond either end.

4. **Hide popup for short swipes**
   - Popup is no longer shown on gesture begin.
   - Popup appears only after motion passes `popupRevealDistance`.
