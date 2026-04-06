# Implementation notes

## Requested behavior adjustments

1. **Single-window 3-finger behavior**
   - The extension captures 3-finger gestures even with one window in scope.
   - Short swipe does nothing (stays on current window).
   - Long swipe opens popup with one window.

2. **Popup visibility over fullscreen**
   - Popup is added via top chrome with `trackFullscreen: false` so it remains visible above fullscreen apps.

3. **Preview size control preserves aspect ratio**
   - Replaced width/height knobs with one `preview-scale` percentage.
   - Per-window thumbnail width is derived from that window's aspect ratio.

4. **4-finger behavior**
   - Normal 4-finger swipe behavior is left to GNOME defaults.
   - Optional add-ons: 4-finger tap opens notification list and 4-finger swipe down shows desktop.

5. **3-finger swipe down behavior**
   - Vertical 3-finger swipe down shows desktop.

6. **Window scope parity with GNOME switcher**
   - Attempts to read `org.gnome.shell.window-switcher::current-workspace-only`.
   - Uses extension fallback if GNOME setting is unavailable.

7. **Edge clamping and duration mode**
   - Outward movement at ends is discarded to avoid dead-distance debt.
   - Short vs long swipe classification remains duration-based.
