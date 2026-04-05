# gnome-trackpad-gestures
I've vibe coded this extension since the next best touchpad gestures extension (https://github.com/amarullz/windowgestures) was not enough for me.
I am using this extension and will keep fixing bugs whenever I discover one. You can try it if you want to (maybe I'll setup a Action to give a packed zip?)

I want the touchpad gestures to work as similar as the gestures in Windows, that's the goal.

I have'nt  tried to look at any of this code right now, may be I'll review it after a certain stage.

-----
GNOME Shell extension prototype focused on touchpad window switching.

## Expected behavior

- A **short swipe** switches to the next recent window directly (no popup).
- A **long swipe** enters multi-window selection and shows the preview popup.
- Swiping direction maps directly to list movement (left swipe goes left, right swipe goes right).
- Selection clamps at the list edges (no wrap-around).

## Install locally

```bash
UUID="gnome-trackpad-gestures@example.com"
DEST="$HOME/.local/share/gnome-shell/extensions/$UUID"
cp -r extension.js prefs.js metadata.json stylesheet.css src schemas "$DEST"/
glib-compile-schemas "$DEST/schemas"   # safe to run even though gschemas.compiled is bundled
gnome-extensions enable "$UUID"
```

On X11: press `Alt+F2`, run `r` to reload shell.
On Wayland: log out and back in.

## Settings

Open **Extensions** app → this extension → **Preferences** to tune:
- swipe sensitivity (`swipe-gain`, `pixels-per-step`)
- long-swipe popup threshold (`popup-reveal-steps`)
- short-swipe threshold (`short-swipe-distance`)
- preview thumbnail size (`preview-width`, `preview-height`)
- automatic down-scaling when many windows are open so the popup fits on screen

Tested target shell range in metadata: GNOME Shell 45-49.
