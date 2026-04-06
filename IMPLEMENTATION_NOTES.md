# Implementation notes

## Requested behavior adjustments

1. **Edge clamping without dead-distance debt**
   - When the gesture hits the first/last window, extra outward movement is discarded.
   - Internally, accumulated delta is snapped back to the clamped edge step so returning inward starts immediately.

2. **4-finger swipe behavior**
   - 4-finger swipes are not intercepted by this extension.
   - GNOME handles desktop swipe direction and animation with default behavior.

3. **Popup center alignment with auto-resize**
   - Popup uses actor preferred size (`get_preferred_size`) for centering.
   - Falls back to estimated size only when preferred size is unavailable.

4. **Preview size and title truncation**
   - Preview clone uses explicit thumbnail width/height.
   - Window title is single-line, width-bound, and ellipsized to avoid expanding item width.
   - Render size auto-scales down for many windows so the popup remains on-screen.

5. **Settings integration**
   - GSettings schema and `prefs.js` expose sensitivity and preview controls.
   - Runtime loads settings safely and falls back to defaults if schema is unavailable.

6. **Short vs long swipe detection**
   - Classification is based on gesture duration (`long-swipe-duration-ms`), not travel distance.
