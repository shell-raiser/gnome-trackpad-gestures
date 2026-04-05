# Implementation notes

## 1) Multi-window jump in one swipe

The key change from "one swipe == one step" behavior is:

- Keep an active gesture session from `BEGIN` to `END`.
- Track **cumulative** delta (`accumulatedDx`) instead of per-update threshold reset.
- Derive selected MRU index as:

```text
selectedIndex = clamp(anchorIndex + trunc(-accumulatedDx / pixelsPerStep), 0, windowCount - 1)
```

This enables 1 → 3 navigation with one long swipe when there are 3 windows.

## 2) Preview rendering strategy

Best practical approach in GNOME Shell extension code:

1. Try `window.get_compositor_private().get_texture()` and create `Clutter.Clone`.
2. If texture is unavailable (special windows / race conditions), use fallback label/icon.
3. Keep thumbnails light and fixed size to avoid frame drops during gesture updates.

## 3) Why this approach is robust

- No activation happens mid-gesture; activation only at `END`.
- User can scrub left/right between candidates while fingers stay on touchpad.
- Popup gives visual confidence by showing actual window snapshots.
