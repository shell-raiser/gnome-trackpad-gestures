# gnome-trackpad-gestures

This repository contains a GNOME Shell extension prototype that addresses two gaps in common swipe-to-switch-window extensions:

1. **Single long swipe should traverse multiple windows** in MRU order (without lifting fingers).
2. **Switcher popup should show live window previews** (thumbnails), not icons only.

## UX Goal

When 3 windows are open, the user can start on Window 1, perform one long horizontal swipe,
reach Window 3 in the same gesture, and release to activate Window 3.

## High-level approach

- Capture touchpad horizontal swipes with a gesture tracker.
- Keep a gesture session active until fingers are released.
- Convert cumulative gesture progress into a selected MRU index.
- Present a switcher popup that updates continuously while swiping.
- Render each candidate with icon + thumbnail preview.

See `src/gestureSwitcher.js` and `src/previewPopup.js` for implementation details.
