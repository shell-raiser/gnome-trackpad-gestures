# Implementation notes

## Requested behavior adjustments

1. **Preview size inside thumbnail boxes**
   - Preview clone uses explicit thumbnail width/height.
   - Preview dimensions are now user-configurable in extension preferences.

2. **Lower swipe sensitivity**
   - Sensitivity now configurable from preferences via:
     - `swipe-gain`
     - `pixels-per-step`

3. **Disable end-to-end looping**
   - Wrapped index behavior is disabled by default.
   - Selection is clamped at start/end of the MRU list.

4. **Short swipe without popup**
   - Popup is shown only when swipe reaches long-swipe threshold (`popup-reveal-steps`).
   - If threshold is not reached, release performs one-step MRU switch with no popup.

5. **Swipe direction mapping**
   - Step mapping uses the direct sign of gesture delta so swipe direction is no longer inverted.

## Settings integration

- Added GSettings schema: `org.gnome.shell.extensions.gnome-trackpad-gestures`.
- Added `prefs.js` UI so users can control sensitivity and preview size in Extensions app.
